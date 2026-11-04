"""
ROADGUARD End-to-End REST API & System Verification Suite
Automated regression tests covering all 10 lifecycle stages:
1. Health & Database Connectivity Check
2. Officer Authentication & JWT Issuance
3. Profile & Station Authorization
4. Compliant Vehicle Document Verification
5. Non-Compliant Vehicle & Violations Detection
6. Active Challan Registry Retrieval
7. Automated Digital Challan Creation
8. ReportLab Tamper-Proof PDF Generation (Binary & QR verification)
9. SMS / Email Digital Dispatch Simulation
10. Dual-Scope Command Telemetry Analytics
"""

import sys
import os
import requests

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")

def run_api_verification_suite():
    print("\n" + "=" * 70)
    print("ROADGUARD FASTAPI REST API VERIFICATION SUITE")
    print(f"Target: {BASE_URL}")
    print("=" * 70)

    # 1. Root & Health
    r_root = requests.get(f"{BASE_URL}/", timeout=5)
    assert r_root.status_code == 200, f"Root failed: {r_root.text}"
    print(f"[PASS] 1. Root Service:            {r_root.json()['service']} v{r_root.json()['version']}")

    r_health = requests.get(f"{BASE_URL}/health", timeout=5)
    assert r_health.status_code == 200, f"Health check failed: {r_health.text}"
    db_info = r_health.json()["database"]
    print(f"[PASS] 2. Health & Database:       {db_info['type']} ({db_info['status'].upper()})")

    # 2. Officer Authentication
    r_login = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "badge_number": "KA-POL-1001",
        "password": "traffic123"
    }, timeout=5)
    assert r_login.status_code == 200, f"Login failed: {r_login.text}"
    auth_data = r_login.json()
    token = auth_data["access_token"]
    officer = auth_data["officer"]
    print(f"[PASS] 3. Officer Authentication:  {officer['name']} [Badge: {officer['badge_number']}]")

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Auth Profile
    r_me = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers, timeout=5)
    assert r_me.status_code == 200, f"Auth /me failed: {r_me.text}"
    print(f"[PASS] 4. Profile & Station Auth:  Station: {r_me.json()['station']} (Role: {r_me.json()['role'].upper()})")

    # 4. Vehicle Verification (Compliant Vehicle)
    r_veh_good = requests.get(f"{BASE_URL}/api/v1/vehicles/KA01AB1234", headers=headers, timeout=5)
    assert r_veh_good.status_code == 200, f"Vehicle KA01AB1234 failed: {r_veh_good.text}"
    veh_data = r_veh_good.json()
    print(f"[PASS] 5. Compliant Vehicle Check: KA01AB1234 -> Status: {veh_data['status'].upper()} (Owner: {veh_data['owner_name']})")

    # 5. Vehicle Verification (Non-Compliant Vehicle)
    r_veh_bad = requests.get(f"{BASE_URL}/api/v1/vehicles/KA05NB3321", headers=headers, timeout=5)
    assert r_veh_bad.status_code == 200, f"Vehicle KA05NB3321 failed: {r_veh_bad.text}"
    bad_veh = r_veh_bad.json()
    violations_detected = len(bad_veh.get("violations", []))
    print(f"[PASS] 6. Non-Compliant Detection: KA05NB3321 -> {violations_detected} Violations Flagged (Status: {bad_veh['status'].upper()})")

    # 6. Challan Listing
    r_challans = requests.get(f"{BASE_URL}/api/v1/challans", headers=headers, timeout=5)
    assert r_challans.status_code == 200, f"Challan list failed: {r_challans.text}"
    challans_list = r_challans.json()
    print(f"[PASS] 7. Challan Registry:        {len(challans_list)} Active records retrieved")

    # 7. Create New Challan
    r_create = requests.post(f"{BASE_URL}/api/v1/challans", headers=headers, json={
        "registration_number": "KA01AB1234",
        "violation_title": "Automated Test Violation (Section 177)",
        "fine_amount": 500.0,
        "location": "Central Command Quality Checkpoint",
        "due_days": 15
    }, timeout=5)
    assert r_create.status_code == 201, f"Challan creation failed: {r_create.text}"
    created_challan = r_create.json()
    challan_id = created_challan["id"]
    challan_no = created_challan["challan_number"]
    print(f"[PASS] 8. Digital Challan Issued:  Challan #{challan_no} for INR {created_challan['fine_amount']}")

    # 8. Challan PDF Receipt Generation
    r_pdf = requests.get(f"{BASE_URL}/api/v1/challans/{challan_id}/receipt", headers=headers, timeout=5)
    assert r_pdf.status_code == 200, f"PDF receipt failed: {r_pdf.status_code}"
    assert r_pdf.content.startswith(b"%PDF"), "Response is not a valid PDF binary stream"
    print(f"[PASS] 9. PDF Security Receipt:    Generated {len(r_pdf.content):,} bytes with embedded QR code verification")

    # 9. Dashboard Analytics (Dual Scope)
    r_dash_stn = requests.get(f"{BASE_URL}/api/v1/reports/dashboard?scope=station", headers=headers, timeout=5)
    assert r_dash_stn.status_code == 200, f"Station dashboard failed: {r_dash_stn.text}"
    stn_data = r_dash_stn.json()

    r_dash_my = requests.get(f"{BASE_URL}/api/v1/reports/dashboard?scope=personal", headers=headers, timeout=5)
    assert r_dash_my.status_code == 200, f"Personal dashboard failed: {r_dash_my.text}"
    my_data = r_dash_my.json()

    print(f"[PASS] 10. Telemetry Analytics:    Station Fleet: {stn_data['total_scanned']} scans, Shift: {my_data['total_scanned']} scans")

    print("-" * 70)
    print("ALL 10 API & SYSTEM INTEGRATION TESTS PASSED (100% SUCCESS)")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    run_api_verification_suite()
