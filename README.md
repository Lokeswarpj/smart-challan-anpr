# ROADGUARD — Smart ANPR Vehicle Document Verification & Digital Challan System

> **Tagline:** VERIFY SMARTER. ENFORCE FASTER.  
> **Academic Context:** Mini Project (2 Credits) — B.Tech, Artificial Intelligence & Machine Learning (Semester V)  
> **Repository:** [https://github.com/Lokeswarpj/smart-challan-anpr](https://github.com/Lokeswarpj/smart-challan-anpr)

---

## 📁 Repository Directory Structure

```text
Mini_Project/
├── backend/                  # FastAPI Backend, Database & Vision Services
│   ├── app/
│   │   ├── core/             # Configuration & Security (JWT, PBKDF2)
│   │   ├── db/               # SQLAlchemy Models & PostgreSQL/SQLite Session
│   │   └── services/         # YOLOv8 Detector, OpenCV Preprocessor, EasyOCR, Regex
│   ├── scripts/              # Synthetic Dataset Generator & ANPR Evaluation Benchmark
│   ├── vehicle_verification.db # Seeded SQLite Database (310 vehicles, 208 challans)
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Backend environment configuration
│
├── frontend/                 # React.js + Tailwind CSS SaaS Dashboard (Vite)
│   ├── src/
│   │   ├── components/       # Common UI, Layout (Sidebar/Navbar), Landing & Modals
│   │   ├── pages/            # 11 Dedicated Pages (Landing, Login, Dashboard, ANPR, etc.)
│   │   ├── context/          # Auth, Theme (Light/Dark/Outdoor), Multilingual Contexts
│   │   ├── services/         # API Client & Mock Fallback Layer
│   │   ├── mocks/            # 10 Ground-Truth Vehicles & 200+ Challan Records
│   │   ├── i18n/             # Translations: English, Hindi (हिन्दी), Kannada (ಕನ್ನಡ)
│   │   └── styles/           # Brutalist-Lite Tokens (FLUX reference) & 40px Grid
│   ├── package.json          # Node dependencies
│   └── README.md             # Detailed Frontend Documentation
│
├── ai_model/                 # Computer Vision & Deep Learning Training Assets
│   ├── train.py              # Ultralytics YOLOv8 training script
│   ├── yolov8n.pt            # YOLOv8 base model weights
│   └── README.md             # Model documentation
│
├── docs/                     # Project Reports & Academic Submissions
│   ├── YOLOv8_ANPR_Project_Report_and_Comparison.pdf # Project report
│   └── README.md             # Documentation overview
│
├── .gitignore                # Global git ignore rules
└── README.md                 # Project Overview & Architecture (this file)
```

---

## 🚀 Quick Execution Guide

### 1. Run the Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

### 2. Run the Backend API (FastAPI + AI Engine)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
- API Health & Status: **[http://localhost:8000](http://localhost:8000)**
- Interactive Swagger Docs: **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

### 💡 For Group Project Teammates (Using Antigravity or VS Code)
If you are collaborating on this project:
1. Clone the repository:
   ```bash
   git clone https://github.com/Lokeswarpj/smart-challan-anpr.git
   ```
2. Open the cloned folder in **Antigravity**.
3. You can simply ask the Antigravity assistant:
   > *"Run the frontend and backend servers and give me the links"*  
   and Antigravity will launch both servers and provide clickable links!

---

#### Demo Credentials:
- **Officer Account:** Badge: `KA-POL-1001` | Password: `officer123`
- **Admin Account:** Badge: `KA-POL-ADMIN` | Password: `admin123`

#### Seeded Test License Plates:
- `KA01AB1234` — 100% Compliant (All Green: RC, Insurance, PUC, Road Tax valid)
- `KA03MG4567` — Expiring PUC in 12 days (Amber Alert)
- `MH12DE7890` — Expiring Insurance in 20 days (Amber Alert)
- `DL04CC9999` — Expired Insurance (Red Alert)
- `KA05NB3321` — Expired PUC + 1 recorded fine (Red Alert)
- `KA04EF1122` — Pending Road Tax (Red Alert)
- `22BH9988AA` — Bharat (BH) Series Plate (Green)
- `KA53Z9000` — Chronic Violator (3 Unpaid Fines)

---

### 2. Run the ANPR Pipeline Benchmark
```bash
python backend/scripts/evaluate_anpr.py
```
Outputs automated detection metrics, Character Error Rate (CER), and pipeline latency ($< 2.0\text{s}$ SLA).

---

### 3. Re-seed Synthetic Dataset
```bash
python backend/scripts/generate_synthetic_data.py --count 300
```
Populates PostgreSQL (or fallback SQLite `backend/vehicle_verification.db`) with 300+ vehicles, compliant with Indian RTO formats.
