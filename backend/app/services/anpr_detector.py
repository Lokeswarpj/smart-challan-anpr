"""
YOLOv8 License Plate Detector
Part of: Vehicle Document Verification System using ANPR (Phase 2)
Integrates Ultralytics YOLOv8 with multi-candidate extraction and morphological fallback.
"""

import os
import cv2
import numpy as np
from ultralytics import YOLO
from typing import Tuple, Optional, Dict, Any, List

class PlateDetector:
    def __init__(self, weights_path: Optional[str] = None):
        """
        Initializes the YOLOv8 detector with weights.
        Defaults to 'yolov8n.pt' located in project root.
        """
        if weights_path and os.path.exists(weights_path):
            self.model_path = weights_path
        else:
            root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
            custom_weights = os.path.join(root_dir, "ai_model", "best.pt")
            s_weights = os.path.join(root_dir, "ai_model", "yolov8s.pt")
            n_weights = os.path.join(root_dir, "ai_model", "yolov8n.pt")
            root_s_weights = os.path.join(root_dir, "yolov8s.pt")
            root_n_weights = os.path.join(root_dir, "yolov8n.pt")
            
            if os.path.exists(custom_weights):
                self.model_path = custom_weights
            elif os.path.exists(s_weights):
                self.model_path = s_weights
            elif os.path.exists(root_s_weights):
                self.model_path = root_s_weights
            elif os.path.exists(n_weights):
                self.model_path = n_weights
            elif os.path.exists(root_n_weights):
                self.model_path = root_n_weights
            else:
                self.model_path = "yolov8s.pt"

        print(f"[PlateDetector] Loading YOLOv8 model from: {self.model_path}")
        self.model = YOLO(self.model_path)

    def detect_plate_candidates(self, image: np.ndarray) -> List[Tuple[np.ndarray, Tuple[int, int, int, int], float]]:
        """
        Detects all candidate plate bounding boxes with valid aspect ratio.
        Returns list of (cropped_plate, (crop_x1, crop_y1, crop_x2, crop_y2), confidence)
        sorted by confidence descending.
        """
        h, w = image.shape[:2]
        results = self.model.predict(image, conf=0.20, verbose=False)
        boxes = results[0].boxes
        
        candidates = []
        if len(boxes) > 0:
            for box in boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                coords = box.xyxy[0].cpu().numpy().astype(int)
                x1, y1, x2, y2 = coords
                bw = x2 - x1
                bh = y2 - y1
                box_aspect = bw / float(bh) if bh > 0 else 0.0
                
                cls_name = self.model.names.get(cls_id, "")
                if ("plate" in cls_name.lower() or cls_id == 0) and conf >= 0.20:
                    # Realistic Indian plate aspect ratios (standard rectangular 500x120mm ~4.17, tight crops ~5.2, two-line ~1.7).
                    # Reject overly extreme horizontal trim or tall vertical artifacts.
                    if 1.1 <= box_aspect <= 5.8:
                        refined_box = self._refine_plate_box(image, (x1, y1, x2, y2))
                        rx1, ry1, rx2, ry2 = refined_box
                        rbw = rx2 - rx1
                        rbh = ry2 - ry1

                        pad_x = max(4, int(rbw * 0.08))
                        pad_y = max(3, int(rbh * 0.10))
                        crop_x1 = max(0, rx1 - pad_x)
                        crop_y1 = max(0, ry1 - pad_y)
                        crop_x2 = min(w, rx2 + pad_x)
                        crop_y2 = min(h, ry2 + pad_y)
                        best_crop = image[crop_y1:crop_y2, crop_x1:crop_x2]
                        candidates.append((best_crop, refined_box, conf))

                elif cls_name in ["car", "motorcycle", "bus", "truck"]:
                    veh_h = y2 - y1
                    plate_zone_y1 = int(y1 + veh_h * 0.55)
                    plate_zone = image[plate_zone_y1:y2, x1:x2]
                    refined_crop, rel_box = self._morphological_plate_search(plate_zone)
                    if refined_crop is not None:
                        rx1, ry1, rx2, ry2 = rel_box
                        cand_box = (x1 + rx1, plate_zone_y1 + ry1, x1 + rx2, plate_zone_y1 + ry2)
                        candidates.append((refined_crop, cand_box, conf * 0.85))

        candidates.sort(key=lambda x: x[2], reverse=True)
        return candidates

    def _refine_plate_box(self, image: np.ndarray, bbox: Tuple[int, int, int, int]) -> Tuple[int, int, int, int]:
        """
        Refines a candidate bounding box to tightly fit the high-contrast license plate
        character region using Sobel-X edge density and contour analysis.
        Corrects vertical anchor drift into dark radiator recesses, grilles, or bumpers.
        """
        try:
            h, w = image.shape[:2]
            x1, y1, x2, y2 = bbox
            bw, bh = x2 - x1, y2 - y1
            if bw <= 0 or bh <= 0:
                return bbox
            
            sy1 = max(0, y1 - int(bh * 0.06))
            sy2 = min(h, y2 + int(bh * 0.28))
            sx1 = max(0, x1 - int(bw * 0.05))
            sx2 = min(w, x2 + int(bw * 0.05))
            
            roi = image[sy1:sy2, sx1:sx2]
            if roi.size == 0:
                return bbox
                
            gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY) if len(roi.shape) == 3 else roi
            
            sobelx = cv2.Sobel(gray_roi, cv2.CV_16S, 1, 0, ksize=3)
            abs_sobel = cv2.convertScaleAbs(sobelx)
            
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 3))
            closed = cv2.morphologyEx(abs_sobel, cv2.MORPH_CLOSE, kernel)
            _, thresh = cv2.threshold(closed, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            best_contour_box = None
            best_area = 0
            
            for c in contours:
                cx, cy, cw, ch = cv2.boundingRect(c)
                aspect = cw / float(ch) if ch > 0 else 0
                area = cw * ch
                if 1.6 <= aspect <= 5.2 and area > best_area and cw >= (bw * 0.55):
                    best_area = area
                    best_contour_box = (cx, cy, cw, ch)
                    
            if best_contour_box:
                cx, cy, cw, ch = best_contour_box
                margin_x = max(2, int(cw * 0.04))
                margin_y = max(2, int(ch * 0.08))
                rx1 = max(0, sx1 + cx - margin_x)
                ry1 = max(0, sy1 + cy - margin_y)
                rx2 = min(w, sx1 + cx + cw + margin_x)
                ry2 = min(h, sy1 + cy + ch + margin_y)
                return (rx1, ry1, rx2, ry2)
        except Exception:
            pass
        return bbox

    def detect_plate(self, image: np.ndarray) -> Tuple[Optional[np.ndarray], Tuple[int, int, int, int], float]:
        """
        Detects and crops the license plate from an image.
        Returns:
            cropped_plate: Optional[np.ndarray]
            bounding_box: (x1, y1, x2, y2)
            confidence: float (0.0 to 1.0)
        """
        h, w = image.shape[:2]
        candidates = self.detect_plate_candidates(image)
        if candidates:
            return candidates[0]

        best_crop, box = self._morphological_plate_search(image)
        if best_crop is not None:
            return best_crop, box, 0.72

        aspect = w / float(h)
        if 2.0 <= aspect <= 5.5 and w >= 80 and h >= 20:
            return image, (0, 0, w, h), 0.75

        return None, (0, 0, 0, 0), 0.0

    def _morphological_plate_search(self, image: np.ndarray) -> Tuple[Optional[np.ndarray], Tuple[int, int, int, int]]:
        """
        Uses OpenCV morphological operations (Sobel, Otsu, rectangular aspect ratio filter)
        to identify high-density text plate candidates.
        """
        try:
            h, w = image.shape[:2]
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
            
            grad_x = cv2.Sobel(gray, cv2.CV_16S, 1, 0, ksize=3)
            abs_grad_x = cv2.convertScaleAbs(grad_x)
            
            blurred = cv2.GaussianBlur(abs_grad_x, (5, 5), 0)
            _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            rect_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 3))
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, rect_kernel)
            
            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for c in sorted(contours, key=cv2.contourArea, reverse=True)[:5]:
                x, y, cw, ch = cv2.boundingRect(c)
                aspect = cw / float(ch)
                if 2.0 <= aspect <= 5.5 and (cw * ch) > (w * h * 0.02):
                    crop = image[y:y+ch, x:x+cw]
                    return crop, (x, y, x+cw, y+ch)
        except Exception:
            pass
            
        return None, (0, 0, 0, 0)
