'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, ArrowLeft, Phone, Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export default function StaffLogin() {
  const { loginStaff } = useAuth();
  const { language, t } = useLanguage();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if first-time setup is required
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        if (data.setupRequired) {
          router.push('/setup');
        }
      })
      .catch(err => console.error('Failed to fetch setup status', err));
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!mobile || !password) {
      setError(t('form.validation_error'));
      return;
    }

    setLoading(true);
    try {
      const success = await loginStaff(mobile, password);
      if (success) {
        router.push('/staff/dashboard');
      } else {
        setError('Invalid staff credentials. Verification failed.');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50 select-none text-left">
        <div className="max-w-md w-full flex flex-col gap-6">
          
          {/* Back Link */}
          <Link 
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-gov-text-muted hover:text-gov-primary transition-all w-max bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t('form.prev')}
          </Link>

          {/* Login Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 relative overflow-hidden text-left">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900"></div>

            {/* Header */}
            <div className="text-center flex flex-col items-center gap-2 mb-8">
              <div className="bg-slate-100 text-slate-805 p-3 rounded-full border border-slate-200 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-gov-primary" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('login.staff_title')}</h1>
              <p className="text-xs text-gov-text-muted">{t('login.staff_subtitle')}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-750 text-xs p-3.5 rounded-lg mb-6 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mobile" className="text-xs font-bold text-slate-700">
                  {t('form.mobile_label')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    id="mobile"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:border-slate-850 outline-none text-sm font-semibold tracking-wider"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-bold text-slate-700">
                  {t('form.password_label')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="Enter security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:border-slate-850 outline-none text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-sm shadow transition-all flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : null}
                {t('nav.login')}
              </button>
            </form>

            <div className="border-t border-slate-100 mt-8 pt-4 text-center">
              <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                🔒 Double-encrypted audit logs enabled. Secure Session.
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
