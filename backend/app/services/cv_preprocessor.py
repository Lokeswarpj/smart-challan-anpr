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

def unsharp_mask(image: np.ndarray, amount: float = 1.8) -> np.ndarray:
    """
    Sharpens edges to cleanly separate fine strokes like 7, 1, I, H
    and prevent them from merging into curved shapes like 0, 6, or D.
    """
    blurred = cv2.GaussianBlur(image, (5, 5), 1.0)
    sharpened = float(amount + 1.0) * image - float(amount) * blurred
    return np.clip(sharpened, 0, 255).astype(np.uint8)

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
    2. Resize to high-clarity OCR height (~140px) while maintaining aspect ratio
    3. Bilateral filter for edge-preserving denoising
    4. Unsharp masking to accentuate thin character strokes (e.g. 7, 1, H)
    5. CLAHE contrast enhancement
    6. Otsu's adaptive binarization
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

    # 3. Standardize scale (height ~140px for optimal OCR stroke separation)
    h, w = gray.shape
    if h < 120 or h > 240:
        scale = 140.0 / h
        new_w = int(w * scale)
        gray = cv2.resize(gray, (new_w, 140), interpolation=cv2.INTER_LANCZOS4 if scale > 1 else cv2.INTER_AREA)

    # 4. Bilateral filtering (smoothes sensor noise while preserving character edges)
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    # 5. Unsharp masking for crisp stroke differentiation
    sharpened = unsharp_mask(denoised, amount=1.5)

    # 6. CLAHE contrast adjustment
    enhanced = enhance_plate_contrast(sharpened)

    # 7. Adaptive Otsu Binarization
    _, binarized = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Ensure background is bright and characters are dark (or vice versa for OCR)
    # Check if border is mostly white; if inverted, invert back
    total_pixels = binarized.size
    white_pixels = cv2.countNonZero(binarized)
    if white_pixels < total_pixels * 0.4:  # White characters on dark background
        binarized = cv2.bitwise_not(binarized)

    return enhanced, binarized

