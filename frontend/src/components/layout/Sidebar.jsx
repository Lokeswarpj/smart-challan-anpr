import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Camera,
  FileText,
  Settings,
  Shield,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

export default function Sidebar({ isOpen, onClose }) {
  const { officer, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Challan History', path: '/dashboard', icon: LayoutDashboard },
    { name: 'ANPR Scanner', path: '/anpr-scanner', icon: Camera },
    { name: 'Vehicle Verification', path: '/vehicle-verification', icon: Search },
    { name: 'Issue New Challan', path: '/challans/new', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-[#121814] border-r-2 border-primary dark:border-[#2D3931] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top Header */}
        <div>
          <div className="h-20 px-6 border-b-2 border-primary dark:border-[#2D3931] flex items-center justify-between bg-white dark:bg-[#121814]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary flex items-center justify-center border border-primary dark:border-[#2D3931] shadow-brutal-sm">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div className="flex items-center">
                <span className="font-heading text-xl tracking-wider text-primary dark:text-white">
                  ROADGUARD
                </span>
                <span className="w-2 h-2 rounded-full bg-accent ml-1 -mt-2"></span>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase bg-accent text-primary px-1.5 py-0.5 border border-primary font-bold">
              SMART ANPR
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-wider font-sans border transition-all duration-150',
                      isActive
                        ? 'bg-accent text-primary border-primary shadow-brutal-sm font-black translate-x-1'
                        : 'text-secondary dark:text-gray-300 border-transparent hover:border-primary dark:hover:border-[#2D3931] hover:bg-surface dark:hover:bg-[#1C241F]'
                    )
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Logout */}
        <div className="p-4 border-t-2 border-primary dark:border-[#2D3931] bg-surface dark:bg-[#101512] space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-primary text-accent flex items-center justify-center font-heading text-lg border border-primary dark:border-[#2D3931]">
              {officer?.name ? officer.name.charAt(0) : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold uppercase font-sans text-primary dark:text-white truncate">
                {officer?.name || 'Authorized User'}
              </p>
              <p className="text-[10px] font-mono text-secondary dark:text-gray-400 truncate">
                STATUS: ACTIVE SESSION
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase font-sans border border-primary dark:border-[#2D3931] bg-white dark:bg-[#1C241F] hover:bg-danger dark:hover:bg-danger hover:text-white transition-colors text-primary dark:text-white shadow-brutal-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
