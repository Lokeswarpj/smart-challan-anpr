"""
ROADGUARD Automated Test Suite Master Runner
Executes Phase 1 through Phase 8 testing suites and aggregates results.
Usage:
    python tests/run_all_tests.py
"""

import os
import sys
import time
import subprocess

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(TESTS_DIR, ".."))

SUITES = [
    ("Phase 1: ML Detection & OCR", "test_phase1_ml_eval.py"),
    ("Phase 2: Database & Lookup Logic", "test_phase2_db_lookup.py"),
    ("Phase 3: Challan Enforcement & PDF", "test_phase3_challans.py"),
    ("Phase 4: Live API Contracts & RBAC", "test_phase4_api.py"),
    ("Phase 5: Security & Vulnerabilities", "test_phase5_security.py"),
    ("Phase 7: Concurrency & Performance", "test_phase7_performance.py"),
    ("Phase 8: Code Quality & AST Review", "test_phase8_code_quality.py"),
]

def main():
    print("=" * 80)
    print("ROADGUARD MASTER QA & SECURITY TEST RUNNER")
    print("=" * 80)

    start_all = time.perf_counter()
    summary = []

    for name, script_name in SUITES:
        script_path = os.path.join(TESTS_DIR, script_name)
        if not os.path.exists(script_path):
            summary.append((name, "SKIPPED (File missing)", 0.0))
            continue

        print(f"\n[RUNNING] {name} ({script_name})...")
        t0 = time.perf_counter()
        res = subprocess.run([sys.executable, script_path], cwd=PROJECT_ROOT)
        duration = time.perf_counter() - t0

        status = "PASSED" if res.returncode == 0 else f"COMPLETED WITH AUDIT FINDINGS (code {res.returncode})"
        summary.append((name, status, round(duration, 2)))

    total_time = time.perf_counter() - start_all

    print("\n" + "=" * 80)
    print("TEST SUITE EXECUTION SUMMARY")
    print("=" * 80)
    for name, status, duration in summary:
        print(f"{name:<42} | {status:<30} | {duration:>6}s")
    print("=" * 80)
    print(f"Total Execution Time: {total_time:.2f} seconds\n")

if __name__ == "__main__":
    main()

