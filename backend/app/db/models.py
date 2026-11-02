from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.base import Base

class Officer(Base):
    __tablename__ = "officers"
    
    id = Column(Integer, primary_key=True, index=True)
    badge_number = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    station = Column(String(150), default="Traffic Police Central HQ")
    role = Column(String(30), default="officer")  # officer, admin, supervisor
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    challans = relationship("Challan", back_populates="officer")
    audit_logs = relationship("AuditLog", back_populates="officer")

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    registration_number = Column(String(20), primary_key=True, index=True)
    owner_name = Column(String(120), nullable=False)
    owner_phone = Column(String(20), nullable=False)
    owner_email = Column(String(120), nullable=False)
    vehicle_class = Column(String(60), default="Motor Car (LMV)")
    maker_model = Column(String(100), nullable=False)
    fuel_type = Column(String(30), default="Petrol")
    registration_date = Column(Date, nullable=False)
    registered_rto = Column(String(100), nullable=False)
    color = Column(String(30), default="White")
    
    # Relationships to compliance documents
    rc_record = relationship("RCRecord", back_populates="vehicle", uselist=False, cascade="all, delete-orphan")
    insurance_record = relationship("InsuranceRecord", back_populates="vehicle", uselist=False, cascade="all, delete-orphan")
    puc_record = relationship("PUCRecord", back_populates="vehicle", uselist=False, cascade="all, delete-orphan")
    tax_record = relationship("TaxRecord", back_populates="vehicle", uselist=False, cascade="all, delete-orphan")
    challans = relationship("Challan", back_populates="vehicle", cascade="all, delete-orphan")

class RCRecord(Base):
    __tablename__ = "rc_records"
    
    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(20), ForeignKey("vehicles.registration_number"), nullable=False, unique=True)
    rc_number = Column(String(50), unique=True, nullable=False)
    chassis_number = Column(String(50), nullable=False)
    engine_number = Column(String(50), nullable=False)
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    status = Column(String(20), default="valid")  # valid, expired
    
    vehicle = relationship("Vehicle", back_populates="rc_record")

class InsuranceRecord(Base):
    __tablename__ = "insurance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(20), ForeignKey("vehicles.registration_number"), nullable=False, unique=True)
    policy_number = Column(String(60), unique=True, nullable=False)
    insurer_name = Column(String(100), nullable=False)
    policy_type = Column(String(50), default="Comprehensive")
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    status = Column(String(20), default="valid")  # valid, expired
    
    vehicle = relationship("Vehicle", back_populates="insurance_record")

class PUCRecord(Base):
    __tablename__ = "puc_records"
    
    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(20), ForeignKey("vehicles.registration_number"), nullable=False, unique=True)
    certificate_number = Column(String(60), unique=True, nullable=False)
    emission_norm = Column(String(30), default="BS-VI")
    tested_value = Column(String(80), default="CO: 0.15%, HC: 48 ppm")
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    status = Column(String(20), default="valid")  # valid, expired
    
    vehicle = relationship("Vehicle", back_populates="puc_record")

class TaxRecord(Base):
    __tablename__ = "tax_records"
    
    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(20), ForeignKey("vehicles.registration_number"), nullable=False, unique=True)
    tax_type = Column(String(60), default="Life Time Tax (LTT)")
    amount_paid = Column(Float, default=15000.0)
    payment_date = Column(Date, nullable=False)
    valid_until = Column(Date, nullable=False)
    status = Column(String(20), default="paid")  # paid, pending
    
    vehicle = relationship("Vehicle", back_populates="tax_record")

class Challan(Base):
    __tablename__ = "challans"
    
    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    challan_number = Column(String(60), unique=True, index=True, nullable=False)
    registration_number = Column(String(20), ForeignKey("vehicles.registration_number"), nullable=False)
    officer_id = Column(Integer, ForeignKey("officers.id"), nullable=False)
    
    violation_code = Column(String(30), nullable=False)
    violation_title = Column(String(150), nullable=False)
    rule_section = Column(String(80), nullable=False)
    fine_amount = Column(Float, nullable=False)
    location = Column(String(150), nullable=False)
    
    issued_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(Date, nullable=False)
    payment_status = Column(String(20), default="unpaid")  # unpaid, paid, disputed
    dispatch_status = Column(String(30), default="pending")  # pending, sent_email, sent_sms, sent_both, failed
    pdf_receipt_path = Column(String(255), nullable=True)
    
    vehicle = relationship("Vehicle", back_populates="challans")
    officer = relationship("Officer", back_populates="challans")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    officer_id = Column(Integer, ForeignKey("officers.id"), nullable=True)
    officer_badge = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)  # lookup_manual, lookup_anpr, issue_challan, export_history
    registration_queried = Column(String(20), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(50), default="127.0.0.1")
    details = Column(Text, nullable=True)
    
    officer = relationship("Officer", back_populates="audit_logs")

