import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Menu, X } from 'lucide-react';
import Button from '../common/Button';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-sage/40">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-primary flex items-center justify-center border border-primary shadow-brutal-sm group-hover:bg-black transition-colors">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div className="flex items-center">
            <span className="font-heading text-2xl tracking-wider text-primary">
              ROADGUARD
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-accent ml-1 -mt-3 ring-2 ring-primary"></span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 font-sans text-sm font-bold uppercase tracking-wider text-secondary">
          <a href="#features" className="hover:text-black hover:underline underline-offset-8 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-black hover:underline underline-offset-8 transition-colors">
            How It Works
          </a>
          <a href="#technology" className="hover:text-black hover:underline underline-offset-8 transition-colors">
            Technology
          </a>
          <a href="#specs" className="hover:text-black hover:underline underline-offset-8 transition-colors">
            Specs
          </a>
        </nav>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login">
            <Button variant="accent" size="md">
              Portal Login <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-primary border border-primary"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-primary p-6 flex flex-col gap-4 shadow-brutal">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold uppercase tracking-wider py-2"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold uppercase tracking-wider py-2"
          >
            How It Works
          </a>
          <a
            href="#technology"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold uppercase tracking-wider py-2"
          >
            Technology
          </a>
          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="accent" size="md" className="w-full">
              Portal Login <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}

