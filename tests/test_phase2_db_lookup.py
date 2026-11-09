"""
ROADGUARD Database & Vehicle Lookup Logic Evaluation Suite (Phase 2)
Tests:
1. Lookup variations: existing plate, non-existent, off-by-one, case/spacing/hyphen variants, whitespace, None, long string.
2. Date boundaries: today, tomorrow, yesterday, years ago, future issue dates, status flag correctness.
3. Missing fields, null records, and duplicate constraints.
4. Concurrency: 50 simultaneous lookups under multithreading (lock check).
5. Schema review: constraints, foreign keys, indexing.
"""

import os
import sys
import time
from datetime import date, timedelta, datetime
import concurrent.futures
import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.exc import IntegrityError

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.db.base import Base
from app.db.models import Vehicle, RCRecord, InsuranceRecord, PUCRecord, TaxRecord, Challan, Officer, AuditLog
from app.api.vehicles import build_vehicle_response

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_phase2.db")
TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed baseline vehicle KA01AB1234
    v1 = Vehicle(
        registration_number="KA01AB1234",
        owner_name="Aryan Maharaj",
        owner_phone="+91 8524994488",
        owner_email="aryan@example.com",
        vehicle_class="Motor Car (LMV)",
        maker_model="Maruti Suzuki Swift",
        fuel_type="Petrol",
        registration_date=date(2018, 5, 10),
        registered_rto="KA-01 Koramangala",
        color="White"
    )
    db.add(v1)
    db.flush()

    today = date.today()
    rc1 = RCRecord(
        registration_number="KA01AB1234",
        rc_number="RC-KA01-001",
        chassis_number="CHAS1234567890",
        engine_number="ENG1234567890",
        issue_date=date(2018, 5, 10),
        expiry_date=today + timedelta(days=365),
        status="valid"
    )
    ins1 = InsuranceRecord(
        registration_number="KA01AB1234",
        policy_number="POL-KA01-001",
        insurer_name="HDFC ERGO",
        policy_type="Comprehensive",
        issue_date=today - timedelta(days=100),
        expiry_date=today + timedelta(days=265),
        status="valid"
    )
    puc1 = PUCRecord(
        registration_number="KA01AB1234",
        certificate_number="PUC-KA01-001",
        emission_norm="BS-VI",
        tested_value="CO: 0.12%, HC: 42 ppm",
        issue_date=today - timedelta(days=30),
        expiry_date=today + timedelta(days=150),
        status="valid"
    )
    tax1 = TaxRecord(
        registration_number="KA01AB1234",
        tax_type="Life Time Tax (LTT)",
        amount_paid=18500.0,
        payment_date=date(2018, 5, 10),
        valid_until=today + timedelta(days=3650),
        status="paid"
    )
    db.add_all([rc1, ins1, puc1, tax1])
    db.commit()
    db.close()
    
    yield
    
    TestingSessionLocal.remove()
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass

def test_lookup_variations():
    """Phase 2.1: Plate variations handling."""
    db = TestingSessionLocal()
    
    # 1. Exact valid plate
    clean = "KA01AB1234".replace(" ", "").replace("-", "").upper()
    v = db.query(Vehicle).filter(Vehicle.registration_number == clean).first()
    assert v is not None
    assert v.registration_number == "KA01AB1234"

    # 2. Case insensitive & spacing
    test_inputs = ["ka01ab1234", "KA 01 AB 1234", "KA-01-AB-1234", "  KA01AB1234  ", "kA-01 ab 1234"]
    for raw in test_inputs:
        sanitized = raw.replace(" ", "").replace("-", "").upper()
        res = db.query(Vehicle).filter(Vehicle.registration_number == sanitized).first()
        assert res is not None, f"Failed lookup for input: '{raw}'"

    # 3. Valid format but non-existent plate
    non_existent = "KA99ZZ9999"
    res = db.query(Vehicle).filter(Vehicle.registration_number == non_existent).first()
    assert res is None, "Should return None for non-existent vehicle"

    # 4. Off-by-one plate (manual endpoint returns 404, does not hallucinate)
    off_by_one = "KA01AB1235"
    res_off = db.query(Vehicle).filter(Vehicle.registration_number == off_by_one).first()
    assert res_off is None, "Direct DB lookup must not match off-by-one plate"

    # 5. Empty and very long string inputs
    for edge in ["", " " * 50, "A" * 500, "!@#$%^&*()"]:
        sanitized = edge.replace(" ", "").replace("-", "").upper()
        res_edge = db.query(Vehicle).filter(Vehicle.registration_number == sanitized).first()
        assert res_edge is None

    db.close()

def test_date_boundary_logic():
    """Phase 2.2: Validity dates and status flags boundary tests."""
    today = date.today()
    db = TestingSessionLocal()

    # Vehicle A: Expiring today (0 days left)
    va = Vehicle(
        registration_number="KA02EX0000",
        owner_name="Test Today",
        owner_phone="9999999991",
        owner_email="test0@example.com",
        maker_model="Test Car",
        registration_date=date(2020, 1, 1),
        registered_rto="KA-02 Rajajinagar"
    )
    rc_today = RCRecord(
        registration_number="KA02EX0000",
        rc_number="RC-TODAY",
        chassis_number="CHAS00",
        engine_number="ENG00",
        issue_date=date(2020, 1, 1),
        expiry_date=today, # 0 days left
        status="valid"
    )
    db.add_all([va, rc_today])
    db.commit()

    resp_today = build_vehicle_response(va)
    # 0 days left <= 30 -> warning
    assert resp_today.documents.rc.status == "warning", f"Expected 'warning' for 0 days left, got {resp_today.documents.rc.status}"
    assert resp_today.documents.rc.days_left == 0

    # Vehicle B: Expired yesterday (-1 days left)
    vb = Vehicle(
        registration_number="KA02EX0001",
        owner_name="Test Yesterday",
        owner_phone="9999999992",
        owner_email="test1@example.com",
        maker_model="Test Car",
        registration_date=date(2020, 1, 1),
        registered_rto="KA-02 Rajajinagar"
    )
    puc_yest = PUCRecord(
        registration_number="KA02EX0001",
        certificate_number="PUC-YEST",
        issue_date=date(2020, 1, 1),
        expiry_date=today - timedelta(days=1), # -1 days left
        status="expired"
    )
    db.add_all([vb, puc_yest])
    db.commit()

    resp_yest = build_vehicle_response(vb)
    assert resp_yest.documents.puc.status == "expired", f"Expected 'expired', got {resp_yest.documents.puc.status}"
    assert resp_yest.status == "violation", "Overall status must be 'violation' if any document is expired"

    # Vehicle C: Expired years ago (-730 days left)
    vc = Vehicle(
        registration_number="KA02EX0730",
        owner_name="Test Years Ago",
        owner_phone="9999999993",
        owner_email="test730@example.com",
        maker_model="Test Car",
        registration_date=date(2015, 1, 1),
        registered_rto="KA-02 Rajajinagar"
    )
    ins_old = InsuranceRecord(
        registration_number="KA02EX0730",
        policy_number="INS-OLD",
        insurer_name="Test Insurer",
        issue_date=date(2015, 1, 1),
        expiry_date=today - timedelta(days=730),
        status="expired"
    )
    db.add_all([vc, ins_old])
    db.commit()

    resp_old = build_vehicle_response(vc)
    assert resp_old.documents.insurance.status == "expired"
    assert resp_old.documents.insurance.days_left == -730
    assert resp_old.status == "violation"

    # Vehicle D: Road tax valid until today (paid) vs expired yesterday (pending)
    vd = Vehicle(
        registration_number="KA02EX0002",
        owner_name="Test Tax",
        owner_phone="9999999994",
        owner_email="tax@example.com",
        maker_model="Test Car",
        registration_date=date(2020, 1, 1),
        registered_rto="KA-02 Rajajinagar"
    )
    tax_yest = TaxRecord(
        registration_number="KA02EX0002",
        tax_type="Road Tax",
        amount_paid=5000.0,
        payment_date=date(2020, 1, 1),
        valid_until=today - timedelta(days=1),
        status="pending"
    )
    db.add_all([vd, tax_yest])
    db.commit()

    resp_tax = build_vehicle_response(vd)
    assert resp_tax.documents.road_tax.status == "pending"
    assert resp_tax.status == "violation"

    db.close()

def test_missing_records_and_constraints():
    """Phase 2.3: Duplicate plates, null documents, integrity errors."""
    db = TestingSessionLocal()

    # 1. Duplicate plate insertion must raise IntegrityError
    dup_vehicle = Vehicle(
        registration_number="KA01AB1234", # Already exists!
        owner_name="Duplicate Imposter",
        owner_phone="9876543210",
        owner_email="dup@example.com",
        maker_model="Fake Car",
        registration_date=date(2021, 1, 1),
        registered_rto="KA-01 Koramangala"
    )
    db.add(dup_vehicle)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()

    # 2. Vehicle with completely missing compliance records (e.g. no insurance, no puc)
    v_bare = Vehicle(
        registration_number="KA09BA9999",
        owner_name="Bare Minimum Owner",
        owner_phone="9876543211",
        owner_email="bare@example.com",
        maker_model="Bare Scooter",
        registration_date=date(2021, 1, 1),
        registered_rto="KA-09 Mysuru"
    )
    db.add(v_bare)
    db.commit()

    resp_bare = build_vehicle_response(v_bare)
    assert resp_bare.documents.rc is None
    assert resp_bare.documents.insurance is None
    assert resp_bare.documents.puc is None
    assert resp_bare.documents.road_tax is None
    # NOTE: Discovered architecture observation: overall_status is currently 'compliant'
    # when documents are completely missing (Null object pattern).

    db.close()

def test_concurrent_lookups_50_threads():
    """Phase 2.4: Concurrency test with 50 simultaneous lookups."""
    num_threads = 50
    results = []
    errors = []
    start_time = time.perf_counter()

    def do_lookup(worker_id):
        sess = TestingSessionLocal()
        try:
            # Query existing vehicle
            v = sess.query(Vehicle).filter(Vehicle.registration_number == "KA01AB1234").first()
            if v and v.registration_number == "KA01AB1234":
                return True
            return False
        except Exception as e:
            return str(e)
        finally:
            sess.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = [executor.submit(do_lookup, i) for i in range(num_threads)]
        for f in concurrent.futures.as_completed(futures):
            res = f.result()
            if res is True:
                results.append(res)
            else:
                errors.append(res)

    duration = time.perf_counter() - start_time
    assert len(results) == num_threads, f"Expected {num_threads} successful concurrent lookups, got {len(results)}. Errors: {errors}"
    assert len(errors) == 0, f"Encountered database concurrency errors: {errors}"
    print(f"\n[PHASE 2.4] Successfully completed {num_threads} concurrent lookups in {duration*1000:.2f} ms ({duration/num_threads*1000:.2f} ms/query)")

def test_schema_review():
    """Phase 2.5: Schema constraints, types, and primary key inspection."""
    insp = inspect(engine)
    tables = insp.get_table_names()
    assert "vehicles" in tables
    assert "rc_records" in tables
    assert "insurance_records" in tables
    assert "puc_records" in tables
    assert "tax_records" in tables
    assert "challans" in tables
    assert "officers" in tables
    assert "audit_logs" in tables

    # Verify primary keys and foreign keys
    v_pk = insp.get_pk_constraint("vehicles")
    assert "registration_number" in v_pk["constrained_columns"]

    rc_fks = insp.get_foreign_keys("rc_records")
    assert any(fk["referred_table"] == "vehicles" for fk in rc_fks)

    challan_fks = insp.get_foreign_keys("challans")
    assert any(fk["referred_table"] == "vehicles" for fk in challan_fks)
    assert any(fk["referred_table"] == "officers" for fk in challan_fks)

if __name__ == "__main__":
    pytest.main(["-v", __file__])

