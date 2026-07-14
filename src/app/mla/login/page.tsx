'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, ArrowLeft, Phone, Lock, Award, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export default function MlaLogin() {
  const { loginMla } = useAuth();
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
      const success = await loginMla(mobile, password);
      if (success) {
        router.push('/mla/dashboard');
      } else {
        setError('Invalid MLA admin credentials. Verification failed.');
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

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50 select-none text-left">
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
            {/* Royal Gold Top Bar for MLA */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>

            {/* Header */}
            <div className="text-center flex flex-col items-center gap-2 mb-8">
              <div className="bg-amber-50 text-amber-600 p-3 rounded-full border border-amber-100 shadow-sm">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('login.mla_title')}</h1>
              <p className="text-xs text-gov-text-muted">{t('login.mla_subtitle')}</p>
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
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:border-gov-primary outline-none transition-all text-sm font-semibold tracking-wider"
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
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:border-gov-primary outline-none transition-all text-sm font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1e293b] hover:bg-slate-805 text-white py-3 rounded-xl font-bold text-sm shadow transition-all flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : null}
                {t('nav.login')}
              </button>
            </form>

            <div className="border-t border-slate-100 mt-8 pt-4 text-center">
              <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                🛡️ Secured government session. Data is private.
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
