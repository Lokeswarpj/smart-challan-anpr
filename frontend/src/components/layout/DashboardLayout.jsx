import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Sun, Moon, Globe, Volume2, Wifi, WifiOff, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { currentLanguage, changeLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { officer } = useAuth();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-surface text-primary dark:text-white flex flex-col lg:flex-row font-sans selection:bg-accent selection:text-primary">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Navigation Bar */}
        <header className="h-20 bg-white/95 dark:bg-surface/95 backdrop-blur-md border-b-2 border-primary sticky top-0 z-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-primary dark:text-white border border-primary dark:border-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Online / Offline Connectivity Pill */}
            <div className="hidden sm:flex items-center gap-2 border border-primary px-3 py-1 bg-surface dark:bg-surface-dark text-xs font-mono font-bold">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                  <span className="text-secondary dark:text-gray-300">SERVER ONLINE</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-warning"></span>
                  <span className="text-warning">CACHED OFFLINE MODE</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Language Selector */}
            <div className="flex items-center border border-primary dark:border-[#2D3931] bg-white dark:bg-[#101512] p-0.5 shadow-brutal-sm">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 text-[11px] font-bold font-sans transition-colors ${
                  currentLanguage === 'en'
                    ? 'bg-accent text-primary'
                    : 'text-secondary dark:text-sage hover:text-black dark:hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('hi')}
                className={`px-2 py-1 text-[11px] font-bold font-sans transition-colors ${
                  currentLanguage === 'hi'
                    ? 'bg-accent text-primary'
                    : 'text-secondary dark:text-sage hover:text-black dark:hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => changeLanguage('kn')}
                className={`px-2 py-1 text-[11px] font-bold font-sans transition-colors ${
                  currentLanguage === 'kn'
                    ? 'bg-accent text-primary'
                    : 'text-secondary dark:text-sage hover:text-black dark:hover:text-white'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>

            {/* Single Unified Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme mode"
              className="p-2 border border-primary dark:border-[#2D3931] bg-white dark:bg-[#101512] hover:bg-surface dark:hover:bg-[#1F2822] shadow-brutal-sm transition-all flex items-center justify-center group"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-accent transition-transform duration-200 group-hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-primary transition-transform duration-200 group-hover:-rotate-12" />
              )}
            </button>

            {/* Officer Badge Pill */}
            <div className="hidden md:flex items-center gap-2 border border-primary px-3 py-1.5 bg-accent text-primary font-bold text-xs shadow-brutal-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>{officer?.badge_number || 'KA-POL-1001'}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className="flex-1 p-6 md:p-8 bg-surface dark:bg-surface-dark bg-grid-pattern overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

