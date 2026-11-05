import pandas as pd
import numpy as np

csv_path = r"c:\Users\lokes\OneDrive\Desktop\Mini_Project\ai_model\trained_run\results.csv"
df = pd.read_csv(csv_path)
df.columns = [c.strip() for c in df.columns]

best_map50 = df.loc[df['metrics/mAP50(B)'].idxmax()]
best_map50_95 = df.loc[df['metrics/mAP50-95(B)'].idxmax()]
best_p = df.loc[df['metrics/precision(B)'].idxmax()]
best_r = df.loc[df['metrics/recall(B)'].idxmax()]
final_epoch = df.iloc[-1]

print("=== USER TRAINED MODEL (best.pt) TRAINING RUN SUMMARY ===")
print(f"Total Epochs Trained: {len(df)}")
print(f"Final Epoch ({int(final_epoch['epoch'])}):")
print(f"  Precision:   {final_epoch['metrics/precision(B)']*100:.2f}%")
print(f"  Recall:      {final_epoch['metrics/recall(B)']*100:.2f}%")
print(f"  mAP@0.50:    {final_epoch['metrics/mAP50(B)']*100:.2f}%")
print(f"  mAP@0.5-0.95:{final_epoch['metrics/mAP50-95(B)']*100:.2f}%")
print(f"  Box Loss:    {final_epoch['val/box_loss']:.4f}")
print(f"  Cls Loss:    {final_epoch['val/cls_loss']:.4f}")

p = final_epoch['metrics/precision(B)']
r = final_epoch['metrics/recall(B)']
f1 = 2 * (p * r) / (p + r)
print(f"  F1-Score:    {f1*100:.2f}%")

import time
import torch
from ultralytics import YOLO

print("\n=== INFERENCE BENCHMARK TEST (CPU) ===")
model = YOLO(r"c:\Users\lokes\OneDrive\Desktop\Mini_Project\ai_model\best.pt")
dummy_img = np.zeros((640, 640, 3), dtype=np.uint8)

# Warmup
for _ in range(5):
    _ = model(dummy_img, verbose=False)

latencies = []
for _ in range(20):
    t0 = time.perf_counter()
    _ = model(dummy_img, verbose=False)
    latencies.append((time.perf_counter() - t0) * 1000)

avg_lat = np.mean(latencies)
p95_lat = np.percentile(latencies, 95)
print(f"Average CPU Latency: {avg_lat:.2f} ms")
print(f"95th Percentile:     {p95_lat:.2f} ms")
print(f"Theoretical FPS:     {1000/avg_lat:.1f} FPS")
