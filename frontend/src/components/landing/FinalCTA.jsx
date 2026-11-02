import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';

export default function FinalCTA() {
  return (
    <section className="py-24 bg-accent border-b-2 border-primary text-primary relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-accent text-xs font-mono font-bold uppercase mb-8 shadow-brutal-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>ROADSIDE ENFORCEMENT READY</span>
        </div>

        <h2 className="font-heading text-5xl sm:text-7xl lg:text-8xl tracking-tight text-primary leading-tight-display mb-6">
          MAKE EVERY CHECK COUNT.
        </h2>

        <p className="font-sans text-base sm:text-xl text-primary/80 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
          Bring intelligent vehicle verification and digital traffic enforcement into one streamlined platform. Test with sample vehicles or your live camera now.
        </p>

        <Link to="/login">
          <Button variant="primary" size="lg" className="shadow-brutal hover:shadow-brutal-hover text-base">
            ENTER OFFICER DASHBOARD <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
