# ROADGUARD Automated Testing & Quality Assurance Suite

This directory contains the automated test suites, synthetic datasets, performance benchmarks, and security evaluation scripts developed for the **Smart Traffic Police Dashboard (ROADGUARD)**.

---

## Directory Structure

```
tests/
├── conftest.py                   # Pytest fixtures, test database setup, and mock credentials
├── data/
│   └── plates/                   # 100+ synthetic and transformed vehicle plate images
│       └── ground_truth.csv      # Ground truth labels, categories, and plate text
├── test_phase1_ml_eval.py        # Phase 1: YOLOv8 plate detection & EasyOCR benchmark
├── test_phase2_db_lookup.py      # Phase 2: Database lookup variations & date boundary tests
├── test_phase3_challans.py       # Phase 3: Challan generation, double submission & PDF receipts
├── test_phase4_api.py            # Phase 4: Live FastAPI contract, auth & RBAC validation
├── test_phase5_security.py       # Phase 5: SAST, SQLi fuzzing, ReportLab XSS & auth bypass
├── test_phase7_performance.py    # Phase 7: Load testing (10, 50, 100 concurrent workers)
├── test_phase8_code_quality.py   # Phase 8: AST parser for function length, swallowed errors
├── run_all_tests.py              # Master runner to execute all phases sequentially
└── README.md                     # Test instructions and documentation (this file)
```

---

## Prerequisites

Ensure backend dependencies are installed in your active Python environment:
```bash
pip install -r backend/requirements.txt
```

To run Phase 4 and Phase 7 (live API contracts and concurrency load tests), the FastAPI backend server must be running on port 8000:
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## Execution Guide

### 1. Run All Tests
To execute all test suites sequentially with aggregated pass/fail telemetry:
```bash
python tests/run_all_tests.py
```

### 2. Run Individual Test Phases

#### Phase 1: ML Model & Optical Pipeline Benchmark
Generates synthetic plates across 17 real-world distortion categories and computes IoU detection rate, character error rate (CER), latency, and top 10 confusion pairs:
```bash
python tests/test_phase1_ml_eval.py
```

#### Phase 2: Database & Date Boundary Logic
Tests boundary dates (today, yesterday, tomorrow), plate variations (spaces, hyphens, case), missing documents, and 50 simultaneous multithreaded lookups:
```bash
pytest tests/test_phase2_db_lookup.py -v
```

#### Phase 3: Challan Enforcement & PDF Generation
Verifies fine calculations, statutory compliance audits, double-click duplicate creation, and vector PDF receipt formatting:
```bash
pytest tests/test_phase3_challans.py -v
```

#### Phase 4: Live API Contracts & Status Codes
Audits HTTP response codes (200, 401, 403, 404, 405, 422), RBAC privilege boundaries, and input validation on running server:
```bash
pytest tests/test_phase4_api.py -v
```

#### Phase 5: Security Audit
Performs credentials scanning, SQL injection fuzzing, ReportLab XML tag injection, and unauthenticated bypass detection:
```bash
pytest tests/test_phase5_security.py -v -s
```

#### Phase 7: Concurrency & Performance Load Test
Simulates 10, 50, and 100 concurrent requests, measuring requests/sec, p50/p95/p99 latency, and system breaking limits:
```bash
python tests/test_phase7_performance.py
```

#### Phase 8: Code Quality & AST Architecture Audit
Scans Python AST trees across `backend/app/` for functions >50 lines, bare `except: pass` handlers, and technical debt:
```bash
python tests/test_phase8_code_quality.py
```

