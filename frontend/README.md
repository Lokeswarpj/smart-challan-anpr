# ROADGUARD — AI-Powered Vehicle Document Verification & Digital Challan System

> **Tagline:** VERIFY SMARTER. ENFORCE FASTER.  
> **Aesthetic Philosophy:** Brutalist-Lite SaaS (Inspired by FLUX)  
> **Target Platform:** Roadside Traffic Police Enforcement Dashboard & Public Landing Page

---

## 1. Project Overview

ROADGUARD is an AI-powered vehicle document verification and traffic enforcement system. The application combines computer vision (YOLOv8 + EasyOCR) with central database records to deliver sub-2-second compliance checks for traffic police officers in the field.

### Core Capabilities
1. **Public SaaS Landing Page:** Editorial Brutalist-Lite marketing site featuring an interactive browser mockup, 40px grid backgrounds, statistics, bento feature grid, and process steps.
2. **Officer Authentication:** Split-screen login with PBKDF2 HMAC-SHA256 hashed credentials and HS256 JWT access tokens.
3. **Dual-Mode Verification:**
   - **Manual Alphanumeric Search:** Keyboard entry with automatic uppercase conversion and Indian HSRP / BH series regex validation.
   - **Camera ANPR Scanner:** Live camera feed with target reticle, scanning animation, optical deskewing, and character recognition.
4. **4-in-1 Document Status Engine:** Unified visual cards for Registration Certificate (RC), Vehicle Insurance, Pollution Under Control (PUC), and Road Tax with color-coded status badges:
   - 🟢 **Green (Valid):** Valid document with $>30$ days remaining.
   - 🟡 **Amber (Expiring Soon):** Document expiring within $30$ days.
   - 🔴 **Red (Expired / Pending):** Expired document or pending road tax.
5. **Digital Challan Management:** Form auto-filling vehicle and owner records with statutory Motor Vehicles Act fines, and instant printable/downloadable PDF receipts with scannable payment QR codes.
6. **Multi-Channel Dispatch:** Simulated email and SMS dispatch directly to vehicle owners.
7. **Repeat Offender Timeline:** Chronological violation logs with PDF and Excel export facilities.
8. **Departmental Analytics:** Responsive Recharts visualizing verification throughput, document status splits, and violation category distributions.
9. **Administrative Console:** Registry CRUD operations, officer directory, and tamper-proof audit trails.

---

## 2. Design System & Tokens

### Color Palette
- **Primary Charcoal:** `#171E19`
- **Secondary Dark:** `#272727`
- **Accent Golden-Yellow:** `#FFE17C` (CTA highlight bars and active nav pills)
- **Sage Neutral:** `#B7C6C2`
- **Light Surface:** `#FFFFFF` & `#F8F9FA`
- **Status Success:** `#22C55E`
- **Status Danger:** `#EF4444`
- **Status Warning:** `#F59E0B`

### Typography Hierarchy
- **Display Headings:** `Anton` (Uppercase display, tight 0.92 line height)
- **Body & UI Elements:** `Satoshi` / Modern Sans-Serif (High legibility)

### Visual Effects
- **40px Grid Pattern:** `linear-gradient(to right, rgba(183, 198, 194, 0.22) 1px, transparent 1px)`
- **Brutalist Shadows:** `shadow-brutal` (`4px 4px 0px 0px #171E19`)

---

## 3. Multilingual & Accessibility

- **Multilingual Support (`react-i18next`):** Complete UI translations for **English (EN)**, **Hindi (हिन्दी)**, and **Kannada (ಕನ್ನಡ)**.
- **Hands-Free Audio Voice Alerts (Web Speech API):** Automatic text-to-speech announcement of vehicle detection and violation flags (e.g. *"Vehicle KA05NB3321 verified. Pollution certificate expired."*).
- **Display Modes:**
  - **Light Mode:** Standard crisp editorial presentation.
  - **Dark Mode:** Night patrol low-light mode.
  - **Outdoor Mode:** Direct sunlight high-contrast mode with bold borders and saturated badges.
- **Offline Resilience:** Local caching with IndexedDB / LocalStorage ensuring functionality in cellular dead zones.

---

## 4. Demo Accounts & Sample Vehicles

### Officer Sign In Credentials
| Role | Badge ID | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Officer** | `KA-POL-1001` | `officer123` | Roadside checks, camera ANPR, challan issuance |
| **Officer** | `KA-POL-1002` | `officer123` | Roadside checks, camera ANPR, challan issuance |
| **Admin** | `KA-POL-ADMIN` | `admin123` | Full access + vehicle registry management & audit logs |

### Seeded Test License Plates
- `KA01AB1234` — Tata Nexon (100% Compliant, All Green)
- `KA03MG4567` — Hyundai Creta (Expiring PUC in 12 days, Amber Alert)
- `MH12DE7890` — Maruti Swift (Expiring Insurance in 20 days, Amber Alert)
- `DL04CC9999` — Mahindra XUV700 (Expired Insurance, Red Alert)
- `KA05NB3321` — Royal Enfield Classic (Expired PUC + 1 Pending Fine)
- `KA04EF1122` — Tata Punch (Pending Road Tax, Red Alert)
- `22BH9988AA` — Toyota Innova (Bharat BH Series, All Green)
- `DL01A1001` — Honda Activa (Classic Series, All Green)
- `KA53Z9000` — Ather 450X EV (Chronic Offender, 3 Unpaid Challans)
- `MH02CB5555` — Tata 407 (Commercial Goods, Triple Expired)

---

## 5. Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:5173` in your browser.

### 3. Generate Production Build
```bash
npm run build
```
Build output is generated in `dist/`.
