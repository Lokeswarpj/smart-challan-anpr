import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_api_suite():
    print("=" * 60)
    print("ROADGUARD FASTAPI REST API VERIFICATION SUITE")
    print("=" * 60)

    # 1. Root & Health
    r_root = client.get("/")
    assert r_root.status_code == 200, f"Root failed: {r_root.text}"
    print("[PASS] Root Endpoint (/):", r_root.json()["service"])

    r_health = client.get("/health")
    assert r_health.status_code == 200, f"Health check failed: {r_health.text}"
    print("[PASS] Health Check (/health): Database is", r_health.json()["database"]["type"])

    # 2. Officer Authentication
    r_login = client.post("/api/v1/auth/login", json={
        "badge_number": "KA-POL-1001",
        "password": "password123"
    })
    if r_login.status_code != 200:
        # Try demo password
        r_login = client.post("/api/v1/auth/login", json={
            "badge_number": "KA-POL-1001",
            "password": "traffic123"
        })
    assert r_login.status_code == 200, f"Login failed: {r_login.text}"
    auth_data = r_login.json()
    token = auth_data["access_token"]
    officer = auth_data["officer"]
    print(f"[PASS] Officer Login: Authenticated {officer['name']} ({officer['badge_number']})")

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Auth Profile
    r_me = client.get("/api/v1/auth/me", headers=headers)
    assert r_me.status_code == 200, f"Auth /me failed: {r_me.text}"
    print(f"[PASS] Auth /me Profile: {r_me.json()['name']} - {r_me.json()['station']}")

    # 4. Vehicle Verification (Compliant Vehicle)
    r_veh_good = client.get("/api/v1/vehicles/KA01AB1234", headers=headers)
    assert r_veh_good.status_code == 200, f"Vehicle KA01AB1234 failed: {r_veh_good.text}"
    veh_data = r_veh_good.json()
    print(f"[PASS] Vehicle Lookup (KA01AB1234): Owner {veh_data['owner_name']}, Status: {veh_data['status'].upper()}")

    # 5. Vehicle Verification (Expired Document / Violation)
    r_veh_bad = client.get("/api/v1/vehicles/KA05NB3321", headers=headers)
    assert r_veh_bad.status_code == 200, f"Vehicle KA05NB3321 failed: {r_veh_bad.text}"
    bad_veh = r_veh_bad.json()
    print(f"[PASS] Vehicle Lookup (KA05NB3321): Owner {bad_veh['owner_name']}, Status: {bad_veh['status'].upper()}")

    # 6. Challan Listing
    r_challans = client.get("/api/v1/challans", headers=headers)
    assert r_challans.status_code == 200, f"Challan list failed: {r_challans.text}"
    challans_list = r_challans.json()
    print(f"[PASS] Challan Listing: Retrieved {len(challans_list)} active challans")

    # 7. Create New Challan
    r_create = client.post("/api/v1/challans", headers=headers, json={
        "registration_number": "KA01AB1234",
        "violation_title": "Expired Third-Party Insurance",
        "fine_amount": 2000.0,
        "location": "MG Road Brigade Junction",
        "due_days": 15
    })
    assert r_create.status_code == 201, f"Challan creation failed: {r_create.text}"
    created_challan = r_create.json()
    challan_id = created_challan["id"]
    challan_no = created_challan["challan_number"]
    print(f"[PASS] Challan Creation: Issued {challan_no} for ₹{created_challan['fine_amount']}")

    # 8. Challan PDF Receipt Generation
    r_pdf = client.get(f"/api/v1/challans/{challan_id}/receipt", headers=headers)
    assert r_pdf.status_code == 200, f"PDF receipt failed: {r_pdf.status_code}"
    assert r_pdf.content.startswith(b"%PDF"), "Response is not a valid PDF binary stream"
    print(f"[PASS] Digital PDF Receipt: Generated {len(r_pdf.content):,} bytes with embedded verification QR code")

    # 9. Challan Dispatch
    r_dispatch = client.post(f"/api/v1/challans/{challan_id}/dispatch", headers=headers, json={"channel": "both"})
    assert r_dispatch.status_code == 200, f"Dispatch failed: {r_dispatch.text}"
    print(f"[PASS] Challan Dispatch: {r_dispatch.json()['message']}")

    # 10. Dashboard Analytics
    r_dash = client.get("/api/v1/reports/dashboard", headers=headers)
    assert r_dash.status_code == 200, f"Dashboard analytics failed: {r_dash.text}"
    dash_data = r_dash.json()
    print(f"[PASS] Analytics Dashboard: Scanned={dash_data['total_scanned']}, Violations={dash_data['active_violations']}, Compliance={dash_data['compliance_rate']}%")

    print("\n" + "=" * 60)
    print("ALL 10 API TEST SUITE STAGES PASSED CLEANLY (100% SUCCESS)")
    print("=" * 60)

if __name__ == "__main__":
    test_full_api_suite()
