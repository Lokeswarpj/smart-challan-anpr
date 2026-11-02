import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';
import ProductMockup from './ProductMockup';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-white bg-grid-pattern overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary bg-accent/30 text-primary text-xs font-bold font-sans uppercase tracking-widest mb-8 shadow-brutal-sm">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>AI-POWERED VEHICLE VERIFICATION</span>
        </div>

        {/* Display Headline */}
        <h1 className="font-heading text-5xl sm:text-7xl lg:text-8xl tracking-tight text-primary leading-tight-display max-w-5xl mx-auto mb-6">
          VERIFY SMARTER.<br />
          ENFORCE <span className="highlight-yellow">FASTER.</span>
        </h1>

        {/* Subtitle */}
        <p className="font-sans text-base sm:text-xl text-secondary max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          An intelligent vehicle document verification platform powered by Automatic Number Plate Recognition. Identify vehicles, verify documents, and manage traffic violations in seconds.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="accent" size="lg" className="w-full sm:w-auto shadow-brutal hover:shadow-brutal-hover">
              ACCESS DASHBOARD <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
          <a href="#features" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white">
              EXPLORE FEATURES
            </Button>
          </a>
        </div>

        {/* Dashboard Preview Mockup Frame */}
        <div className="relative pt-4">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-primary font-bold text-xs font-mono uppercase px-4 py-1 border border-primary z-10 shadow-brutal-sm">
            INTERACTIVE SYSTEM INTERFACE PREVIEW
          </div>
          <ProductMockup />
        </div>
      </div>
    </section>
  );
}

