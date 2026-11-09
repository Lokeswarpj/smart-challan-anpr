"""
Ultralytics YOLO Training Script for License Plate Detection
Dataset: Combined Unique + Roboflow Dataset (7,233 total annotated images)
Train: 5,116 | Valid: 1,512 | Test: 605
"""

import argparse
from pathlib import Path
import torch
from ultralytics import YOLO

def main():
    parser = argparse.ArgumentParser(description="Train YOLOv8 on Unique License Plate Dataset")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs (default: 50)")
    parser.add_argument("--batch", type=int, default=16, help="Batch size (default: 16)")
    parser.add_argument("--model", type=str, default="yolov8s.pt", help="Base model weights (default: yolov8s.pt)")
    parser.add_argument("--device", type=str, default="", help="Device: 'cpu', '0', etc. Defaults to auto-detect")
    args = parser.parse_args()

    # 1. Path to data.yaml
    dataset_yaml = Path(r"c:\Users\lokes\OneDrive\Desktop\Mini_Project\unique dataset\data.yaml")
    
    if not dataset_yaml.exists():
        raise FileNotFoundError(f"Configuration file not found at: {dataset_yaml}")
        
    print(f"Loading dataset config from: {dataset_yaml}")
    
    # 2. Automatically select device
    if args.device:
        selected_device = args.device
    else:
        selected_device = 0 if torch.cuda.is_available() else "cpu"
    print(f"Using device: {selected_device} (CUDA available: {torch.cuda.is_available()})")

    # 3. Select pre-trained base model
    weights_local = Path(__file__).parent / args.model
    model_source = str(weights_local) if weights_local.exists() else args.model
    print(f"Initializing YOLO model using base weights: {model_source}")
    model = YOLO(model_source)
    
    # 4. Train the model
    print(f"Starting training on unique dataset (Epochs: {args.epochs}, Batch: {args.batch}, Model: {args.model})...")
    results = model.train(
        data=str(dataset_yaml),
        epochs=args.epochs,
        imgsz=640,
        batch=args.batch,
        patience=10,
        cos_lr=True,
        device=selected_device,
        workers=2,
        project="LicensePlate_Project",
        name="yolov8s_unique_detector",
        exist_ok=True
    )
    
    # 5. Evaluate on test set
    print("\nRunning final evaluation on the 605 unseen test images...")
    metrics = model.val(split="test")
    print(f"mAP@50:    {metrics.box.map50:.4f}")
    print(f"mAP@50-95: {metrics.box.map:.4f}")
    print(f"Precision: {metrics.box.p[0]:.4f}")
    print(f"Recall:    {metrics.box.r[0]:.4f}")

if __name__ == "__main__":
    main()
