"""
Master ANPR Pipeline Orchestrator
Part of: Vehicle Document Verification System using ANPR (Phase 2)
Integrates YOLOv8 Plate Localization, OpenCV Preprocessing, EasyOCR Extraction, and Regex Error Correction.
"""

import time
import base64
import cv2
import numpy as np
import easyocr
import torch
from typing import Dict, Any, Optional, List, Union, Tuple
from app.services.anpr_detector import PlateDetector
from app.services.cv_preprocessor import preprocess_plate
from app.services.regex_service import process_and_correct_plate

class ANPRService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        # Singleton pattern to avoid re-initializing heavy neural networks on every request
        if cls._instance is None:
            cls._instance = super(ANPRService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, yolo_weights: Optional[str] = None):
        if self._initialized:
            return
            
        print("[ANPRService] Initializing Neural Vision Pipeline...")
        self.use_gpu = torch.cuda.is_available()
        print(f"[ANPRService] Hardware Acceleration (CUDA): {self.use_gpu}")

        # 1. YOLOv8 Plate Detector
        self.detector = PlateDetector(weights_path=yolo_weights)

        # 2. EasyOCR Reader (English alphanumeric whitelist)
        print("[ANPRService] Initializing EasyOCR Reader...")
        self.ocr_reader = easyocr.Reader(['en'], gpu=self.use_gpu)

        self._initialized = True
        print("[ANPRService] ANPR Vision Pipeline Ready.")

    def run_ocr(self, preprocessed_images: List[np.ndarray]) -> Tuple[str, float]:
        """
        Executes EasyOCR with character whitelist and bounding box sorting.
        """
        whitelist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        best_text = ""
        best_conf = 0.0

        for img in preprocessed_images:
            try:
                results = self.ocr_reader.readtext(
                    img,
                    allowlist=whitelist,
                    paragraph=False,
                    detail=1
                )
                
                # Sort detections horizontally (left-to-right)
                results_sorted = sorted(results, key=lambda r: (r[0][0][1] // 30, r[0][0][0]))
                
                extracted_parts = []
                confs = []
                for bbox, text, conf in results_sorted:
                    clean_piece = text.strip()
                    if clean_piece:
                        extracted_parts.append(clean_piece)
                        confs.append(conf)
                        
                candidate_text = "".join(extracted_parts)
                avg_conf = float(np.mean(confs)) if confs else 0.0
                
                if len(candidate_text) >= 8 and avg_conf > best_conf:
                    best_text = candidate_text
                    best_conf = avg_conf
            except Exception as e:
                print(f"[ANPRService] OCR pass warning: {e}")

        return best_text, best_conf

    def process_image(
        self, 
        image_input: Union[str, bytes, np.ndarray], 
        known_plates: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        End-to-End Execution:
        Image -> YOLOv8 Detection -> OpenCV Deskew/Enhance -> EasyOCR -> Positional Regex -> Telemetry
        """
        start_total = time.perf_counter()
        telemetry_stages = []

        # 1. Load and decode image
        if isinstance(image_input, str):
            image = cv2.imread(image_input)
        elif isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif isinstance(image_input, np.ndarray):
            image = image_input
        else:
            raise ValueError("Unsupported image input format.")

        if image is None or image.size == 0:
            raise ValueError("Could not decode valid image pixels.")

        # --- STAGE 1: Plate Detection (YOLOv8) ---
        t1 = time.perf_counter()
        cropped_plate, bbox, det_conf = self.detector.detect_plate(image)
        t_det = (time.perf_counter() - t1) * 1000
        telemetry_stages.append({
            "name": "Plate Localization (YOLOv8)",
            "status": "completed",
            "time_ms": round(t_det, 1)
        })

        # --- STAGE 2: Preprocessing (OpenCV) ---
        t2 = time.perf_counter()
        enhanced_gray, binarized = preprocess_plate(cropped_plate)
        t_prep = (time.perf_counter() - t2) * 1000
        telemetry_stages.append({
            "name": "OpenCV Deskewing & Threshold",
            "status": "completed",
            "time_ms": round(t_prep, 1)
        })

        # --- STAGE 3: Character Recognition (EasyOCR) ---
        t3 = time.perf_counter()
        raw_ocr_text, ocr_conf = self.run_ocr([cropped_plate, enhanced_gray, binarized])
        t_ocr = (time.perf_counter() - t3) * 1000
        telemetry_stages.append({
            "name": "EasyOCR Character Extraction",
            "status": "completed",
            "time_ms": round(t_ocr, 1)
        })

        # --- STAGE 4: Positional Regex & Fuzzy Correction ---
        t4 = time.perf_counter()
        final_plate, is_valid, conf_mod = process_and_correct_plate(raw_ocr_text, known_plates)
        t_regex = (time.perf_counter() - t4) * 1000
        telemetry_stages.append({
            "name": "Indian Plate Regex Correction",
            "status": "completed",
            "time_ms": round(t_regex, 1)
        })

        total_time_ms = round((time.perf_counter() - start_total) * 1000, 1)

        # Base64 encode the cropped plate for officer visual confirmation
        _, buffer = cv2.imencode('.jpg', cropped_plate)
        plate_b64 = f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

        combined_confidence = round(float((det_conf * 0.4 + ocr_conf * 0.4 + conf_mod * 0.2)), 3)

        return {
            "detected": bool(final_plate),
            "registration_number": final_plate,
            "raw_ocr": raw_ocr_text,
            "confidence": min(0.99, max(0.50, combined_confidence)),
            "is_valid_format": is_valid,
            "bounding_box": list(bbox),
            "execution_time_ms": total_time_ms,
            "plate_image_base64": plate_b64,
            "pipeline_stages": telemetry_stages
        }

# Global singleton helper
_global_anpr_instance = None

def get_anpr_service() -> ANPRService:
    global _global_anpr_instance
    if _global_anpr_instance is None:
        _global_anpr_instance = ANPRService()
    return _global_anpr_instance

class LazyANPRServiceProxy:
    def __getattr__(self, name):
        return getattr(get_anpr_service(), name)

anpr_service = LazyANPRServiceProxy()


