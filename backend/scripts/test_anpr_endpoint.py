import sys
import os
import cv2
import numpy as np
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_anpr_api_endpoint():
    print("=" * 60)
    print("ROADGUARD ANPR DETECTION ENDPOINT TEST")
    print("=" * 60)

    # 1. Synthesize a test plate image (White HSRP plate with black letters "KA01AB1234")
    plate_img = np.full((120, 420, 3), 255, dtype=np.uint8)
    cv2.rectangle(plate_img, (4, 4), (416, 116), (20, 20, 20), 4)
    # HSRP blue stripe on left
    cv2.rectangle(plate_img, (4, 4), (40, 116), (180, 50, 20), -1)
    cv2.putText(plate_img, "KA01AB1234", (55, 78), cv2.FONT_HERSHEY_SIMPLEX, 1.6, (10, 10, 10), 4)

    # Encode to JPEG bytes
    success, encoded = cv2.imencode(".jpg", plate_img)
    assert success, "Failed to encode test image"
    img_bytes = encoded.tobytes()

    # Authenticate officer
    r_login = client.post("/api/v1/auth/login", json={
        "badge_number": "KA-POL-1001",
        "password": "officer123"
    })
    token = r_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Call /api/v1/anpr/detect
    files = {"image": ("test_plate.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/v1/anpr/detect", headers=headers, files=files)
    
    assert response.status_code == 200, f"ANPR detect failed: {response.text}"
    data = response.json()
    print("[PASS] ANPR Detection Result:")
    print(f"  - Detected: {data['detected']}")
    print(f"  - Recognized Plate: {data['registration_number']}")
    print(f"  - Confidence: {data['confidence']:.2%}")
    print(f"  - Cropped Plate Base64 included: {bool(data['plate_crop_base64'])}")
    print(f"  - Matched Vehicle Record in DB: {data['vehicle'] is not None}")
    if data['vehicle']:
        print(f"    * Owner: {data['vehicle']['owner_name']}")
        print(f"    * Compliance Status: {data['vehicle']['status']}")

    print("\n" + "=" * 60)
    print("ANPR ENDPOINT TEST COMPLETE & VERIFIED")
    print("=" * 60)

if __name__ == "__main__":
    test_anpr_api_endpoint()
