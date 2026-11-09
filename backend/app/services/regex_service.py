"""
Indian License Plate Format Validation and Optical Error Correction
Part of: Vehicle Document Verification System using ANPR (Phase 2 & 3)
Implements regex validation, positional heuristic correction, HSRP stripe artifact removal, and fuzzy string matching.
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
# 1. Standard Indian State Series: e.g. KA01AB1234, HR26DQ5551, DL04C5678 (Max 2 series letters per CMVR)
STANDARD_PLATE_REGEX = re.compile(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$')
LEGACY_PLATE_REGEX = re.compile(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$')

# 2. Bharat (BH) Series: e.g. 22BH1234AA, 23BH5678B
BHARAT_SERIES_REGEX = re.compile(r'^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$')

# Common Optical Misread Substitution Tables
LETTER_TO_DIGIT = {
    'O': '0', 'D': '0', 'Q': '0',
    'I': '1', 'L': '1', 'T': '1', 'J': '1',
    'Z': '2',
    'E': '3',
    'A': '4',
    'S': '5',
    'G': '6', 'C': '6',
    'B': '8', 'R': '8'
}

DIGIT_TO_LETTER = {
    '0': 'D',  # Under CMVR rules, 'O' is prohibited; 0 can be misread for D or Q
    '1': 'I',
    '2': 'Z',
    '3': 'E',
    '4': 'A',
    '5': 'S',
    '6': 'G',
    '8': 'B'
}

# Optical Confusion Sets for Indian License Plate series and district glyphs
OPTICAL_SERIES_CONFUSIONS = {
    'M': {'N', 'W', 'RN', 'NN'},
    'N': {'M', 'H', 'II', 'U'},
    'Q': {'D', '0', 'O', 'G'},
    'D': {'Q', '0', 'O', 'B'},
    '0': {'D', 'Q', 'O'},
    'O': {'D', 'Q', '0'},
    'B': {'8', 'P', 'R'},
    '8': {'B', '3'},
    'Z': {'2', '7'},
    '2': {'Z', '71', '21'},
    '71': {'2', 'Z', '7I'},
    'S': {'5'},
    '5': {'S'},
    'I': {'1', 'L', 'T', 'J'},
    '1': {'I', 'L', 'T', 'J'}
}

# Optical Prefix Repair: Handles HSRP blue band / hologram optical misreads on initial state letters
STATE_OPTICAL_PREFIX_REPAIR = {
    # K misreads (K -> FI, 4, X, H, IC)
    "FIL": "KL", "4L": "KL", "XL": "KL", "HL": "KL", "ICL": "KL",
    "FIA": "KA", "4A": "KA", "XA": "KA", "HA": "KA", "ICA": "KA",
    # D misreads (D -> 0, O, Q)
    "0L": "DL", "OL": "DL", "QL": "DL",
    "0D": "OD", "OD": "OD",
    # M misreads (M -> RN, AA, NN)
    "RNH": "MH", "AAH": "MH",
    "RNL": "ML",
    "RNP": "MP",
    # T misreads (T -> 7, I, Y)
    "7N": "TN", "YN": "TN", "IN": "TN",
    "7S": "TS", "YS": "TS",
    "7R": "TR", "YR": "TR",
    # G misreads (G -> 6, C, Q)
    "6J": "GJ", "CJ": "GJ", "QJ": "GJ",
    "6A": "GA", "CA": "GA",
    # U misreads (U -> V, 0, O)
    "VP": "UP", "0P": "UP", "OP": "UP",
    "VK": "UK", "0K": "UK",
    # A misreads (A -> 4)
    "4P": "AP", "4R": "AR", "4S": "AS", "4N": "AN",
    # H misreads (H -> 11, II, N)
    "11R": "HR", "IIR": "HR", "NR": "HR",
    "11P": "HP", "IIP": "HP",
    # B misreads (B -> 8, P, R)
    "8R": "BR", "PR": "BR",
    # P misreads (P -> R, F)
    "FB": "PB", "RB": "PB",
    "FY": "PY", "RY": "PY",
}

def extract_true_plate_start(text: str) -> str:
    """
    Scans for the true Indian State Code or Bharat Series prefix,
    stripping leading noise caused by the blue HSRP left stripe, Ashoka Chakra, or border glare.
    Example: 'HHR26DO555J' -> 'HR26DO555J'
             'FIL58463406' -> 'KL58463406'
             'E4L584634061' -> 'KL584634061'
             'INDHR26DQ5551' -> 'HR26DQ5551'
    """
    if not text or len(text) < 8:
        return text

    best_match = None
    best_priority = -1

    # 1. Search for Indian State Code followed by true district digits
    for st in INDIAN_STATE_CODES:
        start_search = 0
        while True:
            idx = text.find(st, start_search)
            if idx == -1:
                break
            remaining = text[idx:]
            if 8 <= len(remaining) <= 12:
                c1 = remaining[2] if len(remaining) > 2 else ''
                c2 = remaining[3] if len(remaining) > 3 else ''
                priority = 0
                if c1.isdigit() and c2.isdigit():
                    priority = 10  # State + 2 true digits (e.g. HR26, KA01, KL58)
                elif c1.isdigit():
                    priority = 8   # State + 1 true digit (e.g. DL1)
                elif c1 in '0123456789ODIZ' and c2 in '0123456789ODIZ':
                    priority = 5   # Digit-like characters
                elif c1 in '0123456789ODIZ':
                    priority = 3
                
                if priority > best_priority:
                    best_priority = priority
                    best_match = remaining
            start_search = idx + 1

    if best_match and best_priority >= 5:
        return best_match

    # 2. Check for Optical State Prefix repairs (e.g. FIL58 -> KL58, 4L58 -> KL58)
    for prefix, target in STATE_OPTICAL_PREFIX_REPAIR.items():
        idx = text.find(prefix)
        if idx != -1:
            remaining = text[idx + len(prefix):]
            if len(remaining) >= 6:
                c1 = remaining[0] if len(remaining) > 0 else ''
                c2 = remaining[1] if len(remaining) > 1 else ''
                if (c1.isdigit() or c1 in '0123456789ODIZ') and (c2.isdigit() or c2 in '0123456789ODIZ'):
                    cand = target + remaining
                    if 8 <= len(cand) <= 12:
                        return cand

    # 3. Check for Bharat (BH) Series e.g. '22BH...', 'X22BH...'
    bh_idx = text.find("BH")
    if bh_idx >= 2:
        year_cand = text[bh_idx - 2:bh_idx]
        if year_cand.isdigit() or all(c in "0123456789ODIZ" for c in year_cand):
            remaining = text[bh_idx - 2:]
            if 8 <= len(remaining) <= 11:
                return remaining

    return best_match if best_match else text

def clean_ocr_text(raw_text: str) -> str:
    """
    Cleans raw OCR string:
    - Removes whitespace, dashes, dots, underscores, special characters
    - Converts to uppercase
    - Strips 'IND' / 'INDIA' watermarks and leading HSRP border noise
    - Strips trailing frame screws, rivets, or watermark noise (e.g. trailing 'N', 'M', ']')
    """
    if not raw_text:
        return ""
    text = re.sub(r'[^A-Za-z0-9]', '', raw_text).upper()
    
    # Strip standalone or prefixed 'IND' / 'INDIA'
    if text.startswith('IND') and len(text) > 8:
        text = text[3:]
    elif text.startswith('INDIA') and len(text) > 10:
        text = text[5:]

    if text.endswith('IND') and len(text) > 8:
        text = text[:-3]
    elif text.endswith('INDIA') and len(text) > 10:
        text = text[:-5]

    # Strip any leading HSRP border noise before the true state code or BH series
    text = extract_true_plate_start(text)

    # Bharat series plates (e.g. 22BH1234AA) end with 1 or 2 letters after 4 digits.
    # Only standard state series (e.g. KA01AB1234) should strip trailing letter noise like screws.
    is_bh_candidate = bool(re.search(r'^[0-9OIZ]{2}(?:BH|8H)', text))
    if not is_bh_candidate:
        text = re.sub(r'([0-9]{4})[A-Za-z]+$', r'\1', text)
            
    return text

def is_valid_plate(plate: str) -> bool:
    """Checks whether the plate string conforms to standard Indian or BH series format."""
    if not plate:
        return False
    if BHARAT_SERIES_REGEX.match(plate):
        return True
    if STANDARD_PLATE_REGEX.match(plate):
        return plate[:2] in INDIAN_STATE_CODES
    return False

def correct_positional_errors(text: str) -> str:
    """
    Applies contextual character substitution based on standard Indian plate anatomy:
    [0:2]   State code -> Must be Letters (from INDIAN_STATE_CODES)
    [2:4]   District code -> Must be Digits (01 to 99)
    [4:-4]  Series -> Must be Letters (No 'O' or 'I' per CMVR rules)
    [-4:]   Registration number -> Must be Digits
    """
    text = extract_true_plate_start(text)
    if len(text) < 8 or len(text) > 11:
        return text

    # Check if Bharat Series candidate (e.g. 22BH9988AA or optical misread ZZ8H9988AA)
    bh_pattern = text[2:4] in ['BH', '8H', '8A', 'BA', '3H']
    is_bh_cand = False
    if len(text) >= 8:
        if bh_pattern:
            is_bh_cand = True
        elif len(text) >= 9 and any(c in '0123456789ODIZ' for c in text[0:2]) and ('B' in text[2:4] or 'H' in text[2:4]):
            is_bh_cand = True

    if is_bh_cand:
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
    
    # Check if state code matches known state; if invalid, apply optical substitution
    state_candidate = "".join(chars[:2])
    if state_candidate not in INDIAN_STATE_CODES:
        c0, c1 = chars[0], chars[1]
        if c1 == 'B':
            # In India, only WB (West Bengal) and PB (Punjab) end with 'B'
            chars[0] = 'PB' if c0 in ['P', 'R', 'F', 'D', 'B'] else 'WB'
        elif c1 == 'R':
            # BR, HR, AR, TR
            chars[0] = 'BR' if c0 in ['B', '8'] else ('AR' if c0 == 'A' else 'HR')
        elif c1 == 'L':
            # DL, KL, ML, NL
            chars[0] = 'DL' if c0 in ['D', '0', 'O', 'Q', 'U'] else ('KL' if c0 in ['K', 'X', 'F'] else 'DL')
        elif c1 == 'H':
            # MH, CH, JH
            chars[0] = 'MH' if c0 in ['M', 'N', 'W', 'H'] else 'CH'
        elif c1 == 'J':
            # GJ, RJ
            chars[0] = 'RJ' if c0 in ['R', 'P', 'B'] else 'GJ'
        elif c1 == 'A':
            # KA, GA, LA
            chars[0] = 'KA' if c0 in ['K', 'X', 'H', 'N'] else 'GA'
        elif c1 == 'P':
            # UP, MP, AP, HP
            chars[0] = 'UP' if c0 in ['U', 'V', '0', 'O'] else ('MP' if c0 in ['M', 'N', 'W'] else 'AP')
        elif c1 == 'N':
            # TN, DN, MN, AN
            chars[0] = 'TN' if c0 in ['T', 'I', '1', '7', 'J'] else 'DN'
        elif c1 == 'D':
            # OD, DD, LD
            chars[0] = 'OD' if c0 in ['0', 'O', 'Q', 'C', 'D'] else 'DD'
        else:
            match, score, _ = process.extractOne(state_candidate, INDIAN_STATE_CODES, scorer=fuzz.ratio)
            if score >= 50:
                chars[0] = match[0]
                chars[1] = match[1]

    # 2. District Code (Index 2, 3 or Index 2): Must be digits
    # Handle single digit district vs 2-digit district
    if len(chars) >= 9 and chars[3].isalpha() and chars[4].isalpha() and "".join(chars[-4:]).isdigit():
        # Single digit district e.g. DL1C1234
        chars[2] = LETTER_TO_DIGIT.get(chars[2], chars[2])
    elif len(chars) >= 8:
        # Standard 2-digit district
        # First digit (Index 2)
        if chars[2] in '1ILTJ|':
            chars[2] = '1'
        else:
            chars[2] = LETTER_TO_DIGIT.get(chars[2], chars[2])
        
        # Second digit (Index 3)
        c3 = chars[3]
        if chars[2] == '1' and c3 in ['G', 'A', 'H', 'L']:
            # Highly prevalent OCR misread for '4' (open top or L-bracket with crossbar e.g. RJ14 Jaipur, HR14, DL14, UP14)
            chars[3] = '4'
        elif chars[2] == '1' and c3 in ['Z']:
            chars[3] = '2'
        elif chars[2] == '1' and c3 in ['S']:
            chars[3] = '5'
        elif chars[2] == '1' and c3 in ['B']:
            chars[3] = '8'
        elif c3 in ['G']:
            chars[3] = '4' if chars[2] in '123' else '6'
        elif c3 in '1ILTJ|':
            chars[3] = '1'
        else:
            chars[3] = LETTER_TO_DIGIT.get(c3, c3)

    # 3. Last 4 characters: Must be digits
    for i in range(len(chars) - 4, len(chars)):
        chars[i] = LETTER_TO_DIGIT.get(chars[i], chars[i])

    # 4. Intermediate series: Must be letters
    # 'O' is substituted to 'D' if optical confusion occurred; 'Q' is a legitimate series character (e.g. HR26DQ5551).
    start_series = 3 if (len(chars) >= 9 and not chars[3].isdigit()) else 4
    end_series = len(chars) - 4
    for i in range(start_series, end_series):
        if chars[i].isdigit():
            chars[i] = 'D' if chars[i] == '0' else DIGIT_TO_LETTER.get(chars[i], chars[i])
        elif chars[i] == 'O':
            chars[i] = 'D'

    corrected = "".join(chars)
    return corrected

def prune_extra_series_characters(text: str, known_plates: Optional[List[str]] = None) -> str:
    """
    Intelligently cleans multi-line or reflective plate noise where phone UI, screw rivets,
    or glare inject extra characters into the registration series.
    Example: 'GJ27ZQZ7002' -> strips prohibited 'Q'/'O' and extracts true 10-char plate.
    """
    if len(text) <= 10:
        return text
    state = text[:2]
    if state not in INDIAN_STATE_CODES:
        return text
    if not (text[2:4].isdigit() and text[-4:].isdigit()):
        return text
    rto = text[2:4]
    digits = text[-4:]
    series = text[4:-4]
    
    # Priority: If known plates is available, match exact vehicle
    if known_plates:
        for kp in known_plates:
            if kp.startswith(f"{state}{rto}") and kp.endswith(digits):
                return kp

    # 1. Strip 'O' (prohibited in series due to confusion with digit 0)
    clean_series = series.replace('O', '')
    if len(clean_series) in [1, 2]:
        cand = f"{state}{rto}{clean_series}{digits}"
        if is_valid_plate(cand):
            return cand

    # 2. Try all 2-character sub-slices
    for i in range(len(series) - 1):
        s2 = series[i:i+2]
        if 'O' not in s2:
            cand = f"{state}{rto}{s2}{digits}"
            if known_plates and cand in known_plates:
                return cand
            if is_valid_plate(cand):
                return cand

    for char in series:
        if char != 'O':
            cand = f"{state}{rto}{char}{digits}"
            if is_valid_plate(cand):
                return cand

    return text

def resolve_registered_optical_neighbor(candidate: str, known_plates: List[str]) -> Optional[str]:
    """
    Intelligently checks whether an OCR candidate (even if superficially regex-valid)
    is an optical misread of an existing registered vehicle in the database.
    
    Guarantees:
    1. NEVER hijacks a different vehicle: Trailing 4 digits MUST match exactly.
    2. State code MUST match exactly.
    3. Resolves standard glyph confusions:
       - M <-> N (e.g. KA20NG5550 -> KA20MG5550)
       - D / 0 / O <-> Q (e.g. HR26DD5551 -> HR26DQ5551)
       - 2 / Z / 7I <-> 71 (e.g. HR2H0003 -> HR71H0003)
       - B <-> 8, S <-> 5, I <-> 1
    """
    if not candidate or not known_plates:
        return None
    cand_clean = candidate.replace(' ', '').upper()
    if len(cand_clean) < 7:
        return None
    cand_digits = cand_clean[-4:] if len(cand_clean) >= 4 and cand_clean[-4:].isdigit() else None
    if not cand_digits:
        return None
    cand_state = cand_clean[:2]

    # Trailing digits constraint: only consider database vehicles with the exact same 4 digits
    candidates_with_same_digits = [kp for kp in known_plates if kp.endswith(cand_digits)]
    if not candidates_with_same_digits:
        return None

    for kp in candidates_with_same_digits:
        if kp[:2] != cand_state:
            continue
        
        # Candidate and database plate have identical state and trailing 4 digits
        kp_mid = kp[2:-4]
        cand_mid = cand_clean[2:-4]
        
        # If middle parts match identically
        if kp_mid == cand_mid:
            return kp
            
        # Same length series/district substitution check (e.g. 20NG vs 20MG, 26DD vs 26DQ)
        if len(kp_mid) == len(cand_mid):
            diffs = [(c1, c2) for c1, c2 in zip(kp_mid, cand_mid) if c1 != c2]
            if len(diffs) <= 2:
                all_optical = True
                for c_kp, c_cand in diffs:
                    if (c_cand not in OPTICAL_SERIES_CONFUSIONS.get(c_kp, set()) and 
                        c_kp not in OPTICAL_SERIES_CONFUSIONS.get(c_cand, set())):
                        all_optical = False
                        break
                if all_optical:
                    return kp
                    
        # Fused district digit check (e.g. 71 vs 2: HR71H vs HR2H / HRZH)
        if (cand_mid.startswith('2') or cand_mid.startswith('Z')) and kp_mid.startswith('71'):
            if cand_mid[1:] == kp_mid[2:]:
                return kp
                
        # High similarity optical match
        if fuzz.ratio(kp, cand_clean) >= 80:
            return kp

    return None

def fuzzy_match_against_database(candidate: str, known_plates: List[str], max_distance: int = 2) -> Optional[str]:
    """
    If OCR output is slightly distorted or invalid, find the closest matching valid registration plate
    from the seeded database if Levenshtein distance <= max_distance.
    Safety constraint: NEVER mutate the trailing 4 digits if candidate already has 4 valid digits.
    """
    if not candidate or not known_plates:
        return None
        
    result = process.extractOne(candidate, known_plates, scorer=fuzz.ratio)
    if result:
        match, score, _ = result
        if score >= 88:
            # Check trailing digits safety
            cand_digits = candidate[-4:] if len(candidate) >= 4 and candidate[-4:].isdigit() else None
            match_digits = match[-4:] if len(match) >= 4 and match[-4:].isdigit() else None
            if cand_digits and match_digits and cand_digits != match_digits:
                # Different vehicle digits! Do NOT hijack different vehicle
                return None
            return match
            
    return None

def process_and_correct_plate(raw_ocr_text: str, known_plates: Optional[List[str]] = None) -> Tuple[str, bool, float]:
    """
    Full validation and error-correction pipeline:
    1. Clean noise & whitespace
    2. Check exact validity with known database plates
    3. Apply positional heuristic substitution
    4. Resolve optical neighbor against registered database vehicles
    5. Validate format (CMVR standard: State + District + Series + Digits)
    6. Fallback to fuzzy database recovery ONLY if not already a valid format
    Returns: (final_plate, is_valid_format, confidence_modifier)
    """
    cleaned = clean_ocr_text(raw_ocr_text)
    if not cleaned:
        return "", False, 0.0

    # Priority 1: If cleaned text exactly matches a registered vehicle in database
    if known_plates and cleaned in known_plates:
        return cleaned, True, 1.0

    # Apply positional corrections (e.g. O -> 0, J -> 1, or series O -> D, FIL -> KL)
    corrected = correct_positional_errors(cleaned)
    
    # Prune extra noise characters / reflection artifacts in multi-line or glare scenarios
    if len(corrected) > 10:
        pruned = prune_extra_series_characters(corrected, known_plates)
        if is_valid_plate(pruned):
            corrected = pruned
    
    # Priority 2: Exact match with registered database vehicle
    if known_plates and corrected in known_plates:
        return corrected, True, 1.0

    # Priority 3: Resolve optical neighbor against registered database vehicles
    # Resolves common optical character errors (M/N, Q/D/0, 71/2) to verified registered vehicles
    # while strictly enforcing identical trailing 4 digits and state.
    if known_plates:
        optical_match = resolve_registered_optical_neighbor(corrected, known_plates)
        if not optical_match:
            optical_match = resolve_registered_optical_neighbor(cleaned, known_plates)
        if optical_match:
            return optical_match, True, 0.98

    # Priority 4: Conforms to standard Indian or Bharat series regex
    # Valid standalone plate (e.g. out-of-state or unregistered car)
    if is_valid_plate(corrected):
        return corrected, True, 0.95

    # Priority 5: If cleaned text was valid without positional modification
    if is_valid_plate(cleaned):
        return cleaned, True, 1.0

    # Priority 6: Fuzzy match against registered database vehicle as error recovery
    # ONLY executed if the plate is NOT already a valid format
    if known_plates:
        db_match = fuzzy_match_against_database(corrected, known_plates)
        if db_match:
            return db_match, True, 0.90

    # If not a valid Indian plate format, reject it cleanly
    return "", False, 0.0
