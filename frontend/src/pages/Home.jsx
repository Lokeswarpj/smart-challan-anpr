import React from 'react';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/landing/Hero';
import Statistics from '../components/landing/Statistics';
import ProblemSolution from '../components/landing/ProblemSolution';
import FeatureGrid from '../components/landing/FeatureGrid';
import HowItWorks from '../components/landing/HowItWorks';
import TechnologyStack from '../components/landing/TechnologyStack';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/layout/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-primary flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Statistics />
        <ProblemSolution />
        <FeatureGrid />
        <HowItWorks />
        <TechnologyStack />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
