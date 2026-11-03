FROM python:3.11-slim

# Environment settings
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    EASYOCR_MODULE_PATH=/home/user/.EasyOCR

# Install Linux system dependencies for OpenCV and certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (Hugging Face Spaces runs as UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /app

# Pre-install CPU-only PyTorch and torchvision
RUN pip install --no-cache-dir --user torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install dependencies
COPY --chown=user:user requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --user -r requirements.txt

# Create writable EasyOCR model weights cache directory
RUN mkdir -p /home/user/.EasyOCR

# Copy backend application source code
COPY --chown=user:user . /app

# Hugging Face Spaces listens on port 7860
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
