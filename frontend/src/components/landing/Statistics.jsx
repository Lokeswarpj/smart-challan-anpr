import React from 'react';
import { Camera, FileCheck2, Zap, Receipt } from 'lucide-react';

export default function Statistics() {
  const stats = [
    {
      metric: "YOLOv8",
      label: "AI-POWERED ANPR",
      desc: "Deep learning plate localization with EasyOCR sequence extraction and regex validation.",
      icon: Camera
    },
    {
      metric: "4-IN-1",
      label: "DOCUMENT CATEGORIES",
      desc: "Instant aggregated check for RC, Vehicle Insurance, PUC Emission, and Road Tax status.",
      icon: FileCheck2
    },
    {
      metric: "< 2.0s",
      label: "VERIFICATION WORKFLOW",
      desc: "Sub-second database lookup and real-time roadside verification for traffic police officers.",
      icon: Zap
    },
    {
      metric: "100%",
      label: "DIGITAL CHALLAN MGMT",
      desc: "Instant PDF receipt generation with dynamic payment QR codes, SMS, and email dispatch.",
      icon: Receipt
    }
  ];

  return (
    <section className="border-y-2 border-primary bg-primary text-white py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-6 border border-gray-700 bg-secondary/80 flex flex-col justify-between hover:border-accent transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-heading text-4xl text-accent">{s.metric}</span>
                    <Icon className="w-5 h-5 text-sage" />
                  </div>
                  <h3 className="font-heading text-lg tracking-wider text-white mb-2">
                    {s.label}
                  </h3>
                </div>
                <p className="font-sans text-xs text-sage leading-relaxed mt-4">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

