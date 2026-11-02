"""
Indian License Plate Format Validation and Optical Error Correction
Part of: Vehicle Document Verification System using ANPR (Phase 2)
Implements regex validation, positional heuristic correction, and fuzzy string matching.
"""

import re
from rapidfuzz import process, fuzz
from typing import Optional, Tuple, List

# Standard 28 Indian States + 8 Union Territories
INDIAN_STATE_CODES = [
    "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DD", "DL", "DN", 
    "GA", "GJ", "HR", "HP", "JH", "JK", "KA", "KL", "LA", "LD", 
    "MH", "ML", "MN", "MP", "MZ", "NL", "OD", "PB", "PY", "RJ", 
    "SK", "TN", "TR", "TS", "UK", "UP", "WB"
]

# Standard Regex Formats
# 1. Standard Indian State Series: e.g. KA01AB1234, DL04C5678, KA03M1234
STANDARD_PLATE_REGEX = re.compile(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$')

# 2. Bharat (BH) Series: e.g. 22BH1234AA, 23BH5678B
BHARAT_SERIES_REGEX = re.compile(r'^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$')

# Common Optical Misread Substitution Tables
LETTER_TO_DIGIT = {
    'O': '0', 'D': '0', 'Q': '0',
    'I': '1', 'L': '1', 'T': '1',
    'Z': '2',
    'E': '3',
    'A': '4',
    'S': '5',
    'G': '6', 'C': '6',
    'B': '8', 'R': '8'
}

DIGIT_TO_LETTER = {
    '0': 'O',
    '1': 'I',
    '2': 'Z',
    '3': 'E',
    '4': 'A',
    '5': 'S',
    '6': 'G',
    '8': 'B'
}

def clean_ocr_text(raw_text: str) -> str:
    """
    Cleans raw OCR string:
    - Removes whitespace, dashes, dots, underscores
    - Converts to uppercase
    - Removes common watermarks like 'IND', 'INDIA' often stamped on high-security plates
    """
    if not raw_text:
        return ""
    text = re.sub(r'[^A-Za-z0-9]', '', raw_text).upper()
    
    # Strip leading or trailing 'IND' / 'INDIA' often stamped on high-security plates
    if text.startswith('IND') and len(text) > 8:
        candidate = text[3:]
        if any(candidate.startswith(st) for st in INDIAN_STATE_CODES) or (len(candidate) >= 8 and candidate[:2].isdigit()):
            text = candidate
    if text.endswith('IND') and len(text) > 8:
        text = text[:-3]
    elif text.endswith('INDIA') and len(text) > 10:
        text = text[:-5]
            
    return text

def is_valid_plate(plate: str) -> bool:
    """Checks whether the plate string conforms to standard Indian or BH series format."""
    if not plate:
        return False
    return bool(STANDARD_PLATE_REGEX.match(plate) or BHARAT_SERIES_REGEX.match(plate))

def correct_positional_errors(text: str) -> str:
    """
    Applies contextual character substitution based on standard Indian plate anatomy:
    [0:2]   State code -> Must be Letters
    [2:4]   District code -> Must be Digits
    [4:-4]  Series -> Must be Letters
    [-4:]   Registration number -> Must be Digits
    """
    if len(text) < 8 or len(text) > 11:
        return text

    # Check if Bharat Series candidate: starts with 2 digits or digit-letter like '22BH'
    if text[2:4] == 'BH' or (len(text) >= 9 and text[0:2].isdigit() and ('B' in text[2:4] or 'H' in text[2:4])):
        chars = list(text)
        # Pos 0-1: Digits (Year)
        chars[0] = LETTER_TO_DIGIT.get(chars[0], chars[0])
        chars[1] = LETTER_TO_DIGIT.get(chars[1], chars[1])
        # Pos 2-3: 'BH'
        chars[2] = 'B'
        chars[3] = 'H'
        # Pos 4-8: 4 Digits
        for i in range(4, min(8, len(chars))):
            chars[i] = LETTER_TO_DIGIT.get(chars[i], chars[i])
        # Pos 8+: Letters
        for i in range(8, len(chars)):
            chars[i] = DIGIT_TO_LETTER.get(chars[i], chars[i])
        corrected = "".join(chars)
        if BHARAT_SERIES_REGEX.match(corrected):
            return corrected

    # Standard Indian Plate
    chars = list(text)
    
    # 1. State Code (Index 0, 1): Must be letters
    chars[0] = DIGIT_TO_LETTER.get(chars[0], chars[0])
    chars[1] = DIGIT_TO_LETTER.get(chars[1], chars[1])
    
    # Check if state code matches known state; if close, correct it
    state_candidate = "".join(chars[:2])
    if state_candidate not in INDIAN_STATE_CODES:
        match, score, _ = process.extractOne(state_candidate, INDIAN_STATE_CODES, scorer=fuzz.ratio)
        if score >= 60:
            chars[0] = match[0]
            chars[1] = match[1]

    # 2. District Code (Index 2, 3 or Index 2): Must be digits
    chars[2] = LETTER_TO_DIGIT.get(chars[2], chars[2])
    if len(chars) >= 9 and chars[3].isalpha() and chars[4].isalpha() and "".join(chars[-4:]).isdigit():
        # Single digit district e.g. DL1C1234
        pass
    elif len(chars) >= 9:
        chars[3] = LETTER_TO_DIGIT.get(chars[3], chars[3])

    # 3. Last 4 characters: Must be digits
    for i in range(len(chars) - 4, len(chars)):
        chars[i] = LETTER_TO_DIGIT.get(chars[i], chars[i])

    # 4. Intermediate series: Must be letters
    start_series = 3 if (len(chars) >= 9 and not chars[3].isdigit()) else 4
    end_series = len(chars) - 4
    for i in range(start_series, end_series):
        chars[i] = DIGIT_TO_LETTER.get(chars[i], chars[i])

    corrected = "".join(chars)
    return corrected

def fuzzy_match_against_database(candidate: str, known_plates: List[str], max_distance: int = 2) -> Optional[str]:
    """
    If OCR output is slightly distorted, find the closest matching valid registration plate
    from the seeded database if Levenshtein distance <= max_distance.
    """
    if not candidate or not known_plates:
        return None
        
    result = process.extractOne(candidate, known_plates, scorer=fuzz.ratio)
    if result:
        match, score, _ = result
        # Score 80+ typically corresponds to 1 or 2 character edits in a 10-char string
        if score >= 80:
            return match
            
    return None

def process_and_correct_plate(raw_ocr_text: str, known_plates: Optional[List[str]] = None) -> Tuple[str, bool, float]:
    """
    Full validation and error-correction pipeline:
    1. Clean noise & whitespace
    2. Check exact validity
    3. Apply positional heuristic substitution
    4. RapidFuzz database match fallback
    Returns: (final_plate, is_valid_format, confidence_modifier)
    """
    cleaned = clean_ocr_text(raw_ocr_text)
    if not cleaned:
        return "", False, 0.0

    # If already fully valid
    if is_valid_plate(cleaned):
        return cleaned, True, 1.0

    # Apply positional corrections (e.g. O -> 0 or 8 -> B)
    corrected = correct_positional_errors(cleaned)
    if is_valid_plate(corrected):
        return corrected, True, 0.95

    # Fallback to database known plates if provided
    if known_plates:
        db_match = fuzzy_match_against_database(corrected, known_plates)
        if db_match:
            return db_match, True, 0.88

    return corrected, False, 0.50
