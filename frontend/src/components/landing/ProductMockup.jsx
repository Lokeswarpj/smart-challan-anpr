import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, XCircle, Search, Camera } from 'lucide-react';

export default function ProductMockup() {
  return (
    <div className="relative mx-auto max-w-5xl rounded-none border-2 border-primary bg-white shadow-brutal overflow-hidden">
      {/* Browser Chrome Header */}
      <div className="h-10 bg-primary px-4 flex items-center justify-between border-b border-primary">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-danger"></div>
          <div className="w-3 h-3 rounded-full bg-accent"></div>
          <div className="w-3 h-3 rounded-full bg-success"></div>
        </div>
        <div className="bg-secondary px-6 py-1 text-[11px] font-mono text-sage tracking-wider border border-gray-700">
          roadguard.enforcement.gov.in/verify
        </div>
        <div className="text-[10px] font-mono text-accent">LIVE DEMO</div>
      </div>

      {/* Internal Dashboard Mock Layout */}
      <div className="p-6 md:p-8 bg-surface bg-grid-pattern">
        {/* Mock Top Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white border border-primary shadow-brutal-sm mb-6">
          <div className="flex-1 flex items-center gap-3 w-full">
            <Search className="w-5 h-5 text-secondary" />
            <span className="font-mono text-lg font-black text-primary tracking-widest">
              KA05NB3321
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="bg-accent text-primary px-3 py-1 text-xs font-bold font-sans border border-primary uppercase">
              ANPR Confidence: 96.4%
            </span>
            <div className="bg-primary text-white p-2 border border-primary">
              <Camera className="w-4 h-4 text-accent" />
            </div>
          </div>
        </div>

        {/* Mock Vehicle Details & 4 Document Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* RC Card */}
          <div className="bg-white border-2 border-success p-4 shadow-brutal-sm relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase text-secondary">RC Status</span>
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <div className="text-xl font-heading text-success">VALID</div>
            <div className="text-[10px] font-mono text-gray-500 mt-1">Exp: 2038-06-11</div>
          </div>

          {/* Insurance Card */}
          <div className="bg-white border-2 border-success p-4 shadow-brutal-sm relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase text-secondary">Insurance</span>
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <div className="text-xl font-heading text-success">ACTIVE</div>
            <div className="text-[10px] font-mono text-gray-500 mt-1">Digit General Ins.</div>
          </div>

          {/* PUC Card - Expired Alert */}
          <div className="bg-red-50 border-2 border-danger p-4 shadow-brutal-sm relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase text-danger font-black">PUC Status</span>
              <XCircle className="w-4 h-4 text-danger" />
            </div>
            <div className="text-xl font-heading text-danger">EXPIRED</div>
            <div className="text-[10px] font-mono text-danger font-bold mt-1">Expired 84 days ago</div>
          </div>

          {/* Road Tax Card */}
          <div className="bg-white border-2 border-success p-4 shadow-brutal-sm relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase text-secondary">Road Tax</span>
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <div className="text-xl font-heading text-success">PAID (LTT)</div>
            <div className="text-[10px] font-mono text-gray-500 mt-1">One-time Life Tax</div>
          </div>
        </div>

        {/* Mock Vehicle Meta Footer */}
        <div className="mt-4 p-3 bg-white border border-primary flex flex-wrap items-center justify-between text-xs font-sans text-secondary gap-2">
          <span><strong>Owner:</strong> Kiran Gowda</span>
          <span><strong>Vehicle:</strong> Royal Enfield Classic 350 (Petrol)</span>
          <span><strong>RTO:</strong> KA-05 Jayanagar, Bengaluru</span>
          <span className="bg-danger text-white px-2 py-0.5 text-[10px] font-bold font-mono">
            1 UNPAID CHALLAN
          </span>
        </div>
      </div>
    </div>
  );
}
