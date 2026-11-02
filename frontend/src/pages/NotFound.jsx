import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-primary flex flex-col items-center justify-center p-6 text-center font-sans bg-grid-pattern">
      <div className="p-4 bg-primary text-accent border border-primary mb-6 shadow-brutal">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="font-heading text-6xl sm:text-7xl text-primary mb-2">
        404 — PAGE NOT FOUND
      </h1>
      <p className="font-sans text-secondary text-sm max-w-md mb-8">
        The enforcement route or resource you are attempting to inspect does not exist in the ROADGUARD portal registry.
      </p>
      <Link to="/dashboard">
        <Button variant="accent" size="lg" icon={ArrowLeft}>
          RETURN TO DASHBOARD
        </Button>
      </Link>
    </div>
  );
}
