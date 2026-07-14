'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, ShieldAlert, User, Phone, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export default function FirstTimeSetup() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [checking, setChecking] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if setup is actually required
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        if (data.setupRequired) {
          setSetupRequired(true);
        } else {
          router.push('/');
        }
        setChecking(false);
      })
      .catch(err => {
        console.error('Failed to query setup status', err);
        setChecking(false);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/setup/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, email, password })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Super Admin (MLA) account registered successfully! Redirecting to login.');
        router.push('/mla/login');
      } else {
        setError(data.error || 'Setup failed. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gov-primary" />
          <span className="text-sm font-bold text-slate-500">Checking environment status...</span>
        </div>
      </div>
    );
  }

  if (!setupRequired) {
    return null;
  }

  return (
    <>
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#f8fafc] select-none text-left">
        <div className="max-w-md w-full flex flex-col gap-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 relative overflow-hidden text-left">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gov-primary"></div>

            {/* Header */}
            <div className="flex flex-col items-center gap-2 mb-6 text-center">
              <div className="bg-blue-50 text-gov-primary p-3 rounded-full border border-blue-100 shadow-inner">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                {language === 'en' ? 'First-Time Setup Wizard' : 'முதல் முறை அமைவு வழிகாட்டி'}
              </h1>
              <p className="text-xs text-gov-text-muted">
                {language === 'en' ? 'Provision the MLA Super Admin / Super Administrator Account' : 'MLA சூப்பர் அட்மின் / முதன்மை நிர்வாகி கணக்கை உருவாக்கவும்'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-750 text-xs p-3 rounded-lg mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Siva Shankaran D."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-gov-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Registered Mobile</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-gov-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin@mlaoffice.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-gov-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-gov-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-gov-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Provisioning...
                  </>
                ) : (
                  <>
                    Initialize Super Admin <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="border-t border-slate-100 mt-6 pt-4 text-center">
              <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                🔒 Production setup mode. Double encryption active.
              </span>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
