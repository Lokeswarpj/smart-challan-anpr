"""
ROADGUARD Backend API & Live Contract Evaluation Suite (Phase 4)
Executes end-to-end HTTP integration tests against the live running FastAPI service (http://127.0.0.1:8000).
Tests:
1. Public health check contract.
2. 401 Unauthorized for unauthenticated requests on protected routes.
3. Role-Based Access Control (RBAC): Officer (403) vs Admin (200) on /api/admin/*.
4. Input validation (422) for missing fields, invalid data types, and malformed bodies.
5. Wrong HTTP methods (405 Method Not Allowed).
6. Non-existent resources (404 Not Found).
7. Error response leakage audit: verifying absence of internal tracebacks, paths, or credentials.
"""

import os
import sys
import pytest
import requests

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.security import create_access_token

SERVER_ROOT = os.getenv("SERVER_ROOT", "http://127.0.0.1:8000")
API_V1 = f"{SERVER_ROOT}/api/v1"

@pytest.fixture(scope="module")
def officer_token():
    return create_access_token({"sub": "KA-POL-1001", "role": "officer"})

@pytest.fixture(scope="module")
def admin_token():
    return create_access_token({"sub": "KA-POL-ADMIN", "role": "admin"})

def test_health_check_contract():
    """Phase 4.1: Public health endpoint."""
    r = requests.get(f"{SERVER_ROOT}/health")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert "engine" in data

def test_auth_and_unauthorized_rejections():
    """Phase 4.2: Verify 401 Unauthorized for unauthenticated requests."""
    protected_urls = [
        ("GET", f"{API_V1}/auth/me"),
        ("GET", f"{API_V1}/vehicles/KA01AB1234"),
        ("GET", f"{API_V1}/vehicles"),
        ("GET", f"{API_V1}/challans"),
        ("POST", f"{API_V1}/challans"),
        ("GET", f"{API_V1}/reports/dashboard"),
        ("GET", f"{API_V1}/admin/officers")
    ]
    for method, url in protected_urls:
        if method == "GET":
            r = requests.get(url)
        else:
            r = requests.post(url, json={})
        assert r.status_code == 401, f"Expected 401 for unauthenticated {method} {url}, got {r.status_code}"

def test_rbac_privilege_separation(officer_token, admin_token):
    """Phase 4.3: Officer (403) vs Admin (200) access to /api/v1/admin/* endpoints."""
    officer_headers = {"Authorization": f"Bearer {officer_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Patrol Officer cannot access admin routes
    r_off = requests.get(f"{API_V1}/admin/officers", headers=officer_headers)
    assert r_off.status_code == 403, f"Expected 403 Forbidden for patrol officer, got {r_off.status_code}"

    r_audit = requests.get(f"{API_V1}/admin/audit-logs", headers=officer_headers)
    assert r_audit.status_code == 403

    # 2. Admin can access admin routes
    r_adm = requests.get(f"{API_V1}/admin/officers", headers=admin_headers)
    assert r_adm.status_code == 200
    assert isinstance(r_adm.json(), list)

def test_input_validation_and_422_errors(officer_token):
    """Phase 4.4: Missing fields, bad data types, empty bodies trigger 422."""
    headers = {"Authorization": f"Bearer {officer_token}"}

    # 1. Login with empty payload
    r1 = requests.post(f"{API_V1}/auth/login", json={})
    assert r1.status_code == 422

    # 2. Create challan with missing registration_number
    r2 = requests.post(f"{API_V1}/challans", headers=headers, json={"fine_amount": 1000})
    assert r2.status_code == 422

    # 3. Create challan with invalid type for fine_amount (string instead of float)
    r3 = requests.post(f"{API_V1}/challans", headers=headers, json={
        "registration_number": "KA01AB1234",
        "fine_amount": "one_thousand_rupees"
    })
    assert r3.status_code == 422

def test_wrong_http_methods(officer_token):
    """Phase 4.5: Wrong HTTP method triggers 405 Method Not Allowed."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    
    # POST to /api/v1/vehicles/{plate} (which only accepts GET)
    r = requests.post(f"{API_V1}/vehicles/KA01AB1234", headers=headers, json={})
    assert r.status_code == 405

def test_non_existent_resource_404(officer_token):
    """Phase 4.6: Non-existent vehicle and non-existent challan return 404."""
    headers = {"Authorization": f"Bearer {officer_token}"}

    r_veh = requests.get(f"{API_V1}/vehicles/XX99YY9999", headers=headers)
    assert r_veh.status_code == 404
    assert "No vehicle record found" in r_veh.json()["detail"]

    r_chal = requests.get(f"{API_V1}/challans/NON_EXISTENT_CHALLAN_ID", headers=headers)
    assert r_chal.status_code == 404

def test_error_responses_do_not_leak_internals(officer_token):
    """Phase 4.7: Ensure API responses never leak stack traces, file paths, or DB passwords."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    
    # Send malformed query parameter
    r = requests.get(f"{API_V1}/vehicles?limit=-99", headers=headers)
    assert r.status_code == 422
    body = r.text
    assert "Traceback" not in body
    assert "sqlalchemy" not in body.lower()
    assert "password" not in body.lower()
    assert "C:\\Users\\" not in body

if __name__ == "__main__":
    pytest.main(["-v", __file__])
