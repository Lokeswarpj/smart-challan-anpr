import React from 'react';

export default function TechnologyStack() {
  const techs = [
    { name: "React.js + Vite", role: "Frontend UI & Client Architecture", badge: "SPA" },
    { name: "Tailwind CSS", role: "Brutalist-Lite Design System", badge: "CSS3" },
    { name: "FastAPI & Uvicorn", role: "High-Performance Async Backend", badge: "Python" },
    { name: "Ultralytics YOLOv8", role: "Real-Time License Plate Localization", badge: "PyTorch" },
    { name: "OpenCV", role: "Perspective Deskewing & Adaptive Thresholding", badge: "Vision" },
    { name: "EasyOCR Engine", role: "Deep Learning Character Sequence Recognition", badge: "OCR" },
    { name: "PostgreSQL & SQLite", role: "Relational Storage with Dynamic Fallback", badge: "SQLAlchemy" },
    { name: "ReportLab & QRCode", role: "Automated PDF Receipt & Dynamic Payment QR", badge: "Engine" },
  ];

  return (
    <section id="technology" className="py-24 bg-white border-b-2 border-primary">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block bg-accent px-3 py-1 font-mono text-xs font-bold uppercase mb-4 border border-primary">
            PRODUCTION-GRADE TECH STACK
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl text-primary tracking-tight">
            POWERED BY <span className="highlight-yellow">MODERN AI & WEB TECH</span>
          </h2>
          <p className="font-sans text-secondary text-base mt-4">
            Zero proprietary lock-in. Built entirely with verified open-source computer vision models and async web frameworks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {techs.map((t, idx) => (
            <div
              key={idx}
              className="p-6 border-2 border-primary bg-surface shadow-brutal-sm hover:shadow-brutal hover:bg-white transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading text-lg text-primary">{t.name}</span>
                  <span className="font-mono text-[10px] bg-primary text-accent px-1.5 py-0.5 border border-primary font-bold">
                    {t.badge}
                  </span>
                </div>
                <p className="font-sans text-xs text-secondary leading-relaxed font-medium">
                  {t.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

