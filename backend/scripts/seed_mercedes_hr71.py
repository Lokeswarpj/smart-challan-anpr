import sys
import os
import uuid
from datetime import date, datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db.session import SessionLocal, engine, active_db_type
from app.db.models import Vehicle, RCRecord, InsuranceRecord, PUCRecord, TaxRecord, Challan, Officer

def seed_mercedes():
    db = SessionLocal()
    reg = "HR71H0003"
    print(f"Checking vehicle {reg} in database: {engine.url}...")
    
    existing = db.query(Vehicle).filter(Vehicle.registration_number == reg).first()
    if existing:
        print(f"Vehicle {reg} already exists.")
        db.close()
        return

    print(f"Adding {reg} (Mercedes-Benz GLE 450 - Polar White)...")
    today = date.today()
    
    vehicle = Vehicle(
        registration_number=reg,
        owner_name="Vikramaditya Singhania",
        owner_phone="+919876543210",
        owner_email="vikram.singhania@mercedes-owner.in",
        vehicle_class="Motor Car (LMV)",
        maker_model="Mercedes-Benz GLE 450 4MATIC",
        fuel_type="Petrol",
        registration_date=today - timedelta(days=730),
        registered_rto="Ganaur RTO, Sonipat (HR-71)",
        color="Polar White"
    )
    db.add(vehicle)
    db.flush()

    # RC Record
    rc = RCRecord(
        registration_number=reg,
        rc_number=f"RC-{reg}-2024",
        issue_date=today - timedelta(days=730),
        expiry_date=today + timedelta(days=4745), # 15 years
        status="valid",
        chassis_number="WDC1671591A990003",
        engine_number="M2569300003445"
    )
    db.add(rc)

    # Insurance Record
    ins = InsuranceRecord(
        registration_number=reg,
        policy_number="HDFC-ERGO-0003-9988",
        insurer_name="HDFC ERGO General Insurance",
        policy_type="Comprehensive",
        issue_date=today - timedelta(days=180),
        expiry_date=today + timedelta(days=185), # Valid
        status="valid"
    )
    db.add(ins)

    # PUC Record (Amber / Expiring soon or expired)
    puc = PUCRecord(
        registration_number=reg,
        certificate_number=f"PUC-HR71-{today.year}-0003",
        issue_date=today - timedelta(days=360),
        expiry_date=today + timedelta(days=4), # Amber alert (expiring in 4 days)
        emission_norm="BS-VI",
        tested_value="CO: 0.12%, HC: 38 ppm",
        status="valid"
    )
    db.add(puc)

    # Tax Record
    tax = TaxRecord(
        registration_number=reg,
        tax_type="Life Time Tax (LTT)",
        amount_paid=145000.0,
        payment_date=today - timedelta(days=730),
        valid_until=today + timedelta(days=4745),
        status="paid"
    )
    db.add(tax)

    # Get officer
    officer = db.query(Officer).filter(Officer.badge_number.ilike("KA-POL-2026")).first()
    officer_id = officer.id if officer else 1

    # Pending Challan
    challan = Challan(
        id=str(uuid.uuid4()),
        challan_number=f"CH-HR71-2026-0003",
        registration_number=reg,
        officer_id=officer_id,
        violation_code="VIO-SPEED-01",
        violation_title="Over-Speeding on Expressway (Section 112/183 MV Act)",
        rule_section="Section 112/183 MV Act",
        fine_amount=2000.0,
        location="NH-44 Expressway Checkpoint, Sonipat",
        issued_at=datetime.utcnow() - timedelta(days=12),
        due_date=today + timedelta(days=18),
        payment_status="unpaid",
        dispatch_status="sent_sms"
    )
    db.add(challan)

    db.commit()
    print(f"SUCCESS: Vehicle {reg} seeded with RC, Insurance, PUC, Tax, and Challan records!")
    db.close()

if __name__ == "__main__":
    seed_mercedes()
