"""
YOLOv8 License Plate Detector
Part of: Vehicle Document Verification System using ANPR (Phase 2)
Integrates Ultralytics YOLOv8 with fallback contour localization for robust plate isolation.
"""

import os
import cv2
import numpy as np
from ultralytics import YOLO
from typing import Tuple, Optional, Dict, Any

class PlateDetector:
    def __init__(self, weights_path: Optional[str] = None):
        """
        Initializes the YOLOv8 detector with weights.
        Defaults to 'yolov8n.pt' located in project root.
        """
        if weights_path and os.path.exists(weights_path):
            self.model_path = weights_path
        else:
            # Prioritize custom trained best.pt, fallback to yolov8n.pt
            root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
            custom_weights = os.path.join(root_dir, "ai_model", "best.pt")
            model_weights = os.path.join(root_dir, "ai_model", "yolov8n.pt")
            root_weights = os.path.join(root_dir, "yolov8n.pt")
            if os.path.exists(custom_weights):
                self.model_path = custom_weights
            elif os.path.exists(model_weights):
                self.model_path = model_weights
            elif os.path.exists(root_weights):
                self.model_path = root_weights
            else:
                self.model_path = "yolov8n.pt"

        print(f"[PlateDetector] Loading YOLOv8 model from: {self.model_path}")
        self.model = YOLO(self.model_path)

    def detect_plate(self, image: np.ndarray) -> Tuple[np.ndarray, Tuple[int, int, int, int], float]:
        """
        Detects and crops the license plate from an image.
        Returns:
            cropped_plate: np.ndarray
            bounding_box: (x1, y1, x2, y2)
            confidence: float (0.0 to 1.0)
        """
        h, w = image.shape[:2]
        
        # 1. Run YOLOv8 inference
        results = self.model.predict(image, conf=0.25, verbose=False)
        boxes = results[0].boxes
        
        best_crop = None
        best_box = (0, 0, w, h)
        best_conf = 0.50

        # Check detected objects
        if len(boxes) > 0:
            for box in boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                coords = box.xyxy[0].cpu().numpy().astype(int)
                x1, y1, x2, y2 = coords
                
                # Check if trained custom class for license plate (usually class 0 or 'license_plate')
                cls_name = self.model.names.get(cls_id, "")
                if "plate" in cls_name.lower() or cls_id == 0:
                    if conf > best_conf:
                        best_conf = conf
                        best_box = (x1, y1, x2, y2)
                        # Add slight 5% margin around the plate
                        pad_x = int((x2 - x1) * 0.05)
                        pad_y = int((y2 - y1) * 0.08)
                        crop_x1 = max(0, x1 - pad_x)
                        crop_y1 = max(0, y1 - pad_y)
                        crop_x2 = min(w, x2 + pad_x)
                        crop_y2 = min(h, y2 + pad_y)
                        best_crop = image[crop_y1:crop_y2, crop_x1:crop_x2]
                        break

                # If detected vehicle (car, motorcycle, bus, truck), look in vehicle lower half
                elif cls_name in ["car", "motorcycle", "bus", "truck"]:
                    veh_h = y2 - y1
                    # Plate is generally in the lower 40% of the vehicle
                    plate_zone_y1 = int(y1 + veh_h * 0.55)
                    plate_zone = image[plate_zone_y1:y2, x1:x2]
                    
                    # Refine via contour search inside the vehicle plate zone
                    refined_crop, rel_box = self._morphological_plate_search(plate_zone)
                    if refined_crop is not None and conf * 0.85 > best_conf:
                        best_conf = conf * 0.85
                        rx1, ry1, rx2, ry2 = rel_box
                        best_box = (x1 + rx1, plate_zone_y1 + ry1, x1 + rx2, plate_zone_y1 + ry2)
                        best_crop = refined_crop

        # 2. If YOLO did not isolate a plate, apply morphological search on whole image
        if best_crop is None:
            best_crop, box = self._morphological_plate_search(image)
            if best_crop is not None:
                best_box = box
                best_conf = 0.72

        # 3. Fallback: If image itself is already a tight cropped plate
        if best_crop is None or best_crop.size == 0:
            aspect = w / float(h)
            if 2.0 <= aspect <= 5.5:  # Standard plate aspect ratio
                best_crop = image
                best_box = (0, 0, w, h)
                best_conf = 0.80
            else:
                # Default to central 60%
                cx1, cy1 = int(w * 0.2), int(h * 0.3)
                cx2, cy2 = int(w * 0.8), int(h * 0.7)
                best_crop = image[cy1:cy2, cx1:cx2]
                best_box = (cx1, cy1, cx2, cy2)
                best_conf = 0.55

        return best_crop, best_box, best_conf

    def _morphological_plate_search(self, image: np.ndarray) -> Tuple[Optional[np.ndarray], Tuple[int, int, int, int]]:
        """
        Uses OpenCV morphological operations (Sobel, Otsu, rectangular aspect ratio filter)
        to identify high-density text plate candidates.
        """
        try:
            h, w = image.shape[:2]
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
            
            # Morphological gradient to highlight character vertical edges
            grad_x = cv2.Sobel(gray, cv2.CV_16S, 1, 0, ksize=3)
            abs_grad_x = cv2.convertScaleAbs(grad_x)
            
            # Blur and Otsu threshold
            blurred = cv2.GaussianBlur(abs_grad_x, (5, 5), 0)
            _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Close gaps between characters to form a single solid rectangular blob
            rect_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 3))
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, rect_kernel)
            
            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for c in sorted(contours, key=cv2.contourArea, reverse=True)[:5]:
                x, y, cw, ch = cv2.boundingRect(c)
                aspect = cw / float(ch)
                # Indian license plates typically have aspect ratios between 2.2 and 5.0
                if 2.0 <= aspect <= 5.5 and (cw * ch) > (w * h * 0.02):
                    crop = image[y:y+ch, x:x+cw]
                    return crop, (x, y, x+cw, y+ch)
        except Exception:
            pass
            
        return None, (0, 0, 0, 0)

