import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function Login() {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedQuickFill, setSelectedQuickFill] = useState('KA-POL-2026');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const demoAccounts = [
    {
      id: 'KA-POL-2026',
      badge: 'KA-POL-2026',
      password: 'traffic123',
      badgeTitle: 'KA-POL-2026',
      name: 'Inspector Lokeshwar P J',
      role: 'Lead Enforcement Officer'
    },
    {
      id: 'KA-POL-1001',
      badge: 'KA-POL-1001',
      password: 'officer123',
      badgeTitle: 'KA-POL-1001',
      name: 'Sub-Inspector Ramesh Kumar',
      role: 'Indiranagar Checkpoint Staff'
    },
    {
      id: 'KA-POL-ADMIN',
      badge: 'KA-POL-ADMIN',
      password: 'admin123',
      badgeTitle: 'KA-POL-ADMIN',
      name: 'Assistant Commissioner Anand Patil',
      role: 'Central HQ Admin'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!badgeNumber.trim()) {
      setError('Please enter your Username / Operator ID.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      await login(badgeNumber.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const autofillDemo = (account) => {
    setBadgeNumber(account.badge);
    setPassword(account.password);
    setSelectedQuickFill(account.id);
    setError('');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white font-sans selection:bg-accent selection:text-primary">
      {/* Left Charcoal Brand Hero */}
      <div className="bg-primary text-white p-8 lg:p-16 flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-r-2 border-primary relative overflow-hidden">
        {/* Top Brand Link */}
        <Link to="/" className="flex items-center gap-2.5 z-10">
          <div className="w-10 h-10 bg-accent flex items-center justify-center border border-primary">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center">
            <span className="font-heading text-2xl tracking-wider text-white">
              ROADGUARD
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-accent ml-1 -mt-3"></span>
          </div>
        </Link>

        {/* Center Display Messaging */}
        <div className="my-16 lg:my-0 z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary border border-gray-700 text-accent text-xs font-mono font-bold uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SMART ANPR & E-CHALLAN SYSTEM</span>
          </div>

          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-tight-display mb-6">
            VERIFY SMARTER.<br />
            ENFORCE <span className="highlight-yellow-full">FASTER.</span>
          </h1>

          <p className="font-sans text-sage text-base leading-relaxed">
            Automated platform for license plate recognition, instant RTO document cross-verification, and spot digital challan generation.
          </p>
        </div>

        {/* Bottom Badge */}
        <div className="z-10 text-xs font-mono text-sage/70 flex items-center justify-between border-t border-gray-800 pt-6">
          <span>PORTAL SECURED VIA HS256 JWT</span>
          <span>MV ACT 1988 COMPLIANT</span>
        </div>

        {/* Ambient subtle background grid */}
        <div className="absolute inset-0 bg-grid-pattern-dense opacity-10 pointer-events-none"></div>
      </div>

      {/* Right Login Form Container */}
      <div className="p-8 lg:p-16 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="mb-8">
          <h2 className="font-heading text-3xl sm:text-4xl text-primary tracking-wide mb-2">
            OPERATOR SIGN IN
          </h2>
          <p className="font-sans text-secondary text-sm">
            Enter your login identifier and access password.
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-danger text-danger text-xs font-bold font-sans flex items-start gap-2 shadow-brutal-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          {/* Hidden dummy fields to prevent Chrome/Edge from auto-populating saved email credentials */}
          <input type="text" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
          <input type="password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

          <Input
            label="Username / Operator ID"
            placeholder="e.g. KA-POL-2026"
            value={badgeNumber}
            onChange={(e) => setBadgeNumber(e.target.value)}
            icon={User}
            autoComplete="off"
            name="officer_badge_number_field"
            id="officer_badge_number_field"
            autoFocus
          />

          <div className="relative">
            <Input
              label="Secure Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              autoComplete="new-password"
              name="officer_security_pin_field"
              id="officer_security_pin_field"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-secondary hover:text-primary p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs font-sans">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-secondary">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-primary rounded-none border-primary"
              />
              <span>Remember shift session</span>
            </label>
            <span className="text-secondary/70 hover:underline cursor-pointer">Forgot password?</span>
          </div>

          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full shadow-brutal hover:shadow-brutal-hover"
            loading={loading}
          >
            AUTHORIZE & ENTER PORTAL <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        {/* Quick Demo Pre-fill helper buttons for reviewer ease */}
        <div className="mt-10 pt-6 border-t-2 border-primary/20">
          <div className="text-[11px] font-mono text-secondary font-bold uppercase mb-3 text-center">
            DEMONSTRATION QUICK-FILLS:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-sans">
            {demoAccounts.map((acc) => {
              const isSelected = selectedQuickFill === acc.id || badgeNumber === acc.badge;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => autofillDemo(acc)}
                  className={`p-2.5 text-left transition-all duration-150 font-mono rounded-none ${
                    isSelected
                      ? 'border-2 border-primary bg-accent shadow-brutal-sm scale-[1.02] ring-1 ring-primary'
                      : 'border border-primary/40 bg-surface hover:bg-accent/40 opacity-85 hover:opacity-100 shadow-sm'
                  }`}
                >
                  <div className="font-heading font-black text-[13px] text-primary tracking-wide">
                    {acc.badgeTitle}
                  </div>
                  <div className="text-[11px] font-bold text-primary truncate mt-0.5">
                    {acc.name}
                  </div>
                  <div className="text-[10px] text-primary/70 font-semibold truncate">
                    {acc.role}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

