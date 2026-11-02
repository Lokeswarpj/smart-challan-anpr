import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "CAPTURE",
      desc: "Traffic officer points their smartphone or tablet camera at the vehicle license plate, or enters the alphanumeric registration manually.",
      detail: "Supports standard Indian high-security registration plates (HSRP) and new Bharat (BH) series."
    },
    {
      num: "02",
      title: "ANALYZE",
      desc: "Ultralytics YOLOv8 isolates the license plate region. OpenCV deskews perspective distortion, followed by EasyOCR extraction and heuristic error correction.",
      detail: "Fuzzy matching automatically corrects optical misreads such as 'O' vs '0' and 'I' vs '1'."
    },
    {
      num: "03",
      title: "VERIFY",
      desc: "FastAPI aggregates RC, insurance, emission (PUC), and road tax records into a unified JSON profile rendered with color status badges within 2 seconds.",
      detail: "If any document is expired, the officer can issue a digital challan with one tap."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-surface bg-grid-pattern border-b-2 border-primary">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-block bg-accent px-3 py-1 font-mono text-xs font-bold uppercase mb-4 border border-primary">
            SYSTEM ARCHITECTURE FLOW
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl text-primary tracking-tight">
            HOW <span className="highlight-yellow">ROADGUARD</span> WORKS
          </h2>
          <p className="font-sans text-secondary text-base mt-4">
            A three-stage pipeline bridging real-time computer vision with structured backend compliance records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-primary p-8 shadow-brutal flex flex-col justify-between hover:translate-y-[-2px] transition-all"
            >
              <div>
                <span className="font-heading text-6xl lg:text-7xl text-accent block leading-none mb-4 font-black">
                  {s.num}
                </span>
                <h3 className="font-heading text-2xl text-primary tracking-wider mb-4">
                  {s.title}
                </h3>
                <p className="font-sans text-sm text-secondary leading-relaxed mb-6 font-normal">
                  {s.desc}
                </p>
              </div>
              <div className="p-3 bg-surface border border-sage/60 font-mono text-xs text-secondary font-medium">
                {s.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
