import React from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary text-white border-t-2 border-primary pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-gray-800">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="font-heading text-2xl tracking-wider text-white">
                ROADGUARD
              </span>
              <span className="w-2 h-2 rounded-full bg-accent"></span>
            </div>
            <p className="font-sans text-sm text-sage max-w-md leading-relaxed">
              An intelligent vehicle document verification and traffic enforcement platform powered by Automatic Number Plate Recognition (ANPR). Built for real-world roadside operations with sub-second lookups.
            </p>
            <div className="pt-2 text-xs font-mono text-accent">
              STATUS: SYSTEM OPERATIONAL (v1.0.0-PROD)
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-heading text-sm tracking-wider text-accent mb-4">
              PLATFORM
            </h4>
            <ul className="space-y-2 text-sm text-sage font-sans">
              <li><Link to="/login" className="hover:text-white transition-colors">Officer Portal</Link></li>
              <li><a href="#features" className="hover:text-white transition-colors">Bento Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Computer Vision Pipeline</a></li>
              <li><a href="#technology" className="hover:text-white transition-colors">Architecture Stack</a></li>
            </ul>
          </div>

          {/* Legal / Institutional */}
          <div>
            <h4 className="font-heading text-sm tracking-wider text-accent mb-4">
              PROJECT SPECIFICATION
            </h4>
            <p className="text-xs text-sage leading-relaxed">
              B.Tech AIML Mini Project — Semester V.<br />
              Compliant with Motor Vehicles Act 1988 statutory fine schedules and Indian HSRP plate standards.
            </p>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-sage gap-4">
          <p>© 2026 ROADGUARD Systems. All rights reserved.</p>
          <p className="font-mono text-accent">VERIFY SMARTER. ENFORCE FASTER.</p>
        </div>
      </div>
    </footer>
  );
}
