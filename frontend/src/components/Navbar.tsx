import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Navigation,
  PlusCircle,
  LogIn,
  Settings,
  Mic,
  Menu,
  X,
  Compass,
  Radio,
  Sparkles
} from 'lucide-react';
import { Button } from './ui/Button';

interface NavbarProps {
  onOpenVoiceAssistant?: () => void;
  onLaunchDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenVoiceAssistant,
  onLaunchDemo
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: Compass },
    { label: 'New Trip', path: '/trips/new', icon: PlusCircle },
    { label: 'Join Trip', path: '/join', icon: Radio },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Navigation className="w-5 h-5 text-cyan-400 -rotate-45" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">SyncRoute</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wide">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Journey Synchronization</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Demo Launch Quick Shortcut */}
          {onLaunchDemo && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLaunchDemo}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
              className="hidden sm:inline-flex border-purple-500/30 hover:border-purple-500/50 text-purple-300"
            >
              Bengaluru Demo
            </Button>
          )}

          {/* Voice Assistant Trigger */}
          {onOpenVoiceAssistant && (
            <button
              onClick={onOpenVoiceAssistant}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 hover:border-cyan-400/50 transition cursor-pointer text-xs font-semibold shadow-sm"
              title="Open AI Voice Assistant"
              aria-label="AI Voice Assistant"
            >
              <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">AI Voice</span>
            </button>
          )}

          {/* Sign In / Profile */}
          <Link to="/auth">
            <Button variant="secondary" size="sm" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
              Sign In
            </Button>
          </Link>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 p-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {onLaunchDemo && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLaunchDemo();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-purple-950/50 border border-purple-500/30 text-purple-300 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              Launch Bengaluru Demo
            </button>
          )}
        </div>
      )}
    </header>
  );
};
