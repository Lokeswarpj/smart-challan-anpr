import React from 'react';
import { Camera, FileCheck2, Receipt, History, BarChart3, WifiOff } from 'lucide-react';

export default function FeatureGrid() {
  return (
    <section id="features" className="py-24 bg-white border-b-2 border-primary">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block bg-accent px-3 py-1 font-mono text-xs font-bold uppercase mb-4 border border-primary">
            ENGINEERED FOR FIELD OPERATIONS
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl text-primary tracking-tight">
            COMPREHENSIVE <span className="highlight-yellow">FEATURE SUITE</span>
          </h2>
          <p className="font-sans text-secondary text-base mt-4">
            Designed specifically for roadside police enforcement with zero cognitive overhead.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: ANPR (Spans 2 cols) */}
          <div className="md:col-span-2 bg-surface p-8 border-2 border-primary shadow-brutal flex flex-col justify-between relative overflow-hidden group hover:border-black transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary text-accent border border-primary">
                <Camera className="w-6 h-6" />
              </div>
              <span className="font-mono text-xs font-bold text-primary bg-accent px-2 py-0.5 border border-primary">
                YOLOv8 + EASYOCR
              </span>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-primary mb-2">
                AUTOMATIC NUMBER PLATE RECOGNITION (ANPR)
              </h3>
              <p className="font-sans text-sm text-secondary leading-relaxed max-w-xl">
                Point any mobile camera or tablet at oncoming vehicles. Custom-trained YOLOv8 locates the plate region, OpenCV corrects angle skew, and EasyOCR extracts registration text with regex error correction for Indian plate standards.
              </p>
            </div>
            {/* Visual Mini Mockup */}
            <div className="mt-6 p-4 bg-white border border-primary flex items-center justify-between font-mono text-xs shadow-brutal-sm">
              <span className="text-secondary">INPUT: [CAMERA_STREAM_FRAME_049]</span>
              <span className="text-success font-bold font-mono">EXTRACTED: KA01AB1234 (96.4%)</span>
            </div>
          </div>

          {/* Card 2: 4-in-1 Document Verification */}
          <div className="bg-white p-8 border-2 border-primary shadow-brutal flex flex-col justify-between hover:border-black transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-accent text-primary border border-primary">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <span className="font-mono text-xs font-bold text-success bg-green-100 px-2 py-0.5 border border-green-600">
                COLOR STATUS
              </span>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-primary mb-2">
                4-IN-1 STATUS ENGINE
              </h3>
              <p className="font-sans text-sm text-secondary leading-relaxed">
                Color-coded indicators: Green for valid documents, Amber for expiration within 30 days, and Red for expired records or pending road tax.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2 text-[10px] font-bold font-mono text-center">
              <div className="bg-green-100 text-green-900 border border-green-600 py-1.5">RC: VALID</div>
              <div className="bg-green-100 text-green-900 border border-green-600 py-1.5">INS: VALID</div>
              <div className="bg-red-100 text-red-900 border border-red-600 py-1.5">PUC: EXPIRED</div>
              <div className="bg-green-100 text-green-900 border border-green-600 py-1.5">TAX: PAID</div>
            </div>
          </div>

          {/* Card 3: Digital Challan Management */}
          <div className="bg-white p-8 border-2 border-primary shadow-brutal flex flex-col justify-between hover:border-black transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary text-white border border-primary">
                <Receipt className="w-6 h-6 text-accent" />
              </div>
              <span className="font-mono text-xs font-bold bg-surface px-2 py-0.5 border border-primary">
                INSTANT PDF + QR
              </span>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-primary mb-2">
                DIGITAL CHALLAN ISSUANCE
              </h3>
              <p className="font-sans text-sm text-secondary leading-relaxed">
                Pre-fills vehicle and owner details instantly. Automatically attaches Motor Vehicles Act violation sections, fine amounts, and generates scannable payment QR code receipts.
              </p>
            </div>
            <div className="mt-6 p-3 bg-accent text-primary border border-primary font-mono text-xs font-bold flex justify-between items-center">
              <span>PDF RECEIPT READY</span>
              <span className="text-[10px] bg-primary text-white px-1.5 py-0.5">PRINT / DISPATCH</span>
            </div>
          </div>

          {/* Card 4: Violation Timeline History */}
          <div className="bg-surface p-8 border-2 border-primary shadow-brutal flex flex-col justify-between hover:border-black transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-secondary text-white border border-primary">
                <History className="w-6 h-6 text-sage" />
              </div>
              <span className="font-mono text-xs font-bold text-danger bg-red-100 px-2 py-0.5 border border-danger">
                REPEAT OFFENDERS
              </span>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-primary mb-2">
                AUDIT LOGS & HISTORY
              </h3>
              <p className="font-sans text-sm text-secondary leading-relaxed">
                Track full historical violation records per vehicle to detect chronic non-compliance and enforce enhanced penalties for repeat offenders.
              </p>
            </div>
            <div className="mt-6 text-xs font-sans text-secondary border-t border-sage/50 pt-3">
              Comprehensive timeline with date, officer badge, fine status, and location.
            </div>
          </div>

          {/* Card 5: Offline-First Mode & Sync */}
          <div className="bg-primary text-white p-8 border-2 border-primary shadow-brutal flex flex-col justify-between hover:border-black transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-accent text-primary border border-primary">
                <WifiOff className="w-6 h-6" />
              </div>
              <span className="font-mono text-xs font-bold text-primary bg-accent px-2 py-0.5">
                INDEXEDDB
              </span>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-white mb-2">
                OFFLINE ROAD RESILIENCE
              </h3>
              <p className="font-sans text-sm text-sage leading-relaxed">
                Operate in remote highway patches with zero cellular connection. Cached vehicle datasets allow local lookups with automatic server synchronization upon reconnecting.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-mono text-accent">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping"></span>
              <span>AUTO-RECONCILE UPON RECONNECT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
