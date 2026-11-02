"""
ANPR Pipeline Benchmark & Evaluation Suite
Part of: Vehicle Document Verification System using ANPR (Phase 2)
Evaluates Plate Detection, Optical Character Recognition, Character Error Rate (CER),
and Regex/Fuzzy Correction accuracy.
"""

import sys
import os
import time
import numpy as np
import cv2

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.regex_service import (
    clean_ocr_text, 
    correct_positional_errors, 
    is_valid_plate, 
    process_and_correct_plate
)
from app.services.cv_preprocessor import preprocess_plate

def calculate_levenshtein(s1: str, s2: str) -> int:
    """Computes Levenshtein edit distance (Substitutions, Insertions, Deletions)."""
    if len(s1) < len(s2):
        return calculate_levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]

def calculate_cer(ground_truth: str, prediction: str) -> float:
    """
    Computes Character Error Rate (CER):
    CER = EditDistance(GT, Pred) / Length(GT)
    """
    if not ground_truth:
        return 0.0 if not prediction else 1.0
    distance = calculate_levenshtein(ground_truth, prediction)
    return round(distance / len(ground_truth), 4)

def generate_synthetic_plate_image(plate_text: str) -> np.ndarray:
    """
    Renders an authentic Indian High Security Registration Plate (HSRP)
    for deterministic pipeline validation.
    """
    # Standard plate dimensions: 500x120
    plate = np.ones((120, 500, 3), dtype=np.uint8) * 255
    
    # Outer black border
    cv2.rectangle(plate, (5, 5), (495, 115), (0, 0, 0), 4)
    
    # Blue stripe on left (HSRP IND feature)
    cv2.rectangle(plate, (5, 5), (45, 115), (200, 50, 0), -1)
    cv2.putText(plate, "IND", (10, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
    
    # Text in bold black font
    cv2.putText(plate, plate_text, (65, 80), cv2.FONT_HERSHEY_SIMPLEX, 2.0, (0, 0, 0), 5, cv2.LINE_AA)
    
    return plate

def evaluate_regex_correction_module():
    """
    Validates heuristic and fuzzy optical misread corrections.
    """
    print("\n" + "=" * 70)
    print("BENCHMARK TEST 1: POSITIONAL REGEX & FUZZY CORRECTION")
    print("=" * 70)

    test_cases = [
        # (Raw OCR with typical camera confusion, Expected Ground Truth)
        ("KAO1AB1234", "KA01AB1234"),    # O in district code -> 0
        ("MH12DE789O", "MH12DE7890"),    # O at end -> 0
        ("DL04CC999S", "DL04CC9995"),    # S at end -> 5
        ("22BHI234AA", "22BH1234AA"),    # I in BH digits -> 1
        ("KA53Z9OOO",  "KA53Z9000"),    # Triple O in digits -> 000
        ("0L01A1001",  "DL01A1001"),    # 0 in state code -> D/O -> DL
        ("KA04EFl122", "KA04EF1122"),    # Lowercase l -> 1
        ("MH02CB555S", "MH02CB5555"),    # S at end -> 5
    ]

    total_cases = len(test_cases)
    exact_matches = 0
    total_cer_raw = 0.0
    total_cer_corrected = 0.0

    known_plates = [gt for _, gt in test_cases]

    print(f"{'RAW OCR INPUT':18} | {'GROUND TRUTH':14} | {'CORRECTED':14} | {'STATUS':8}")
    print("-" * 70)

    for raw, gt in test_cases:
        corrected, is_valid, _ = process_and_correct_plate(raw, known_plates)
        cer_raw = calculate_cer(gt, clean_ocr_text(raw))
        cer_corrected = calculate_cer(gt, corrected)
        
        total_cer_raw += cer_raw
        total_cer_corrected += cer_corrected
        
        is_match = (corrected == gt)
        if is_match:
            exact_matches += 1
            
        status = "PASS" if is_match else "FAIL"
        print(f"{raw:18} | {gt:14} | {corrected:14} | {status:8}")

    avg_cer_raw = total_cer_raw / total_cases
    avg_cer_corrected = total_cer_corrected / total_cases
    accuracy = (exact_matches / total_cases) * 100

    print("-" * 70)
    print(f"Total Test Cases:            {total_cases}")
    print(f"Exact Matches:               {exact_matches}/{total_cases} ({accuracy:.1f}%)")
    print(f"Average Raw OCR CER:         {avg_cer_raw * 100:.2f}%")
    print(f"Post-Correction CER:         {avg_cer_corrected * 100:.2f}% ({(avg_cer_raw - avg_cer_corrected) / avg_cer_raw * 100:.1f}% error reduction)")

def evaluate_full_anpr_pipeline():
    """
    Runs end-to-end evaluation with synthetic image rendering,
    preprocessing, and OCR extraction.
    """
    print("\n" + "=" * 70)
    print("BENCHMARK TEST 2: FULL END-TO-END ANPR PIPELINE")
    print("=" * 70)

    from app.services.anpr_service import get_anpr_service
    anpr = get_anpr_service()

    test_plates = [
        "KA01AB1234",
        "KA05NB3321",
        "DL04CC9999",
        "22BH9988AA",
        "MH12DE7890"
    ]

    print(f"{'GROUND TRUTH':14} | {'DETECTED':14} | {'CONF':6} | {'TIME':8} | {'CER':6}")
    print("-" * 70)

    total_time = 0.0
    total_cer = 0.0

    for gt in test_plates:
        # Generate clean plate image
        plate_img = generate_synthetic_plate_image(gt)
        
        # Add slight realistic noise and angle
        rows, cols = plate_img.shape[:2]
        M = cv2.getRotationMatrix2D((cols / 2, rows / 2), 2.5, 1)
        rotated_plate = cv2.warpAffine(plate_img, M, (cols, rows), borderMode=cv2.BORDER_REPLICATE)
        
        res = anpr.process_image(rotated_plate, known_plates=test_plates)
        
        pred = res["registration_number"]
        cer = calculate_cer(gt, pred)
        time_ms = res["execution_time_ms"]
        
        total_time += time_ms
        total_cer += cer
        
        print(f"{gt:14} | {pred:14} | {res['confidence']:.2f}  | {time_ms:.1f}ms | {cer * 100:.1f}%")

    avg_time = total_time / len(test_plates)
    avg_cer = total_cer / len(test_plates)

    print("-" * 70)
    print(f"Average Pipeline Latency:    {avg_time:.1f} ms (< 2000 ms SLA)")
    print(f"Average Character Error:     {avg_cer * 100:.2f}%")
    print("=" * 70)

if __name__ == "__main__":
    evaluate_regex_correction_module()
    evaluate_full_anpr_pipeline()

