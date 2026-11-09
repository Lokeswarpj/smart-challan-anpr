import os
import sys
import pytest
from datetime import datetime, date, timedelta

# Ensure backend and project root are in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Configure local SQLite database for test execution
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_roadguard.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["EASYOCR_MODULE_PATH"] = os.path.join(BASE_DIR, ".EasyOCR")

from fastapi.testclient import TestClient
from main import app
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.models import Officer, Vehicle, RCRecord, InsuranceRecord, PUCRecord, TaxRecord, Challan, AuditLog
from app.core.security import hash_password, create_access_token

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Create test schema
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Seed test officers if not present
    if not db.query(Officer).filter(Officer.badge_number == "KA-POL-TEST").first():
        test_officer = Officer(
            badge_number="KA-POL-TEST",
            name="Officer Test Kumar",
            station="Test Headquarters",
            role="officer",
            hashed_password=hash_password("officer123"),
            is_active=True
        )
        test_admin = Officer(
            badge_number="KA-POL-ADMINTEST",
            name="Admin Test Patil",
            station="Central Traffic Command",
            role="admin",
            hashed_password=hash_password("admin123"),
            is_active=True
        )
        db.add_all([test_officer, test_admin])
        db.commit()

    # Seed controlled benchmark vehicles
    test_plate = "KA01TEST01"
    if not db.query(Vehicle).filter(Vehicle.registration_number == test_plate).first():
        today = date.today()
        v_good = Vehicle(
            registration_number=test_plate,
            owner_name="Test Citizen",
            owner_phone="+91 8524994488",
            owner_email="test.citizen@example.com",
            maker_model="Test Car 1.2",
            registered_rto="KA-01 (Koramangala)",
            registration_date=today - timedelta(days=365)
        )
        rc_good = RCRecord(
            registration_number=test_plate,
            rc_number="RCTEST01",
            chassis_number="CHAS001",
            engine_number="ENG001",
            issue_date=today - timedelta(days=365),
            expiry_date=today + timedelta(days=3650),
            status="valid"
        )
        ins_good = InsuranceRecord(
            registration_number=test_plate,
            policy_number="INSTEST01",
            insurer_name="Test Assurance",
            issue_date=today - timedelta(days=100),
            expiry_date=today + timedelta(days=265),
            status="valid"
        )
        puc_good = PUCRecord(
            registration_number=test_plate,
            certificate_number="PUCTEST01",
            emission_norm="BS-VI",
            tested_value="CO: 0.05%",
            issue_date=today - timedelta(days=50),
            expiry_date=today + timedelta(days=130),
            status="valid"
        )
        tax_good = TaxRecord(
            registration_number=test_plate,
            tax_type="LTT",
            amount_paid=15000.0,
            payment_date=today - timedelta(days=365),
            valid_until=today + timedelta(days=3650),
            status="paid"
        )
        db.add_all([v_good, rc_good, ins_good, puc_good, tax_good])

        # Seed non-compliant test vehicle
        bad_plate = "KA05BAD01"
        v_bad = Vehicle(
            registration_number=bad_plate,
            owner_name="Violator Citizen",
            owner_phone="+91 8524994488",
            owner_email="violator@example.com",
            maker_model="Old Scooter 150",
            registered_rto="KA-05 (Jayanagar)",
            registration_date=today - timedelta(days=1000)
        )
        rc_bad = RCRecord(
            registration_number=bad_plate,
            rc_number="RCBAD01",
            chassis_number="CHAS999",
            engine_number="ENG999",
            issue_date=today - timedelta(days=1000),
            expiry_date=today + timedelta(days=1000),
            status="valid"
        )
        ins_bad = InsuranceRecord(
            registration_number=bad_plate,
            policy_number="INSBAD01",
            insurer_name="Expired Insurance Co",
            issue_date=today - timedelta(days=400),
            expiry_date=today - timedelta(days=35),
            status="expired"
        )
        puc_bad = PUCRecord(
            registration_number=bad_plate,
            certificate_number="PUCBAD01",
            emission_norm="BS-IV",
            tested_value="CO: 0.85%",
            issue_date=today - timedelta(days=200),
            expiry_date=today - timedelta(days=20),
            status="expired"
        )
        tax_bad = TaxRecord(
            registration_number=bad_plate,
            tax_type="LTT",
            amount_paid=5000.0,
            payment_date=today - timedelta(days=1000),
            valid_until=today - timedelta(days=10),
            status="pending"
        )
        db.add_all([v_bad, rc_bad, ins_bad, puc_bad, tax_bad])
        db.commit()

    db.close()
    yield
    # Keep db for test inspection, teardown handled if needed

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def officer_headers():
    token = create_access_token({"sub": "KA-POL-TEST", "role": "officer"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_headers():
    token = create_access_token({"sub": "KA-POL-ADMINTEST", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}
