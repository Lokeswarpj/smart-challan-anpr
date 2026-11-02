"""
OpenCV Image Preprocessor for Number Plate OCR
Part of: Vehicle Document Verification System using ANPR (Phase 2)
Implements deskewing, bilateral filtering, CLAHE contrast enhancement, and adaptive binarization.
"""

import cv2
import numpy as np
from typing import Tuple, Optional

def deskew_plate(image: np.ndarray) -> np.ndarray:
    """
    Detects angle of text/plate contours and rotates image horizontally.
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        # Edge detection
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        
        # Look for the largest rectangular contour corresponding to plate boundary
        largest_area = 0
        best_angle = 0.0
        h, w = gray.shape
        total_area = h * w
        
        for c in contours:
            area = cv2.contourArea(c)
            if area > total_area * 0.2:  # Plate contour should be substantial
                rect = cv2.minAreaRect(c)
                angle = rect[-1]
                # Adjust OpenCV angle conventions
                if angle < -45:
                    angle = -(90 + angle)
                elif angle > 45:
                    angle = 90 - angle
                if abs(angle) < 40 and area > largest_area:
                    largest_area = area
                    best_angle = angle
                    
        if abs(best_angle) > 1.5 and abs(best_angle) < 35:
            # Perform affine rotation
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, best_angle, 1.0)
            deskewed = cv2.warpAffine(
                image, M, (w, h), 
                flags=cv2.INTER_CUBIC, 
                borderMode=cv2.BORDER_REPLICATE
            )
            return deskewed
    except Exception:
        pass
        
    return image

def enhance_plate_contrast(gray: np.ndarray) -> np.ndarray:
    """
    Applies Contrast Limited Adaptive Histogram Equalization (CLAHE)
    to handle uneven lighting, glare, or deep shadows on license plates.
    """
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    return enhanced

def preprocess_plate(plate_bgr: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Complete OpenCV preprocessing pipeline:
    1. Deskew perspective angle
    2. Resize to standard OCR height (e.g. 100px) while maintaining aspect ratio
    3. Bilateral filter for edge-preserving denoising
    4. CLAHE contrast enhancement
    5. Otsu's adaptive binarization
    Returns: (enhanced_grayscale, binarized_threshold)
    """
    if plate_bgr is None or plate_bgr.size == 0:
        raise ValueError("Invalid or empty image provided to preprocessor.")

    # 1. Deskew
    aligned = deskew_plate(plate_bgr)

    # 2. Convert to Grayscale
    if len(aligned.shape) == 3:
        gray = cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY)
    else:
        gray = aligned

    # 3. Standardize scale (height ~100px for optimal OCR receptive field)
    h, w = gray.shape
    if h < 80 or h > 200:
        scale = 100.0 / h
        new_w = int(w * scale)
        gray = cv2.resize(gray, (new_w, 100), interpolation=cv2.INTER_CUBIC)

    # 4. Bilateral filtering (smoothes sensor noise while preserving character edges)
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    # 5. CLAHE contrast adjustment
    enhanced = enhance_plate_contrast(denoised)

    # 6. Adaptive Otsu Binarization
    _, binarized = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Ensure background is bright and characters are dark (or vice versa for OCR)
    # Check if border is mostly white; if inverted, invert back
    total_pixels = binarized.size
    white_pixels = cv2.countNonZero(binarized)
    if white_pixels < total_pixels * 0.4:  # White characters on dark background
        binarized = cv2.bitwise_not(binarized)

    return enhanced, binarized

