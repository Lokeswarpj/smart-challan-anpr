"""
Synthetic Vehicle Compliance Dataset Generator
Part of: Vehicle Document Verification System using ANPR (Phase 1)
Generates realistic Indian vehicle records, document compliance dates (valid, amber, expired),
pending challans, and officer accounts with controlled statistical distributions.
"""

import sys
import os
import random
import uuid
from datetime import datetime, date, timedelta
from faker import Faker
import argparse

# Add parent directory to sys.path so app imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.base import Base
from app.db.session import engine, SessionLocal, active_db_type
from app.db.models import Officer, Vehicle, RCRecord, InsuranceRecord, PUCRecord, TaxRecord, Challan, AuditLog
from app.core.security import hash_password

fake = Faker('en_IN')
Faker.seed(42)
random.seed(42)

# Common Indian Vehicle Data Sources
INDIAN_STATES = ["KA", "MH", "DL", "TN", "TS", "KL", "AP", "GJ", "UP"]
RTO_CODES = {
    "KA": [("01", "Koramangala, Bengaluru"), ("02", "Rajajinagar, Bengaluru"), ("03", "Indiranagar, Bengaluru"), ("04", "Yeshwanthpur, Bengaluru"), ("05", "Jayanagar, Bengaluru"), ("53", "KR Puram, Bengaluru")],
    "MH": [("01", "Mumbai South"), ("02", "Mumbai West"), ("12", "Pune"), ("14", "Pimpri-Chinchwad"), ("20", "Aurangabad")],
    "DL": [("01", "Mall Road, North Delhi"), ("03", "Sheikh Sarai, South Delhi"), ("04", "Janakpuri, West Delhi"), ("05", "Loni Road, North East Delhi")],
    "TN": [("01", "Chennai Central"), ("02", "Chennai North West"), ("07", "Chennai South"), ("22", "Meenambakkam")],
    "TS": [("07", "Secunderabad"), ("09", "Hyderabad Central"), ("10", "Hyderabad North")],
    "KL": [("01", "Thiruvananthapuram"), ("07", "Kochi"), ("11", "Kozhikode")],
    "AP": [("03", "Tirupati"), ("09", "Vijayawada"), ("31", "Visakhapatnam")],
    "GJ": [("01", "Ahmedabad"), ("05", "Surat"), ("06", "Vadodara")],
    "UP": [("14", "Ghaziabad"), ("16", "Noida"), ("32", "Lucknow")]
}

MAKES_AND_MODELS = [
    ("Motor Car (LMV)", "Tata Nexon Creative 1.2 Petrol", "Petrol"),
    ("Motor Car (LMV)", "Maruti Suzuki Swift ZXi", "Petrol"),
    ("Motor Car (LMV)", "Hyundai Creta SX 1.5 CRDi", "Diesel"),
    ("Motor Car (LMV)", "Mahindra XUV700 AX7", "Diesel"),
    ("Motor Car (LMV)", "Tata Punch Adventure", "Petrol"),
    ("Motor Car (LMV)", "Tata Tiago.ev Long Range", "EV"),
    ("Motor Car (LMV)", "Toyota Innova Hycross", "Hybrid"),
    ("Motor Car (LMV)", "Maruti Suzuki Baleno Alpha", "Petrol"),
    ("Motorcycle (2-Wheeler)", "Royal Enfield Classic 350", "Petrol"),
    ("Motorcycle (2-Wheeler)", "Hero Splendor Plus", "Petrol"),
    ("Motorcycle (2-Wheeler)", "TVS Apache RTR 160 4V", "Petrol"),
    ("Motorcycle (2-Wheeler)", "Honda Activa 6G DLX", "Petrol"),
    ("Motorcycle (2-Wheeler)", "Ather 450X Gen 3", "EV"),
    ("Commercial Goods (HGV)", "Tata 407 Gold SFC", "Diesel"),
    ("Auto Rickshaw (3-Wheeler)", "Bajaj Compact RE 3-Seater", "CNG")
]

INSURERS = [
    "ICICI Lombard General Insurance",
    "HDFC ERGO General Insurance",
    "Bajaj Allianz General Insurance",
    "New India Assurance Co. Ltd.",
    "Tata AIG General Insurance",
    "United India Insurance",
    "Digit General Insurance"
]

COLORS = ["White", "Silver", "Metallic Grey", "Black", "Navy Blue", "Cherry Red", "Golden Bronze"]

VIOLATION_CATALOG = [
    {
        "code": "VIO-PUC-EXP",
        "title": "Expired Pollution Under Control (PUC) Certificate",
        "section": "Section 190(2) Motor Vehicles Act",
        "fine": 2000.0
    },
    {
        "code": "VIO-INS-EXP",
        "title": "Driving Uninsured Vehicle (No Valid Insurance)",
        "section": "Section 196 Motor Vehicles Act",
        "fine": 2000.0
    },
    {
        "code": "VIO-RC-EXP",
        "title": "Operating Vehicle Without Valid Registration",
        "section": "Section 192 Motor Vehicles Act",
        "fine": 5000.0
    },
    {
        "code": "VIO-SIGNAL-JUMP",
        "title": "Violation of Mandatory Traffic Signals (Signal Jumping)",
        "section": "Section 119/177 Motor Vehicles Act",
        "fine": 1000.0
    },
    {
        "code": "VIO-NO-HELMET",
        "title": "Riding Two-Wheeler Without Protective Headgear (Helmet)",
        "section": "Section 194D Motor Vehicles Act",
        "fine": 1000.0
    },
    {
        "code": "VIO-NO-SEATBELT",
        "title": "Driving Without Fastened Safety Seatbelt",
        "section": "Section 194B Motor Vehicles Act",
        "fine": 1000.0
    },
    {
        "code": "VIO-OVERSPEED",
        "title": "Exceeding Prescribed Speed Limit (Over-speeding)",
        "section": "Section 112/183 Motor Vehicles Act",
        "fine": 1500.0
    },
    {
        "code": "VIO-PHONE-DRIVE",
        "title": "Use of Handheld Mobile Phone While Driving",
        "section": "Section 184(c) Motor Vehicles Act",
        "fine": 1500.0
    }
]

LOCATIONS = [
    "MG Road - Brigade Rd Junction, Bengaluru",
    "Silk Board Flyover Checkpoint, Bengaluru",
    "Indiranagar 100ft Road Signal, Bengaluru",
    "Koramangala Sony World Signal, Bengaluru",
    "Hebbal Flyover Entry, Bengaluru",
    "Marine Drive Checkpoint, Mumbai",
    "Bandra-Kurla Complex Signal, Mumbai",
    "Connaught Place Outer Circle, New Delhi",
    "Dhaula Kuan Intersection, New Delhi"
]

def generate_plate_number(state=None, rto_code=None, is_bharat_series=False):
    """Generates standard Indian registration number or BH series number."""
    if is_bharat_series:
        year = random.choice(["21", "22", "23", "24", "25"])
        digits = f"{random.randint(1000, 9999)}"
        series = random.choice(["AA", "AB", "AC", "BA", "BB", "BC"])
        return f"{year}BH{digits}{series}"
    
    st = state or random.choice(INDIAN_STATES)
    if not rto_code:
        rto_code, _ = random.choice(RTO_CODES[st])
    series = random.choice(["A", "B", "C", "D", "E", "M", "N", "Z", "AB", "AC", "EA", "MA", "NB"])
    number = f"{random.randint(1000, 9999)}"
    return f"{st}{rto_code}{series}{number}"

def seed_officers(db):
    """Seeds verified traffic police officer accounts."""
    officers_data = [
        {
            "badge_number": "KA-POL-1001",
            "name": "Sub-Inspector Ramesh Kumar",
            "station": "Indiranagar Traffic BPS, Bengaluru",
            "role": "officer",
            "password": "officer123"
        },
        {
            "badge_number": "KA-POL-1002",
            "name": "Head Constable Lokesh Gowda",
            "station": "Koramangala Traffic BPS, Bengaluru",
            "role": "officer",
            "password": "officer123"
        },
        {
            "badge_number": "KA-POL-ADMIN",
            "name": "Assistant Commissioner Anand Patil",
            "station": "Traffic Police Central HQ, Bengaluru",
            "role": "admin",
            "password": "admin123"
        },
        {
            "badge_number": "KA-POL-2026",
            "name": "Inspector Lokeshwar P J",
            "station": "Indiranagar Traffic BPS, Bengaluru",
            "role": "officer",
            "password": "traffic123"
        }
    ]
    
    created_officers = []
    for data in officers_data:
        existing = db.query(Officer).filter_by(badge_number=data["badge_number"]).first()
        if not existing:
            officer = Officer(
                badge_number=data["badge_number"],
                name=data["name"],
                station=data["station"],
                role=data["role"],
                hashed_password=hash_password(data["password"])
            )
            db.add(officer)
            created_officers.append(officer)
        else:
            created_officers.append(existing)
            
    db.commit()
    for off in created_officers:
        db.refresh(off)
    return created_officers

def create_vehicle_bundle(reg_no, profile_type, owner_data, rto_info, officers, today):
    """
    Constructs a vehicle with its RC, Insurance, PUC, Tax, and Challans
    profile_type:
      - 'clean': all documents valid, 0 pending challans (Green)
      - 'amber_puc': PUC expiring in 5-25 days (Amber)
      - 'amber_ins': Insurance expiring in 8-28 days (Amber)
      - 'expired_ins': Insurance expired (Red)
      - 'expired_puc': PUC expired (Red)
      - 'tax_pending': Tax pending / unpaid (Red)
      - 'severe_non_compliant': multiple expired docs + pending challans (Red)
    """
    v_class, make_model, fuel = random.choice(MAKES_AND_MODELS)
    color = random.choice(COLORS)
    
    # Registration date: 1 to 10 years ago
    reg_days_ago = random.randint(300, 3650)
    reg_date = today - timedelta(days=reg_days_ago)
    
    vehicle = Vehicle(
        registration_number=reg_no,
        owner_name=owner_data["name"],
        owner_phone=owner_data["phone"],
        owner_email=owner_data["email"],
        vehicle_class=v_class,
        maker_model=make_model,
        fuel_type=fuel,
        registration_date=reg_date,
        registered_rto=rto_info,
        color=color
    )
    
    # 1. RC Record (Valid for 15 years from reg date for private vehicles)
    rc_expired = (profile_type == 'severe_non_compliant' and random.random() < 0.3)
    if rc_expired:
        rc_issue = reg_date
        rc_expiry = today - timedelta(days=random.randint(10, 180))
        rc_status = "expired"
    else:
        rc_issue = reg_date
        rc_expiry = reg_date + timedelta(days=365 * 15)
        rc_status = "valid"
        
    rc = RCRecord(
        registration_number=reg_no,
        rc_number=f"RC{reg_no}{random.randint(100, 999)}",
        chassis_number=f"MA3{random.choice('ABCDEF')}{random.randint(100000000, 999999999)}",
        engine_number=f"ENG{random.randint(1000000, 9999999)}",
        issue_date=rc_issue,
        expiry_date=rc_expiry,
        status=rc_status
    )
    
    # 2. Insurance Record
    if profile_type == 'clean' or profile_type == 'amber_puc' or profile_type == 'tax_pending':
        ins_issue = today - timedelta(days=random.randint(30, 200))
        ins_expiry = ins_issue + timedelta(days=365)
        ins_status = "valid"
    elif profile_type == 'amber_ins':
        # Expiring within 1 to 29 days
        days_left = random.randint(3, 27)
        ins_expiry = today + timedelta(days=days_left)
        ins_issue = ins_expiry - timedelta(days=365)
        ins_status = "valid"
    else:  # expired_ins or severe_non_compliant
        days_expired = random.randint(5, 120)
        ins_expiry = today - timedelta(days=days_expired)
        ins_issue = ins_expiry - timedelta(days=365)
        ins_status = "expired"
        
    insurance = InsuranceRecord(
        registration_number=reg_no,
        policy_number=f"POL-{random.randint(10000000, 99999999)}",
        insurer_name=random.choice(INSURERS),
        policy_type=random.choice(["Comprehensive Package", "Standard Third-Party Liability"]),
        issue_date=ins_issue,
        expiry_date=ins_expiry,
        status=ins_status
    )
    
    # 3. PUC Record (Valid for 6 months or 1 year)
    if profile_type == 'clean' or profile_type == 'amber_ins' or profile_type == 'tax_pending':
        puc_issue = today - timedelta(days=random.randint(15, 90))
        puc_expiry = puc_issue + timedelta(days=180)
        puc_status = "valid"
    elif profile_type == 'amber_puc':
        # Expiring in 2 to 25 days
        days_left = random.randint(2, 25)
        puc_expiry = today + timedelta(days=days_left)
        puc_issue = puc_expiry - timedelta(days=180)
        puc_status = "valid"
    else:  # expired_puc or severe_non_compliant
        days_expired = random.randint(5, 90)
        puc_expiry = today - timedelta(days=days_expired)
        puc_issue = puc_expiry - timedelta(days=180)
        puc_status = "expired"
        
    puc = PUCRecord(
        registration_number=reg_no,
        certificate_number=f"PUC/{today.year}/{random.randint(100000, 999999)}",
        emission_norm="BS-VI" if fuel in ["Petrol", "Diesel", "Hybrid"] else "Zero Emission",
        tested_value=f"CO: {round(random.uniform(0.05, 0.28), 2)}%, HC: {random.randint(20, 65)} ppm",
        issue_date=puc_issue,
        expiry_date=puc_expiry,
        status=puc_status
    )
    
    # 4. Tax Record
    if profile_type == 'tax_pending' or (profile_type == 'severe_non_compliant' and random.random() < 0.5):
        tax_status = "pending"
        tax_valid = today - timedelta(days=random.randint(15, 60))
    else:
        tax_status = "paid"
        tax_valid = reg_date + timedelta(days=365 * 15)
        
    tax = TaxRecord(
        registration_number=reg_no,
        tax_type="One-Time Life Time Tax (LTT)" if "Car" in v_class or "Motorcycle" in v_class else "Annual Commercial Tax",
        amount_paid=18500.0 if "Car" in v_class else (3500.0 if "Motorcycle" in v_class else 7500.0),
        payment_date=reg_date,
        valid_until=tax_valid,
        status=tax_status
    )
    
    # 5. Challans
    challans = []
    num_challans = 0
    if profile_type == 'clean':
        num_challans = 0 if random.random() < 0.8 else 1  # If any, past paid ones
    elif profile_type in ['amber_puc', 'amber_ins']:
        num_challans = random.choice([0, 1])
    elif profile_type in ['expired_ins', 'expired_puc', 'tax_pending']:
        num_challans = random.choice([1, 2])
    elif profile_type == 'severe_non_compliant':
        num_challans = random.randint(2, 4)
        
    for i in range(num_challans):
        vio = random.choice(VIOLATION_CATALOG)
        off = random.choice(officers)
        days_ago = random.randint(2, 120)
        iss_dt = datetime.now() - timedelta(days=days_ago, hours=random.randint(1, 10))
        
        # Determine status
        if profile_type == 'clean':
            c_status = "paid"
            d_status = "sent_both"
        elif days_ago > 30 and random.random() < 0.4:
            c_status = "paid"
            d_status = "sent_both"
        else:
            c_status = random.choice(["unpaid", "unpaid", "disputed"])
            d_status = random.choice(["sent_email", "sent_sms", "sent_both"])
            
        challan = Challan(
            id=str(uuid.uuid4()),
            challan_number=f"CH-{iss_dt.strftime('%Y%m')}-{reg_no[:4]}-{random.randint(1000, 9999)}",
            registration_number=reg_no,
            officer_id=off.id,
            violation_code=vio["code"],
            violation_title=vio["title"],
            rule_section=vio["section"],
            fine_amount=vio["fine"],
            location=random.choice(LOCATIONS),
            issued_at=iss_dt,
            due_date=(iss_dt + timedelta(days=30)).date(),
            payment_status=c_status,
            dispatch_status=d_status
        )
        challans.append(challan)
        
    return vehicle, rc, insurance, puc, tax, challans

def seed_database(target_count=350):
    """Initializes tables and seeds synthetic records into the database."""
    print("=" * 70)
    print("VEHICLE VERIFICATION SYSTEM - SYNTHETIC DATA GENERATOR")
    print(f"Target Database Engine: {active_db_type}")
    print(f"Connecting and initializing database schema...")
    print("=" * 70)
    
    # 1. Create tables
    Base.metadata.create_all(bind=engine)
    print("Database tables verified / created successfully.")
    
    db = SessionLocal()
    today = date.today()
    
    try:
        # 2. Seed Officers
        officers = seed_officers(db)
        print(f"Seeded/Verified {len(officers)} Officer accounts:")
        for off in officers:
            print(f"   - Badge: {off.badge_number:15} | Name: {off.name:30} | Role: {off.role}")
            
        # 3. Seed 10 Ground-Truth Benchmark Test Vehicles
        # These 10 deterministic vehicles allow testing every possible edge case reliably in live demos
        benchmark_configs = [
            ("KA01AB1234", "clean", "Koramangala, Bengaluru (KA-01)"),
            ("KA03MG4567", "amber_puc", "Indiranagar, Bengaluru (KA-03)"),
            ("MH12DE7890", "amber_ins", "Pune Central, Maharashtra (MH-12)"),
            ("DL04CC9999", "expired_ins", "Janakpuri, West Delhi (DL-04)"),
            ("KA05NB3321", "expired_puc", "Jayanagar, Bengaluru (KA-05)"),
            ("KA04EF1122", "tax_pending", "Yeshwanthpur, Bengaluru (KA-04)"),
            ("22BH9988AA", "clean", "Bharat Series Central RTO (BH)"),
            ("DL01A1001",  "clean", "North Delhi Central (DL-01)"),
            ("KA53Z9000",  "severe_non_compliant", "KR Puram, Bengaluru (KA-53)"),
            ("MH02CB5555", "severe_non_compliant", "Mumbai West, Maharashtra (MH-02)")
        ]
        
        print("\nSeeding 10 Ground-Truth Benchmark Test Vehicles...")
        for reg_no, p_type, rto_name in benchmark_configs:
            existing = db.query(Vehicle).filter_by(registration_number=reg_no).first()
            if existing:
                db.delete(existing)
                db.commit()
                
            owner = {
                "name": fake.name(),
                "phone": f"+91 {random.randint(9000000000, 9999999999)}",
                "email": f"{reg_no.lower()}@vehicle-owner.in"
            }
            v, rc, ins, puc, tax, challans = create_vehicle_bundle(
                reg_no, p_type, owner, rto_name, officers, today
            )
            db.add(v)
            db.add_all([rc, ins, puc, tax])
            db.add_all(challans)
            print(f"   [+] {reg_no:12} -> Profile: {p_type:20} | RTO: {rto_name}")
            
        db.commit()
        
        # 4. Generate Remaining Synthetic Fleet with Controlled Probability Distribution
        # 70% clean (Green), 15% expired doc (Red), 10% tax/multiple fines (Red), 5% amber (expiring soon)
        print(f"\nGenerating {target_count} synthetic fleet vehicles with controlled distributions...")
        
        distribution_profiles = (
            ["clean"] * 70 +
            ["amber_puc"] * 3 +
            ["amber_ins"] * 2 +
            ["expired_ins"] * 8 +
            ["expired_puc"] * 7 +
            ["tax_pending"] * 4 +
            ["severe_non_compliant"] * 6
        )
        
        seeded_count = 0
        existing_plates = set(r[0] for r in db.query(Vehicle.registration_number).all())
        
        for i in range(target_count):
            p_type = random.choice(distribution_profiles)
            is_bh = (random.random() < 0.05)
            
            st = random.choice(INDIAN_STATES)
            rto_code, rto_desc = random.choice(RTO_CODES[st])
            reg_no = generate_plate_number(state=st, rto_code=rto_code, is_bharat_series=is_bh)
            
            if reg_no in existing_plates:
                continue
            existing_plates.add(reg_no)
            
            owner = {
                "name": fake.name(),
                "phone": f"+91 {random.randint(9000000000, 9999999999)}",
                "email": f"owner.{random.randint(1000, 99999)}@gmail.com"
            }
            
            v, rc, ins, puc, tax, challans = create_vehicle_bundle(
                reg_no, p_type, owner, f"{st}-{rto_code} ({rto_desc})", officers, today
            )
            db.add(v)
            db.add_all([rc, ins, puc, tax])
            db.add_all(challans)
            seeded_count += 1
            
            if seeded_count % 50 == 0:
                db.commit()
                print(f"   Progress: {seeded_count}/{target_count} vehicles committed...")
                
        db.commit()
        
        # 5. Seed Initial Audit Logs
        print("\nSeeding initial audit logs...")
        sample_audit_plates = list(existing_plates)[:8]
        for plate in sample_audit_plates:
            off = random.choice(officers)
            log = AuditLog(
                officer_id=off.id,
                officer_badge=off.badge_number,
                action=random.choice(["lookup_manual", "lookup_anpr"]),
                registration_queried=plate,
                timestamp=datetime.utcnow() - timedelta(minutes=random.randint(5, 300)),
                ip_address=f"10.0.12.{random.randint(10, 99)}",
                details=f"Routine highway patrol verification at checkpoint."
            )
            db.add(log)
        db.commit()
        
        # Summary statistics
        total_vehicles = db.query(Vehicle).count()
        total_rc = db.query(RCRecord).count()
        total_ins = db.query(InsuranceRecord).count()
        total_puc = db.query(PUCRecord).count()
        total_tax = db.query(TaxRecord).count()
        total_challans = db.query(Challan).count()
        unpaid_challans = db.query(Challan).filter_by(payment_status="unpaid").count()
        
        print("\n" + "=" * 70)
        print("DATABASE POPULATION COMPLETE")
        print(f"Database Type:           {active_db_type}")
        print(f"Total Vehicles:          {total_vehicles}")
        print(f"RC Records:              {total_rc}")
        print(f"Insurance Records:       {total_ins}")
        print(f"PUC Records:             {total_puc}")
        print(f"Tax Records:             {total_tax}")
        print(f"Total Challans:          {total_challans} ({unpaid_challans} pending/unpaid)")
        print(f"Audit Trail Entries:     {db.query(AuditLog).count()}")
        print("=" * 70)
        print("\nReady for Phase 2 (Computer Vision & ANPR Pipeline)!")
        
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Synthetic Vehicle Compliance Dataset")
    parser.add_argument("--count", type=int, default=300, help="Number of synthetic vehicles to generate (default: 300)")
    args = parser.parse_args()
    seed_database(target_count=args.count)

