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
7. **Repeat Offender Timeline:** Chronological violation logs with PDF and receipt generation.
8. **Challan Generated History:** Centralized enforcement logs with live status filtering (`ALL`, `UNPAID`, `PAID`, `DISPUTED`) and real-time plate search.
9. **Dual-Scope Enforcement View:** Instant zero-latency switching between `CENTRAL STATION` aggregate metrics and `MY CITATIONS` personal shift tracking.

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

## 3. High-Contrast Enforcement UI & Accessibility

- **Brutalist-Lite Theme:** Clean high-contrast monochrome and golden-yellow styling for crisp readability in intense roadside sunlight.
- **Night Patrol Dark Mode:** Single-click theme toggle providing low-glare visibility for late-night highway checkpoints.
- **Offline Resilience:** Local token caching ensuring smooth session handling even in cellular dead zones.

---

## 4. Demo Accounts & Sample Vehicles

### Officer Sign In Quick-Fills
| Quick-Fill Identifier | Role / Description | Officer Name | Badge ID | Password | Access Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `USER-2026` | **Demo Operator (Clean Shift)** | Inspector Lokeshwar P J | `KA-POL-2026` | `traffic123` | Roadside checks, camera ANPR, challan issuance |
| `OPERATOR-1` | **Checkpoint Patrol Staff** | Sub-Inspector Ramesh Kumar | `KA-POL-1001` | `officer123` | Roadside checks, camera ANPR, challan issuance |
| `ADMIN-01` | **System / Station Admin** | AC Anand Patil | `KA-POL-ADMIN` | `admin123` | Central station oversight & full enforcement audit |

### Seeded Test License Plates
- `KA20MG5550` — Toyota Fortuner (Expired Insurance & PUC, Red Alert)
- `HR26DQ5551` — Honda City (Pending Road Tax & Expired Insurance, Red Alert)
- `HR71H0003` — Mercedes-Benz GLE (Expired PUC & Unpaid Citations, Red Alert)
- `KL58AG3406` — Hyundai i20 (PUC Expiring within 20 days, Amber Warning)
- `KA01AB1234` — Tata Nexon (100% Compliant, All Green)
- `KA03MG4567` — Hyundai Creta (Expiring PUC in 12 days, Amber Alert)
- `DL04CC9999` — Mahindra XUV700 (Expired Insurance, Red Alert)
- `KA05NB3321` — Royal Enfield Classic (Expired PUC + 1 Pending Fine)
- `KA04EF1122` — Tata Punch (Pending Road Tax, Red Alert)
- `22BH9988AA` — Toyota Innova (Bharat BH Series, All Green)
- `KA53Z9000` — Ather 450X EV (Chronic Offender, 3 Unpaid Challans)

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

