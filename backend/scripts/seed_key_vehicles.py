import sys
import os
import random
from datetime import datetime, date, timedelta
from faker import Faker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.base import Base
from app.db.session import engine, SessionLocal, sqlite_engine, SqliteSessionLocal
from app.db.models import Officer, Vehicle, RCRecord, InsuranceRecord, PUCRecord, TaxRecord, Challan
from app.core.security import hash_password

fake = Faker('en_IN')
random.seed(42)

RTO_MAP = {
    "KL58": "KL-58 Thalassery RTO, Kannur/Kozhikode, Kerala",
    "KA20": "KA-20 Udupi RTO, Karnataka",
    "HR71": "HR-71 Bilaspur / Gurugram, Haryana",
    "KA01": "KA-01 Koramangala RTO, Bengaluru, Karnataka",
    "KA03": "KA-03 Indiranagar RTO, Bengaluru, Karnataka",
    "KA04": "KA-04 Yeshwanthpur RTO, Bengaluru, Karnataka",
    "KA05": "KA-05 Jayanagar RTO, Bengaluru, Karnataka",
    "KA53": "KA-53 KR Puram RTO, Bengaluru, Karnataka",
    "MH12": "MH-12 Pune RTO, Maharashtra",
    "MH02": "MH-02 Mumbai West RTO, Maharashtra",
    "DL04": "DL-04 Janakpuri RTO, West Delhi",
    "DL01": "DL-01 Mall Road RTO, North Delhi",
    "TN09": "TN-09 Chennai West RTO, Tamil Nadu",
    "TN07": "TN-07 Chennai South RTO, Tamil Nadu",
    "HR26": "HR-26 Gurugram North RTO, Haryana",
    "UP32": "UP-32 Lucknow RTO, Uttar Pradesh",
    "TS09": "TS-09 Hyderabad Central RTO, Telangana",
    "AP31": "AP-31 Visakhapatnam RTO, Andhra Pradesh"
}

KEY_VEHICLES = [
    {
        "plate": "KL58AG3406",
        "owner": "Anandhu K. Nair",
        "phone": "+91 98471 23456",
        "email": "anandhu.nair88@gmail.com",
        "class": "Motor Car (LMV)",
        "model": "Maruti Suzuki Brezza ZXi+ Dual Tone",
        "fuel": "Petrol",
        "color": "Pearl White / Black",
        "rto": "KL-58 Thalassery RTO, Kerala",
        "reg_date": date(2022, 6, 15),
        "rc_status": "valid",
        "ins_status": "valid",
        "ins_name": "ICICI Lombard General Insurance",
        "puc_status": "expired",  # Demonstrates detection of expired PUC!
        "puc_days_expired": 45,
        "tax_status": "paid"
    },
    {
        "plate": "KA20MG5550",
        "owner": "Dr. Shivaraj Alva",
        "phone": "+91 94482 67890",
        "email": "dr.shivaraj.alva@manipal.edu",
        "class": "Motor Car (LMV)",
        "model": "Toyota Fortuner 4x4 Legender AT",
        "fuel": "Diesel",
        "color": "Super White",
        "rto": "KA-20 Udupi RTO, Karnataka",
        "reg_date": date(2021, 11, 20),
        "rc_status": "valid",
        "ins_status": "valid",
        "ins_name": "HDFC ERGO General Insurance",
        "puc_status": "valid",
        "tax_status": "paid"
    },
    {
        "plate": "HR71H0003",
        "owner": "Vikramaditya Singhania",
        "phone": "+91 98110 54321",
        "email": "vikram.singhania@vspl-group.com",
        "class": "Motor Car (LMV)",
        "model": "Mercedes-Benz GLE 450 4MATIC",
        "fuel": "Petrol",
        "color": "Polar White",
        "rto": "HR-71 Bilaspur / Gurugram, Haryana",
        "reg_date": date(2023, 2, 10),
        "rc_status": "valid",
        "ins_status": "valid",
        "ins_name": "Bajaj Allianz General Insurance",
        "puc_status": "valid",
        "tax_status": "paid"
    },
    {
        "plate": "KL58AG2406",
        "owner": "Sujith Varma",
        "phone": "+91 98470 99881",
        "email": "sujith.varma@keralamail.com",
        "class": "Motor Car (LMV)",
        "model": "Maruti Suzuki Brezza VXi",
        "fuel": "Petrol",
        "color": "Magma Grey",
        "rto": "KL-58 Thalassery RTO, Kerala",
        "reg_date": date(2022, 5, 10),
        "rc_status": "valid",
        "ins_status": "valid",
        "ins_name": "New India Assurance Co. Ltd.",
        "puc_status": "valid",
        "tax_status": "paid"
    },
    {
        "plate": "KA20DG5501",
        "owner": "Rathnakar Shetty",
        "phone": "+91 94481 12345",
        "email": "rshetty.udupi@gmail.com",
        "class": "Motor Car (LMV)",
        "model": "Toyota Fortuner 2.8 4x2 MT",
        "fuel": "Diesel",
        "color": "Silver Metallic",
        "rto": "KA-20 Udupi RTO, Karnataka",
        "reg_date": date(2020, 8, 14),
        "rc_status": "valid",
        "ins_status": "expired",  # Demonstrates expired insurance!
        "ins_days_expired": 32,
        "ins_name": "Tata AIG General Insurance",
        "puc_status": "valid",
        "tax_status": "paid"
    }
]

def seed_to_session(db_session, session_name="DB"):
    today = date.today()
    print(f"[{session_name}] Seeding key demonstration vehicles...")
    
    # Check/Create Officer
    admin_officer = db_session.query(Officer).filter_by(badge_number="KA-POL-2026").first()
    if not admin_officer:
        admin_officer = Officer(
            badge_number="KA-POL-2026",
            name="Inspector Lokeshwar P J",
            station="Indiranagar Traffic BPS, Bengaluru",
            role="officer",
            hashed_password=hash_password("traffic123")
        )
        db_session.add(admin_officer)
        db_session.commit()
    
    # 1. Seed Key Specific Vehicles
    for kv in KEY_VEHICLES:
        plate = kv["plate"]
        existing = db_session.query(Vehicle).filter_by(registration_number=plate).first()
        if existing:
            print(f"  Vehicle {plate} already exists in {session_name}.")
            continue
            
        vehicle = Vehicle(
            registration_number=plate,
            owner_name=kv["owner"],
            owner_phone=kv["phone"],
            owner_email=kv["email"],
            vehicle_class=kv["class"],
            maker_model=kv["model"],
            fuel_type=kv["fuel"],
            registration_date=kv["reg_date"],
            registered_rto=kv["rto"],
            color=kv["color"]
        )
        db_session.add(vehicle)
        
        # RC
        rc = RCRecord(
            registration_number=plate,
            rc_number=f"RC{plate}889",
            chassis_number=f"MA3{plate[0:4]}9876543210"[0:17],
            engine_number=f"ENG{plate[4:]}7765"[0:16],
            issue_date=kv["reg_date"],
            expiry_date=kv["reg_date"] + timedelta(days=365*15),
            status=kv["rc_status"]
        )
        db_session.add(rc)
        
        # Insurance
        if kv["ins_status"] == "valid":
            ins_issue = today - timedelta(days=90)
            ins_expiry = ins_issue + timedelta(days=365)
        else:
            ins_expiry = today - timedelta(days=kv.get("ins_days_expired", 30))
            ins_issue = ins_expiry - timedelta(days=365)
            
        ins = InsuranceRecord(
            registration_number=plate,
            policy_number=f"POL-{plate}-09",
            insurer_name=kv.get("ins_name", "ICICI Lombard General Insurance"),
            policy_type="Comprehensive Package",
            issue_date=ins_issue,
            expiry_date=ins_expiry,
            status=kv["ins_status"]
        )
        db_session.add(ins)
        
        # PUC
        if kv["puc_status"] == "valid":
            puc_issue = today - timedelta(days=45)
            puc_expiry = puc_issue + timedelta(days=180)
        else:
            puc_expiry = today - timedelta(days=kv.get("puc_days_expired", 45))
            puc_issue = puc_expiry - timedelta(days=180)
            
        puc = PUCRecord(
            registration_number=plate,
            certificate_number=f"PUC-{plate}-2026",
            emission_norm="BS-VI",
            tested_value="CO: 0.12%, HC: 42 ppm",
            issue_date=puc_issue,
            expiry_date=puc_expiry,
            status=kv["puc_status"]
        )
        db_session.add(puc)
        
        # Road Tax
        tax = TaxRecord(
            registration_number=plate,
            tax_type="Life Time Tax (LTT)",
            amount_paid=22500.0,
            payment_date=kv["reg_date"],
            valid_until=kv["reg_date"] + timedelta(days=365*15),
            status=kv["tax_status"]
        )
        db_session.add(tax)
        print(f"  + Added demonstration vehicle {plate} ({kv['model']})")
    
    db_session.commit()
    print(f"[{session_name}] Demonstration vehicles successfully seeded!")

def main():
    # 1. Seed SQLite
    sqlite_db = SqliteSessionLocal()
    try:
        seed_to_session(sqlite_db, "SQLite")
    finally:
        sqlite_db.close()
        
    # 2. Seed Primary SessionLocal (PostgreSQL / active DB)
    primary_db = SessionLocal()
    try:
        seed_to_session(primary_db, "Active DB")
    finally:
        primary_db.close()

if __name__ == "__main__":
    main()
