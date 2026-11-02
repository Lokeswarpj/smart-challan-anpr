# AI & Computer Vision Model Directory

This directory contains the machine learning assets, training pipeline, and weights for license plate localization.

## Contents
- **`train.py`**: Training and validation script utilizing Ultralytics YOLOv8. Fine-tunes the base model on vehicle license plate bounding boxes.
- **`yolov8n.pt`**: YOLOv8 nano pre-trained model weights.
- **`weights/`**: Directory where fine-tuned checkpoints (`best.pt`, `last.pt`) are saved during training.

## Usage
To train or fine-tune the YOLOv8 model:
```bash
python ai_model/train.py --epochs 25 --batch 16
```
