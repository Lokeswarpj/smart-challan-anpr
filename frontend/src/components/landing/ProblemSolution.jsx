import React from 'react';
import { X, Check, ArrowRight } from 'lucide-react';

export default function ProblemSolution() {
  const oldWay = [
    "Manual physical paper inspections prone to forged or expired documents",
    "Slow roadside stops creating congestion and traffic bottlenecks",
    "No immediate verification against central RTO databases",
    "Paper receipt challan books easily misplaced or disputed",
    "Delayed notification to vehicle owners with no direct payment links"
  ];

  const roadguardWay = [
    "Instant automated license plate scanning using camera-driven YOLOv8 ANPR",
    "Sub-second verification of RC, Insurance, PUC, and Road Tax simultaneously",
    "Color-coded visual indicators (Green / Amber / Red) with hands-free audio announcements",
    "Automated PDF digital challan with embedded payment QR codes",
    "Real-time SMS and email receipt dispatch directly to registered owners"
  ];

  return (
    <section className="py-24 bg-surface bg-grid-pattern border-b-2 border-primary">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading text-4xl sm:text-5xl text-primary tracking-tight mb-4">
            TRANSFORMING <span className="highlight-yellow">ROADSIDE ENFORCEMENT</span>
          </h2>
          <p className="font-sans text-secondary text-base">
            Replacing slow, bypassable manual paper checks with high-speed computer vision and digital verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* The Old Way */}
          <div className="bg-white border-2 border-gray-300 p-8 shadow-brutal-sm relative">
            <div className="inline-block bg-danger/10 text-danger border border-danger px-3 py-1 font-heading text-sm tracking-wider uppercase mb-6">
              THE OLD WAY
            </div>
            <h3 className="font-heading text-2xl text-primary mb-6">
              MANUAL & PAPER-DRIVEN
            </h3>
            <ul className="space-y-4 font-sans text-sm text-secondary">
              {oldWay.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-red-100 text-danger mt-0.5">
                    <X className="w-4 h-4" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* The Roadguard Way */}
          <div className="bg-primary text-white border-2 border-primary p-8 shadow-brutal relative">
            <div className="inline-block bg-accent text-primary px-3 py-1 font-heading text-sm tracking-wider uppercase mb-6 font-black">
              THE ROADGUARD WAY
            </div>
            <h3 className="font-heading text-2xl text-accent mb-6">
              AI-POWERED & INSTANTANEOUS
            </h3>
            <ul className="space-y-4 font-sans text-sm text-gray-200">
              {roadguardWay.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-accent text-primary mt-0.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
