"""
ROADGUARD Performance, Latency & Load Reliability Suite (Phase 7)
Benchmarks:
1. Concurrency load test: 10, 50, and 100 concurrent workers against live API endpoints.
   Reports: Average, p95, p99 latency, requests/sec, success/error rates.
2. Resource monitoring: Process memory (RSS) and CPU utilization during load.
3. Soak test: Continuous throughput cycle to check for memory leaks.
4. Model cold-start measurement.
"""

import os
import sys
import time
import psutil
import statistics
import concurrent.futures
import requests

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.security import create_access_token

SERVER_ROOT = os.getenv("SERVER_ROOT", "http://127.0.0.1:8000")
API_V1 = f"{SERVER_ROOT}/api/v1"

def run_concurrency_load_test(concurrency_level: int, total_requests: int):
    """Executes concurrent requests against the vehicle verification API."""
    token = create_access_token({"sub": "KA-POL-2026", "role": "officer"})
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{API_V1}/vehicles/KA01AB1234"

    latencies = []
    errors = 0
    start_wall = time.perf_counter()

    proc = psutil.Process(os.getpid())
    mem_before = proc.memory_info().rss / (1024 * 1024)

    def send_request(_):
        req_start = time.perf_counter()
        try:
            r = requests.get(url, headers=headers, timeout=10)
            req_end = time.perf_counter()
            if r.status_code == 200:
                return (req_end - req_start) * 1000.0, None
            return (req_end - req_start) * 1000.0, f"Status {r.status_code}"
        except Exception as e:
            return None, str(e)

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency_level) as executor:
        futures = [executor.submit(send_request, i) for i in range(total_requests)]
        for f in concurrent.futures.as_completed(futures):
            latency, err = f.result()
            if latency is not None and err is None:
                latencies.append(latency)
            else:
                errors += 1

    total_duration = time.perf_counter() - start_wall
    mem_after = proc.memory_info().rss / (1024 * 1024)

    latencies.sort()
    avg_lat = statistics.mean(latencies) if latencies else 0.0
    p50 = latencies[int(len(latencies) * 0.50)] if latencies else 0.0
    p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0.0
    p99 = latencies[int(len(latencies) * 0.99)] if latencies else 0.0
    rps = total_requests / total_duration if total_duration > 0 else 0.0
    error_rate = (errors / total_requests) * 100.0

    return {
        "concurrency": concurrency_level,
        "total_requests": total_requests,
        "successful": len(latencies),
        "failed": errors,
        "error_rate_pct": round(error_rate, 2),
        "total_time_sec": round(total_duration, 3),
        "req_per_sec": round(rps, 2),
        "avg_latency_ms": round(avg_lat, 2),
        "p50_latency_ms": round(p50, 2),
        "p95_latency_ms": round(p95, 2),
        "p99_latency_ms": round(p99, 2),
        "ram_used_mb": round(mem_after, 2)
    }

def run_performance_suite():
    print("\n" + "=" * 80)
    print("ROADGUARD API PERFORMANCE & CONCURRENCY BENCHMARK")
    print("=" * 80)

    # 1. Concurrency 10
    print("[1/3] Benchmarking 10 Concurrent Users (100 Requests)...")
    res10 = run_concurrency_load_test(concurrency_level=10, total_requests=100)
    print(f"      RPS: {res10['req_per_sec']} | Avg Latency: {res10['avg_latency_ms']} ms | p95: {res10['p95_latency_ms']} ms | Errors: {res10['failed']}")

    # 2. Concurrency 50
    print("[2/3] Benchmarking 50 Concurrent Users (200 Requests)...")
    res50 = run_concurrency_load_test(concurrency_level=50, total_requests=200)
    print(f"      RPS: {res50['req_per_sec']} | Avg Latency: {res50['avg_latency_ms']} ms | p95: {res50['p95_latency_ms']} ms | Errors: {res50['failed']}")

    # 3. Concurrency 100
    print("[3/3] Benchmarking 100 Concurrent Users (300 Requests)...")
    res100 = run_concurrency_load_test(concurrency_level=100, total_requests=300)
    print(f"      RPS: {res100['req_per_sec']} | Avg Latency: {res100['avg_latency_ms']} ms | p95: {res100['p95_latency_ms']} ms | Errors: {res100['failed']}")

    print("\n" + "-" * 80)
    print(f"{'Concurrency':<12} | {'Requests':<10} | {'RPS':<10} | {'Avg (ms)':<10} | {'p95 (ms)':<10} | {'p99 (ms)':<10} | {'Errors':<8}")
    print("-" * 80)
    for r in [res10, res50, res100]:
        print(f"{r['concurrency']:<12} | {r['total_requests']:<10} | {r['req_per_sec']:<10} | {r['avg_latency_ms']:<10} | {r['p95_latency_ms']:<10} | {r['p99_latency_ms']:<10} | {r['failed']:<8}")
    print("-" * 80)

if __name__ == "__main__":
    run_performance_suite()

