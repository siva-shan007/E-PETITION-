'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, ArrowLeft, Phone, User as UserIcon, Lock, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export default function CitizenLogin() {
  const { loginAsCitizen, verifyCitizenOtp } = useAuth();
  const { language, t } = useLanguage();
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const mockOtp = await loginAsCitizen(mobile);
      setSimulatedOtp(mockOtp);
      setOtpSent(true);
      setStep('OTP');
      // Alert the code to the user as a fallback since the SMS simulation panel is deleted
      alert(`[SMS Simulation] OTP Code is: ${mockOtp}`);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const success = await verifyCitizenOtp(mobile, otp, name);
      if (success) {
        router.push('/citizen/dashboard');
      } else {
        setError('Incorrect OTP. Please enter the code sent to your alert.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 select-none text-left">
        <div className="max-w-md w-full flex flex-col gap-6">
          
          {/* Back button */}
          <Link 
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-gov-text-muted hover:text-gov-primary transition-all w-max bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t('form.prev')}
          </Link>

          {/* Login Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gov-primary"></div>
            
            {/* Header */}
            <div className="text-center flex flex-col items-center gap-2 mb-8">
              <div className="bg-blue-50 text-gov-primary p-3 rounded-full border border-blue-100">
                <Landmark className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('login.citizen_title')}</h1>
              <p className="text-xs text-gov-text-muted">{t('login.citizen_subtitle')}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-750 text-xs p-3.5 rounded-lg mb-6 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {step === 'MOBILE' ? (
              /* Step 1: Mobile & Name Form */
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-xs font-bold text-slate-700">
                    {t('form.name_label')}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder={t('form.name_placeholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:border-gov-primary outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

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
                      placeholder={t('form.mobile_placeholder')}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:border-gov-primary outline-none transition-all text-sm font-semibold tracking-wider"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gov-primary hover:bg-gov-primary-dark text-white py-3 rounded-xl font-bold text-sm shadow transition-all flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? '...' : t('form.send_otp')}
                </button>
              </form>
            ) : (
              /* Step 2: OTP Verification Form */
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 text-left">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-center flex flex-col gap-1">
                  <span className="text-xs text-slate-600 font-semibold">Verification Code Sent To</span>
                  <span className="text-sm font-bold text-gov-primary tracking-wider font-mono">+91 {mobile}</span>
                </div>

                {simulatedOtp && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl text-center font-bold">
                    Simulated OTP: <strong className="text-gov-primary text-sm font-mono tracking-wider ml-1">{simulatedOtp}</strong>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="otp" className="text-xs font-bold text-slate-700">
                    {t('form.otp_label')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      id="otp"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:border-gov-primary outline-none transition-all text-sm font-bold text-center tracking-[0.4em] text-gov-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gov-primary hover:bg-gov-primary-dark text-white py-3 rounded-xl font-bold text-sm shadow transition-all flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? '...' : t('form.verify_otp')}
                </button>
              </form>
            )}

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
