'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Landmark, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
    setMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  };

  const isActive = (path: string) => pathname === path;

  const renderNavLinks = () => {
    if (!isAuthenticated) {
      return (
        <>
          <Link 
            href="/" 
            className={`px-3 py-2 text-sm font-semibold transition-all ${isActive('/') ? 'text-gov-primary border-b-2 border-gov-primary' : 'text-gov-text-muted hover:text-gov-primary'}`}
          >
            {t('nav.home')}
          </Link>
          <Link 
            href="/citizen/login" 
            className="px-3 py-2 text-sm font-semibold text-gov-text-muted hover:text-gov-primary"
          >
            {t('nav.submit')}
          </Link>
          <Link 
            href="/citizen/appointments" 
            className={`px-3 py-2 text-sm font-semibold transition-all ${isActive('/citizen/appointments') ? 'text-gov-primary border-b-2 border-gov-primary' : 'text-gov-text-muted hover:text-gov-primary'}`}
          >
            {language === 'en' ? 'Book Appointment' : 'சந்திப்பு முன்பதிவு'}
          </Link>
          <Link 
            href="/citizen/track" 
            className={`px-3 py-2 text-sm font-semibold transition-all ${isActive('/citizen/track') ? 'text-gov-primary border-b-2 border-gov-primary' : 'text-gov-text-muted hover:text-gov-primary'}`}
          >
            {t('nav.track')}
          </Link>
          <Link 
            href="/citizen/help" 
            className={`px-3 py-2 text-sm font-semibold transition-all ${isActive('/citizen/help') ? 'text-gov-primary border-b-2 border-gov-primary' : 'text-gov-text-muted hover:text-gov-primary'}`}
          >
            {t('nav.help')}
          </Link>
        </>
      );
    }

    if (user?.role === 'CITIZEN') {
      return (
        <>
          <Link 
            href="/citizen/dashboard" 
            className={`px-3 py-2 text-sm font-semibold transition-all ${isActive('/citizen/dashboard') ? 'text-gov-primary border-b-2 border-gov-primary' : 'text-gov-text-muted hover:text-gov-primary'}`}
          >
            {t('nav.dashboard')}
          </Link>
          <Link 
            href="/citizen/submit" 
            className={`px-3 py-2 text-sm font-semibold transition-all ${isActive('/citizen/submit') ? 'text-gov-primary border-b-2 border-gov-primary' : 'text-gov-text-muted hover:text-gov-primary'}`}
          >
            {t('nav.new_petition')}
          </Link>
          <Link 
            href="/citizen/appointments" 
            className={`px-3 py-2 text-sm font-semibold transition-all ${isActive('/citizen/appointments') ? 'text-gov-primary border-b-2 border-gov-primary' : 'text-gov-text-muted hover:text-gov-primary'}`}
          >
            {language === 'en' ? 'Book Appointment' : 'சந்திப்பு முன்பதிவு'}
          </Link>
          <Link 
            href="/citizen/track" 
            className={`px-3 py-2 text-sm font-semibold transition-all ${isActive('/citizen/track') ? 'text-gov-primary border-b-2 border-gov-primary' : 'text-gov-text-muted hover:text-gov-primary'}`}
          >
            {t('nav.track_petition')}
          </Link>
          <Link 
            href="/citizen/help" 
            className={`px-3 py-2 text-sm font-semibold transition-all ${isActive('/citizen/help') ? 'text-gov-primary border-b-2 border-gov-primary' : 'text-gov-text-muted hover:text-gov-primary'}`}
          >
            {t('nav.help_center')}
          </Link>
        </>
      );
    }

    if (user?.role === 'STAFF') {
      return (
        <>
          <Link 
            href="/staff/dashboard" 
            className={`px-3 py-2 text-sm font-semibold transition-all ${isActive('/staff/dashboard') ? 'text-gov-primary border-b-2 border-gov-primary' : 'text-gov-text-muted hover:text-gov-primary'}`}
          >
            {t('nav.dashboard')}
          </Link>
        </>
      );
    }

    if (user?.role === 'MLA') {
      return (
        <>
          <Link 
            href="/mla/dashboard" 
            className={`px-3 py-2 text-sm font-semibold transition-all ${isActive('/mla/dashboard') ? 'text-gov-primary border-b-2 border-gov-primary' : 'text-gov-text-muted hover:text-gov-primary'}`}
          >
            {t('nav.dashboard')}
          </Link>
          <Link 
            href="/mla/announcements" 
            className={`px-3 py-2 text-sm font-semibold transition-all ${isActive('/mla/announcements') ? 'text-gov-primary border-b-2 border-gov-primary' : 'text-gov-text-muted hover:text-gov-primary'}`}
          >
            {t('nav.manage_announcements')}
          </Link>
        </>
      );
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="bg-gov-primary text-white p-2 rounded-lg shadow-md">
                <Landmark className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-slate-900 text-base sm:text-lg block leading-none">
                  {t('nav.title')}
                </span>
                <span className="text-[10px] sm:text-[11px] text-gov-primary font-bold block tracking-wider uppercase mt-0.5">
                  {t('nav.subtitle')}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-4">
              {renderNavLinks()}
            </div>
            
            {/* Language Switcher & User Status */}
            <div className="border-l border-slate-200 pl-6 flex items-center gap-4">
              {/* Sleek Language Switch Toggle */}
              <button
                onClick={toggleLanguage}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                🌐 {language === 'en' ? 'தமிழ்' : 'English'}
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="text-right leading-none">
                    <span className="text-xs font-bold text-slate-800 block">
                      {user?.name}
                    </span>
                    <span className="text-[8px] text-gov-primary font-bold uppercase tracking-wider block bg-blue-50 px-1 py-0.2 rounded border border-blue-100 mt-1">
                      {user?.role}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-200 cursor-pointer animate-fade-in"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link 
                    href="/citizen/login" 
                    className="bg-gov-primary hover:bg-gov-primary-dark text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md transition-all border border-transparent flex items-center gap-1"
                  >
                    <UserIcon className="w-3.5 h-3.5" /> {t('nav.login')}
                  </Link>
                  <Link 
                    href="/staff/login" 
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-all border border-slate-200"
                  >
                    {t('nav.staff')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Mobile Language Button */}
            <button
              onClick={toggleLanguage}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shadow-sm"
            >
              🌐 {language === 'en' ? 'தமிழ்' : 'En'}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-inner text-left animate-slide-down">
          <div className="flex flex-col gap-1 py-2">
            {renderNavLinks()}
          </div>
          
          <div className="pt-4 pb-2 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="px-3">
                  <span className="text-sm font-bold text-slate-800 block">
                    {user?.name}
                  </span>
                  <span className="text-[10px] text-gov-primary font-bold uppercase tracking-wider block bg-blue-50/70 border border-blue-100 w-max px-1.5 py-0.5 rounded mt-1">
                    {user?.role}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-lg text-sm font-bold transition-all border border-red-100 cursor-pointer"
                >
                  Logout from Session
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link 
                  href="/citizen/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-gov-primary hover:bg-gov-primary-dark text-white py-2.5 rounded-lg text-xs font-bold text-center shadow-md flex items-center justify-center gap-1"
                >
                  <UserIcon className="w-3.5 h-3.5" /> {t('nav.login')}
                </Link>
                <Link 
                  href="/staff/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-xs font-semibold text-center border border-slate-200 flex items-center justify-center"
                >
                  {t('nav.staff')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
