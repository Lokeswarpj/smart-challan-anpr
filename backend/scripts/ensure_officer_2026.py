import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db.session import SessionLocal, engine, active_db_type
from app.db.models import Officer
from app.core.security import hash_password, verify_password

def ensure_officer():
    print(f"Connecting to database: {engine.url}")
    db = SessionLocal()
    try:
        officers = db.query(Officer).all()
        print(f"Total officers found: {len(officers)}")
        for o in officers:
            print(f" - [{o.badge_number}] {o.name} ({o.role}) | Active: {o.is_active}")

        target_badge = "KA-POL-2026"
        officer = db.query(Officer).filter(Officer.badge_number.ilike(target_badge)).first()

        if not officer:
            print(f"\nAdding missing officer: {target_badge}...")
            officer = Officer(
                badge_number="KA-POL-2026",
                name="Inspector Lokeshwar P J",
                station="Indiranagar Traffic BPS, Bengaluru",
                role="officer",
                hashed_password=hash_password("traffic123"),
                is_active=True
            )
            db.add(officer)
            db.commit()
            print(f"SUCCESS: Created officer {target_badge}!")
        else:
            print(f"\nOfficer {target_badge} exists! Ensuring active & password set to traffic123...")
            officer.hashed_password = hash_password("traffic123")
            officer.is_active = True
            db.commit()
            print(f"SUCCESS: Updated officer {target_badge}!")

        # Verify password check
        fresh = db.query(Officer).filter(Officer.badge_number.ilike(target_badge)).first()
        print(f"Password 'traffic123' verification: {verify_password('traffic123', fresh.hashed_password)}")
    finally:
        db.close()

if __name__ == "__main__":
    ensure_officer()

