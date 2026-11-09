"""
Parivahan / VAHAN National Vehicle Registry Service
Simulates official Ministry of Road Transport and Highways (MoRTH) VAHAN database.
Provides seamless on-demand compliance profile generation for any scanned Indian vehicle.
"""

import random
import hashlib
from datetime import date, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.db.models import Vehicle, RCRecord, InsuranceRecord, PUCRecord, TaxRecord

# State and Major RTO directory
STATE_NAMES = {
    "AN": "Andaman and Nicobar", "AP": "Andhra Pradesh", "AR": "Arunachal Pradesh",
    "AS": "Assam", "BR": "Bihar", "CH": "Chandigarh", "CG": "Chhattisgarh",
    "DD": "Daman and Diu", "DL": "Delhi", "DN": "Dadra and Nagar Haveli",
    "GA": "Goa", "GJ": "Gujarat", "HR": "Haryana", "HP": "Himachal Pradesh",
    "JH": "Jharkhand", "JK": "Jammu and Kashmir", "KA": "Karnataka",
    "KL": "Kerala", "LA": "Ladakh", "LD": "Lakshadweep", "MP": "Madhya Pradesh",
    "MH": "Maharashtra", "MN": "Manipur", "ML": "Meghalaya", "MZ": "Mizoram",
    "NL": "Nagaland", "OD": "Odisha", "OR": "Odisha", "PB": "Punjab",
    "PY": "Puducherry", "RJ": "Rajasthan", "SK": "Sikkim", "TN": "Tamil Nadu",
    "TS": "Telangana", "TR": "Tripura", "UP": "Uttar Pradesh", "UK": "Uttarakhand",
    "UA": "Uttarakhand", "WB": "West Bengal", "BH": "Bharat Series (MoRTH Central)"
}

RTO_SPECIALIZATIONS = {
    "KL58": "KL-58 Thalassery RTO, Kannur/Kozhikode, Kerala",
    "KA20": "KA-20 Udupi RTO, Karnataka",
    "HR71": "HR-71 Bilaspur / Gurugram, Haryana",
    "KA01": "KA-01 Koramangala RTO, Bengaluru, Karnataka",
    "KA02": "KA-02 Rajajinagar RTO, Bengaluru, Karnataka",
    "KA03": "KA-03 Indiranagar RTO, Bengaluru, Karnataka",
    "KA04": "KA-04 Yeshwanthpur RTO, Bengaluru, Karnataka",
    "KA05": "KA-05 Jayanagar RTO, Bengaluru, Karnataka",
    "KA53": "KA-53 KR Puram RTO, Bengaluru, Karnataka",
    "MH12": "MH-12 Pune Central RTO, Maharashtra",
    "MH02": "MH-02 Mumbai West (Andheri) RTO, Maharashtra",
    "MH01": "MH-01 Mumbai Central (Tardeo) RTO, Maharashtra",
    "DL01": "DL-01 Mall Road RTO, North Delhi",
    "DL03": "DL-03 Sheikh Sarai RTO, South Delhi",
    "DL04": "DL-04 Janakpuri RTO, West Delhi",
    "DL05": "DL-05 Loni Road RTO, North East Delhi",
    "TN01": "TN-01 Chennai Central RTO, Tamil Nadu",
    "TN07": "TN-07 Chennai South RTO, Tamil Nadu",
    "TN09": "TN-09 Chennai West RTO, Tamil Nadu",
    "TS09": "TS-09 Hyderabad Central (Khairatabad) RTO, Telangana",
    "TS07": "TS-07 Secunderabad RTO, Telangana",
    "AP31": "AP-31 Visakhapatnam RTO, Andhra Pradesh",
    "UP14": "UP-14 Ghaziabad RTO, Uttar Pradesh",
    "UP16": "UP-16 Gautam Buddha Nagar (Noida) RTO, Uttar Pradesh",
    "UP32": "UP-32 Lucknow Central RTO, Uttar Pradesh",
    "HR26": "HR-26 Gurugram North RTO, Haryana",
    "GJ01": "GJ-01 Ahmedabad RTO, Gujarat"
}

FIRST_NAMES = [
    "Aarav", "Aditya", "Ajay", "Akhil", "Akshay", "Alok", "Amit", "Anand", "Anil", "Ankit",
    "Arjun", "Ashok", "Chetan", "Deepak", "Devendra", "Ganesh", "Gaurav", "Harish", "Hemant",
    "Jitendra", "Karan", "Karthik", "Kiran", "Lokesh", "Manoj", "Manish", "Mayank", "Mukesh",
    "Naveen", "Nikhil", "Nitin", "Pankaj", "Pawan", "Pradeep", "Prashant", "Praveen", "Rahul",
    "Rajesh", "Rakesh", "Ramesh", "Rohit", "Sachin", "Sameer", "Sanjay", "Santosh", "Shashank",
    "Sunil", "Suresh", "Tarun", "Varun", "Vikas", "Vinay", "Vishal", "Vivek", "Yash"
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Patel", "Reddy", "Nair", "Rao", "Iyer", "Kumar", "Singh",
    "Chauhan", "Mishra", "Pandey", "Yadav", "Joshi", "Bhat", "Hegde", "Shetty", "Gowda",
    "Deshmukh", "Kulkarni", "Patil", "Jadhav", "Shinde", "Pawar", "Ghosh", "Banerjee", "Chatterjee",
    "Mukherjee", "Das", "Bose", "Mehta", "Shah", "Agarwal", "Bansal", "Singhania", "Trivedi"
]

VEHICLE_CATALOG = [
    ("Motor Car (LMV)", "Maruti Suzuki Brezza ZXi+", "Petrol", "Pearl Arctic White"),
    ("Motor Car (LMV)", "Tata Nexon Creative 1.2 Petrol", "Petrol", "Daytona Grey"),
    ("Motor Car (LMV)", "Hyundai Creta SX 1.5", "Diesel", "Titan Grey"),
    ("Motor Car (LMV)", "Toyota Fortuner 4x4 Legender", "Diesel", "Super White"),
    ("Motor Car (LMV)", "Mahindra XUV700 AX7", "Diesel", "Midnight Black"),
    ("Motor Car (LMV)", "Maruti Suzuki Swift ZXi", "Petrol", "Solid Fire Red"),
    ("Motor Car (LMV)", "Toyota Innova Hycross ZX", "Hybrid", "Attitude Black"),
    ("Motor Car (LMV)", "Tata Punch Adventure", "Petrol", "Atomic Orange"),
    ("Motor Car (LMV)", "Kia Seltos HTX 1.5", "Petrol", "Gravity Grey"),
    ("Motor Car (LMV)", "Hyundai Venue SX 1.0 Turbo", "Petrol", "Polar White"),
    ("Motor Car (LMV)", "Mahindra Thar LX 4x4", "Diesel", "Napoli Black"),
    ("Motor Car (LMV)", "Tata Tiago.ev Long Range", "EV", "Teal Blue"),
    ("Motorcycle (2-Wheeler)", "Royal Enfield Classic 350", "Petrol", "Signals Marsh Grey"),
    ("Motorcycle (2-Wheeler)", "Hero Splendor Plus XTEC", "Petrol", "Black with Silver"),
    ("Motorcycle (2-Wheeler)", "TVS Apache RTR 160 4V", "Petrol", "Racing Red"),
    ("Motorcycle (2-Wheeler)", "Honda Activa 6G DLX", "Petrol", "Decent Blue"),
    ("Motorcycle (2-Wheeler)", "Ather 450X Gen 3", "EV", "Space Grey"),
    ("Commercial Goods (HGV)", "Tata 407 Gold SFC", "Diesel", "Highway Yellow"),
    ("Auto Rickshaw (3-Wheeler)", "Bajaj Compact RE 3-Seater", "CNG", "Auto Green & Yellow")
]

INSURERS = [
    "ICICI Lombard General Insurance",
    "HDFC ERGO General Insurance",
    "Bajaj Allianz General Insurance",
    "New India Assurance Co. Ltd.",
    "Tata AIG General Insurance",
    "United India Insurance Co.",
    "Digit General Insurance",
    "Reliance General Insurance"
]

def resolve_rto_location(plate: str) -> str:
    """Returns official RTO name based on registration plate state and district code."""
    prefix4 = plate[:4]
    if prefix4 in RTO_SPECIALIZATIONS:
        return RTO_SPECIALIZATIONS[prefix4]
        
    state_code = plate[:2]
    if state_code in STATE_NAMES:
        state_name = STATE_NAMES[state_code]
        dist_code = plate[2:4] if plate[2:4].isdigit() else "01"
        return f"{state_code}-{dist_code} Regional Transport Office, {state_name}"
        
    return "Central Transport Authority, Government of India"

def auto_create_vahan_profile(plate: str, db: Session) -> Vehicle:
    """
    Creates and persists a comprehensive VAHAN-compliant vehicle record
    with complete RC, Insurance, PUC, and Road Tax documents.
    Deterministic based on plate string for consistent repeat lookups.
    """
    clean_plate = plate.replace(" ", "").replace("-", "").upper()
    
    # Check if already exists
    existing = db.query(Vehicle).filter_by(registration_number=clean_plate).first()
    if existing:
        return existing
        
    # Seed pseudo-random generator with plate hash for deterministic consistent values
    plate_hash = int(hashlib.md5(clean_plate.encode()).hexdigest()[:8], 16)
    rng = random.Random(plate_hash)
    today = date.today()
    
    first = rng.choice(FIRST_NAMES)
    last = rng.choice(LAST_NAMES)
    owner_name = f"{first} {last}"
    phone = f"+91 {rng.randint(70000, 99999)} {rng.randint(10000, 99999)}"
    email = f"{first.lower()}.{last.lower()}{rng.randint(10, 99)}@gmail.com"
    
    v_class, make_model, fuel, color = rng.choice(VEHICLE_CATALOG)
    rto = resolve_rto_location(clean_plate)
    
    # Registration date: 1 to 6 years ago
    years_ago = rng.randint(1, 6)
    reg_date = today - timedelta(days=years_ago * 365 + rng.randint(10, 150))
    
    vehicle = Vehicle(
        registration_number=clean_plate,
        owner_name=owner_name,
        owner_phone=phone,
        owner_email=email,
        vehicle_class=v_class,
        maker_model=make_model,
        fuel_type=fuel,
        registration_date=reg_date,
        registered_rto=rto,
        color=color
    )
    db.add(vehicle)
    
    # 1. RC Record (Valid for 15 years from registration)
    rc_exp = reg_date + timedelta(days=365 * 15)
    rc_status = "valid" if rc_exp >= today else "expired"
    rc = RCRecord(
        registration_number=clean_plate,
        rc_number=f"RC{clean_plate}{rng.randint(100, 999)}",
        chassis_number=f"MA3{clean_plate[:4]}{rng.randint(100000000, 999999999)}"[0:17],
        engine_number=f"ENG{clean_plate[-4:]}{rng.randint(10000, 99999)}"[0:16],
        issue_date=reg_date,
        expiry_date=rc_exp,
        status=rc_status
    )
    db.add(rc)
    
    # 2. Insurance Record (~85% valid, ~15% expired for realistic traffic mix)
    is_ins_valid = (rng.random() < 0.85)
    if is_ins_valid:
        ins_issue = today - timedelta(days=rng.randint(20, 250))
        ins_exp = ins_issue + timedelta(days=365)
        ins_status = "valid"
    else:
        ins_exp = today - timedelta(days=rng.randint(5, 75))
        ins_issue = ins_exp - timedelta(days=365)
        ins_status = "expired"
        
    insurance = InsuranceRecord(
        registration_number=clean_plate,
        policy_number=f"POL-{clean_plate}-{rng.randint(10, 99)}",
        insurer_name=rng.choice(INSURERS),
        policy_type="Comprehensive Package Policy",
        issue_date=ins_issue,
        expiry_date=ins_exp,
        status=ins_status
    )
    db.add(insurance)
    
    # 3. PUC Record (~80% valid, ~20% expired)
    is_puc_valid = (rng.random() < 0.80)
    if is_puc_valid:
        puc_issue = today - timedelta(days=rng.randint(10, 140))
        puc_exp = puc_issue + timedelta(days=180)
        puc_status = "valid"
    else:
        puc_exp = today - timedelta(days=rng.randint(10, 60))
        puc_issue = puc_exp - timedelta(days=180)
        puc_status = "expired"
        
    puc = PUCRecord(
        registration_number=clean_plate,
        certificate_number=f"PUC/{clean_plate[:4]}/{rng.randint(100000, 999999)}",
        emission_norm="BS-VI",
        tested_value=f"CO: {rng.uniform(0.08, 0.25):.2f}%, HC: {rng.randint(30, 85)} ppm",
        issue_date=puc_issue,
        expiry_date=puc_exp,
        status=puc_status
    )
    db.add(puc)
    
    # 4. Road Tax Record (Life Time Tax)
    tax = TaxRecord(
        registration_number=clean_plate,
        tax_type="Life Time Tax (LTT)",
        amount_paid=float(rng.randint(14000, 32000)),
        payment_date=reg_date,
        valid_until=rc_exp,
        status="paid"
    )
    db.add(tax)
    
    db.commit()
    db.refresh(vehicle)
    return vehicle

