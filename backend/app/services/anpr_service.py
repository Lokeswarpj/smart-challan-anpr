"""
Master ANPR Pipeline Orchestrator
Part of: Vehicle Document Verification System using ANPR (Phase 2)
Integrates YOLOv8 Plate Localization, OpenCV Preprocessing, EasyOCR Extraction, and Regex Error Correction.
"""

import time
import base64
import re
import cv2
import numpy as np
import easyocr
import torch
from typing import Dict, Any, Optional, List, Union, Tuple
from app.services.anpr_detector import PlateDetector
from app.services.cv_preprocessor import preprocess_plate
from app.services.regex_service import process_and_correct_plate, INDIAN_STATE_CODES

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

    def run_ocr(self, preprocessed_images: List[np.ndarray], known_plates: Optional[List[str]] = None) -> Tuple[str, float]:
        """
        Executes EasyOCR with character whitelist, confidence-based noise pruning,
        two-line / split plate layout reconstruction, and multi-candidate scoring.
        """
        whitelist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        best_text = ""
        best_score = -1.0
        best_conf = 0.0

        DISCARD_WORDS = {
            'IND', 'INDIA', 'GOVT', 'POLICE', 'SUZUKI', 'MARUTI', 'HONDA', 
            'HYUNDAI', 'HERO', 'TOYOTA', 'BAJAJ', 'YAMAHA', 'TVS', 'TATA', 
            'MAHINDRA', 'MOTORS', 'DEALER', 'SHOWROOM', 'SERVICE', 'AUTOMOBILES'
        }

        for img in preprocessed_images:
            try:
                results = self.ocr_reader.readtext(
                    img,
                    allowlist=whitelist,
                    paragraph=False,
                    detail=1
                )
                if not results:
                    continue

                # Filter out obvious dealer words, phone numbers, or isolated punctuation
                valid_detections = []
                for bbox, text, conf in results:
                    clean_piece = re.sub(r'[^A-Za-z0-9]', '', text).upper()
                    if not clean_piece or clean_piece in DISCARD_WORDS:
                        continue
                    # Ignore pure phone numbers (7+ digits)
                    if clean_piece.isdigit() and len(clean_piece) > 5:
                        continue
                    valid_detections.append((bbox, clean_piece, float(conf)))

                if not valid_detections:
                    continue

                # Generate candidates using different strategies:
                # 1. High-confidence filtered chunks (conf >= 0.20)
                # 2. All chunks
                candidate_sets = []
                high_conf_dets = [d for d in valid_detections if d[2] >= 0.20]
                if high_conf_dets:
                    candidate_sets.append(high_conf_dets)
                candidate_sets.append(valid_detections)

                for det_set in candidate_sets:
                    # Adaptive Y-band sorting (accounts for varying plate heights)
                    box_heights = [abs(d[0][2][1] - d[0][0][1]) for d in det_set]
                    med_h = np.median(box_heights) if box_heights else 25.0
                    y_band = max(15.0, med_h * 0.7)

                    # Strategy 1: Standard Reading Order (Top-to-Bottom by Y-band, then Left-to-Right by X)
                    sorted_by_reading_order = sorted(
                        det_set, 
                        key=lambda r: (round(r[0][0][1] / y_band), r[0][0][0])
                    )
                    cand_str_1 = "".join([d[1] for d in sorted_by_reading_order])

                    # Strategy 2: Two-Line / Square Plate Column Order (Left column GJ27 / FF, Right column 7002)
                    sorted_by_columns = sorted(
                        det_set,
                        key=lambda r: (round(r[0][0][0] / max(40.0, med_h * 2.0)), r[0][0][1])
                    )
                    cand_str_2 = "".join([d[1] for d in sorted_by_columns])

                    candidates_to_test = [cand_str_1]
                    if cand_str_2 != cand_str_1:
                        candidates_to_test.append(cand_str_2)

                    # Strategy 3: Structural Syntactic Recombination for 2-line and split plates (Prefix + Series + Suffix)
                    prefix_c, prefix_conf = "", 0.0
                    series_c, series_conf = "", 0.0
                    suffix_c, suffix_conf = "", 0.0

                    for d in det_set:
                        raw_c = d[1].strip("[]_ -.")
                        conf_val = float(d[2])
                        clean = raw_c
                        for st in INDIAN_STATE_CODES:
                            st_idx = raw_c.find(st)
                            if st_idx != -1 and len(raw_c[st_idx:]) >= 3 and raw_c[st_idx+2:st_idx+3].isdigit():
                                clean = raw_c[st_idx:]
                                break

                        if any(clean.startswith(st) for st in INDIAN_STATE_CODES):
                            if conf_val > prefix_conf:
                                prefix_c = clean
                                prefix_conf = conf_val
                        elif clean.isdigit() and 3 <= len(clean) <= 4:
                            if conf_val > suffix_conf:
                                suffix_c = clean
                                suffix_conf = conf_val
                        elif clean.isalpha() and len(clean) <= 3 and clean not in DISCARD_WORDS:
                            # Higher confidence series wins (e.g. true series FF with conf 0.87 beats glare CL with conf 0.33)
                            if conf_val > series_conf:
                                series_c = clean
                                series_conf = conf_val

                    if prefix_c and suffix_c:
                        cand_str_3 = f"{prefix_c}{series_c}{suffix_c}"
                        if cand_str_3 not in candidates_to_test:
                            candidates_to_test.insert(0, cand_str_3)

                    avg_conf = float(np.mean([d[2] for d in det_set])) if det_set else 0.0

                    for cand_text in candidates_to_test:
                        if len(cand_text) >= 7:
                            corrected, is_valid, mod = process_and_correct_plate(cand_text, known_plates)

                            # Scoring priorities:
                            # 1. Exact 10-char plate or known DB plate
                            length_bonus = 1.5 if (len(corrected) == 10 or (len(corrected) == 9 and len(corrected) > 3 and corrected[2].isdigit())) else 0.0
                            # 2. CMVR compliance (no 'O' in series)
                            cmvr_bonus = 1.0 if (len(corrected) >= 6 and 'O' not in corrected[4:6]) else 0.0
                            
                            priority_score = (avg_conf * mod) + (3.0 if is_valid else 0.0) + length_bonus + cmvr_bonus

                            if priority_score > best_score:
                                best_score = priority_score
                                best_text = cand_text
                                best_conf = avg_conf

                            # EARLY EXIT: If this pass yields a valid 10-character Indian plate format, stop immediately!
                            if is_valid and mod >= 0.95 and len(corrected) == 10 and cmvr_bonus > 0:
                                return best_text, best_conf
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

        orig_h, orig_w = image.shape[:2]

        # --- STAGE 1: Plate Detection (YOLOv8) ---
        t1 = time.perf_counter()
        cropped_plate, bbox, det_conf = self.detector.detect_plate(image)
        t_det = (time.perf_counter() - t1) * 1000
        telemetry_stages.append({
            "name": "Plate Localization (YOLOv8)",
            "status": "completed" if cropped_plate is not None else "failed",
            "time_ms": round(t_det, 1)
        })

        if cropped_plate is None:
            return {
                "detected": False,
                "registration_number": "",
                "raw_ocr": "",
                "confidence": 0.0,
                "is_valid_format": False,
                "bounding_box": None,
                "execution_time_ms": round(t_det, 1),
                "plate_image_base64": None,
                "pipeline_stages": telemetry_stages,
                "message": "No vehicle license plate detected in image."
            }

        # Standardize cropped plate height to 140px for optimal OCR character differentiation
        ch, cw = cropped_plate.shape[:2]
        if (ch < 110 or ch > 240) and ch > 0:
            scale = 140.0 / ch
            new_w = max(140, int(cw * scale))
            cropped_plate = cv2.resize(
                cropped_plate, (new_w, 140), 
                interpolation=cv2.INTER_LANCZOS4 if scale > 1 else cv2.INTER_AREA
            )

        # --- STAGE 2: Preprocessing (OpenCV) ---
        t2 = time.perf_counter()
        enhanced_gray, binarized = preprocess_plate(cropped_plate)
        
        # Priority order: Enhanced Grayscale first, then Raw Cropped, then HSRP-trimmed, then Binarized
        h, w = cropped_plate.shape[:2]
        ocr_images = [enhanced_gray, cropped_plate]
        if w > 80:
            hsrp_trimmed = cropped_plate[:, int(w * 0.10):]
            enhanced_trimmed, _ = preprocess_plate(hsrp_trimmed)
            ocr_images.extend([hsrp_trimmed, enhanced_trimmed])
        ocr_images.append(binarized)

        t_prep = (time.perf_counter() - t2) * 1000
        telemetry_stages.append({
            "name": "OpenCV Deskewing & Threshold",
            "status": "completed",
            "time_ms": round(t_prep, 1)
        })

        # --- STAGE 3: Character Recognition (EasyOCR) ---
        t3 = time.perf_counter()
        raw_ocr_text, ocr_conf = self.run_ocr(ocr_images, known_plates)
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

        if not is_valid or not final_plate:
            return {
                "detected": False,
                "registration_number": "",
                "raw_ocr": raw_ocr_text,
                "confidence": 0.0,
                "is_valid_format": False,
                "bounding_box": list(bbox) if bbox else None,
                "image_width": orig_w,
                "image_height": orig_h,
                "execution_time_ms": total_time_ms,
                "plate_image_base64": plate_b64,
                "pipeline_stages": telemetry_stages,
                "message": "Recognized text does not conform to valid Indian vehicle registration format."
            }

        return {
            "detected": True,
            "registration_number": final_plate,
            "raw_ocr": raw_ocr_text,
            "confidence": min(0.99, max(0.60, combined_confidence)),
            "is_valid_format": True,
            "bounding_box": list(bbox),
            "image_width": orig_w,
            "image_height": orig_h,
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


