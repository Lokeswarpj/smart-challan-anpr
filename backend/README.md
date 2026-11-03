---
title: Roadguard ANPR API
emoji: 🛡️
colorFrom: yellow
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

# ROADGUARD AI — Vehicle Document Verification & ANPR Backend

High-throughput FastAPI backend for the ROADGUARD AI-Powered Vehicle Document Verification System using Automatic Number Plate Recognition (ANPR).

- **Architecture:** FastAPI, SQLAlchemy ORM, EasyOCR, PyTorch, ReportLab
- **Database:** Supabase Cloud PostgreSQL 17
- **Port:** 7860 (Hugging Face Spaces internal routing)
- **Health Check:** `/health`
- **Documentation:** `/docs` (Swagger UI)
