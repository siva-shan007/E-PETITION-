'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Landmark, ArrowRight, Check, MapPin, Upload, X, FileText, User, Phone, 
  Search, HelpCircle, ChevronRight, Globe, AlertCircle, RefreshCw, Sparkles, Building, Loader2, Calendar
} from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Petition, PetitionStatus, Announcement } from '@/types';
import confetti from 'canvas-confetti';

const Wards = ['Ward 12', 'Ward 7', 'Ward 15', 'Ward 3', 'Ward 18'];
const Categories = ['Roads & Infrastructure', 'Water Supply', 'Pension', 'Electricity', 'Government Schemes', 'Education', 'Others'];

const STATUS_SEQUENCE: PetitionStatus[] = ['SUBMITTED', 'VERIFIED', 'UNDER_REVIEW', 'FORWARDED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function Home() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  // Mobile View Steps
  // 1 = Welcome, 2 = Personal details, 3 = Petition details, 4 = Submitted, 5 = Track status
  const [mobileStep, setMobileStep] = useState(1);
  
  // Citizen form data state
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Petition details state
  const [ward, setWard] = useState('Ward 12');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('Roads & Infrastructure');
  const [description, setDescription] = useState('');
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState('');

  // Tracking state
  const { user, isAuthenticated } = useAuth();
  const [trackSearchId, setTrackSearchId] = useState('');
  const [trackMobile, setTrackMobile] = useState('');
  const [trackedPetition, setTrackedPetition] = useState<Petition | null>(null);
  const [multipleTrackedPetitions, setMultipleTrackedPetitions] = useState<Petition[] | null>(null);
  const [mobileResultsStore, setMobileResultsStore] = useState<Petition[] | null>(null);
  const [trackError, setTrackError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  useEffect(() => {
    if (user?.mobile) {
      const timer = setTimeout(() => {
        setTrackMobile(user.mobile);
        // Auto-fill track search field with mobile to make it easy for logged-in citizens
        setTrackSearchId(user.mobile);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Dynamic news bulletins & announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        const active = data.filter((a: Announcement) => a.active);
        setAnnouncements(active.slice(0, 3));
      })
      .catch(err => console.error(err));
  }, []);

  const categoryLabels: Record<string, string> = {
    'Roads & Infrastructure': t('cat.roads'),
    'Water Supply': t('cat.water'),
    'Pension': t('cat.pension'),
    'Electricity': t('cat.electricity'),
    'Government Schemes': t('cat.schemes'),
    'Education': t('cat.education'),
    'Others': t('cat.others')
  };

  const statusLabels: Record<string, string> = {
    'SUBMITTED': t('status.submitted'),
    'VERIFIED': t('status.verified'),
    'UNDER_REVIEW': t('status.under_review'),
    'FORWARDED': t('status.forwarded'),
    'IN_PROGRESS': t('status.in_progress'),
    'RESOLVED': t('status.resolved'),
    'CLOSED': t('status.closed')
  };

  // Simulate OTP code inline
  const handleSendOtp = () => {
    setInlineError('');
    if (mobile.length !== 10) {
      setInlineError(t('login.error_fields'));
      return;
    }
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(mockOtp);
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    setInlineError('');
    setVerifyingOtp(true);
    setTimeout(() => {
      if (otpInput === otpCode) {
        setOtpVerified(true);
        setInlineError('');
      } else {
        setInlineError(t('login.error_failed'));
      }
      setVerifyingOtp(false);
    }, 600);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPetition = async () => {
    setInlineError('');
    if (!description.trim() || !address.trim() || !name.trim() || !mobile.trim()) {
      setInlineError(t('form.validation_error'));
      return;
    }

    if (description.length < 10) {
      setInlineError(t('form.description_min_len'));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/petitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mobile,
          ward,
          address,
          category,
          description,
          documents: uploadedPhoto ? [uploadedPhoto] : []
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCreatedId(data.id);
        setMobileStep(4);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setInlineError(data.error || 'Failed to submit petition.');
      }
    } catch (e) {
      setInlineError('Connection failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadCreatedForTracking = () => {
    setTrackSearchId(createdId);
    setTrackLoading(true);
    setMobileStep(5);
    
    fetch(`/api/petitions/${createdId}`)
      .then(res => res.json())
      .then(data => {
        if (data.petition) {
          setTrackedPetition(data.petition);
        } else {
          setTrackError(t('track.not_found'));
        }
        setTrackLoading(false);
      })
      .catch(() => {
        setTrackError('Query error.');
        setTrackLoading(false);
      });
  };

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    setTrackedPetition(null);
    setMultipleTrackedPetitions(null);
    setMobileResultsStore(null);

    const query = trackSearchId.trim();
    if (!query) {
      setTrackError('Please enter a Petition ID or Mobile Number.');
      return;
    }

    setTrackLoading(true);
    const isMobile = /^\d{10}$/.test(query);

    if (isMobile) {
      fetch(`/api/petitions?mobile=${query}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            if (data.length === 1) {
              setTrackedPetition(data[0]);
            } else {
              setMultipleTrackedPetitions(data);
              setMobileResultsStore(data);
            }
          } else {
            setTrackError('No petitions found for this mobile number.');
          }
          setTrackLoading(false);
        })
        .catch(() => {
          setTrackError('Query error.');
          setTrackLoading(false);
        });
    } else {
      fetch(`/api/petitions/${query.toUpperCase()}`)
        .then(res => res.json())
        .then(data => {
          if (data.petition) {
            setTrackedPetition(data.petition);
          } else {
            setTrackError(t('track.not_found'));
          }
          setTrackLoading(false);
        })
        .catch(() => {
          setTrackError('Query error.');
          setTrackLoading(false);
        });
    }
  };

  const resetFlow = () => {
    setMobileStep(1);
    setName('');
    setMobile('');
    setOtpSent(false);
    setOtpCode('');
    setOtpInput('');
    setOtpVerified(false);
    setAddress('');
    setDescription('');
    setUploadedPhoto(null);
    setTrackSearchId('');
    if (!user?.mobile) {
      setTrackMobile('');
    } else {
      setTrackSearchId(user.mobile);
    }
    setTrackedPetition(null);
    setMultipleTrackedPetitions(null);
    setMobileResultsStore(null);
    setInlineError('');
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8 select-none text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: HERO BANNER & CONSTITUENCY BULLETINS */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Direct Connection Hero */}
            <div className="bg-slate-900 rounded-3xl text-white p-8 relative overflow-hidden shadow-xl border border-slate-800">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full filter blur-3xl opacity-20 transform translate-x-20 -translate-y-20"></div>
              
              <div className="flex items-center gap-2 text-blue-400 text-xs font-extrabold uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full w-max border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" /> {t('nav.subtitle')}
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-extrabold mt-6 tracking-tight leading-tight max-w-lg">
                {t('home.hero_title')}
              </h1>
              
              <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-md font-semibold">
                {t('home.hero_subtitle')}
              </p>
              
              <div className="flex flex-wrap gap-4 mt-8">
                <button 
                  onClick={() => {
                    if (isAuthenticated && user?.role === 'CITIZEN') {
                      router.push('/citizen/submit');
                    } else {
                      router.push('/citizen/login');
                    }
                  }} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {t('home.file_now')} <ChevronRight className="w-4.5 h-4.5" />
                </button>
                <button 
                  onClick={() => {
                    if (isAuthenticated && user?.role === 'CITIZEN') {
                      router.push('/citizen/appointments');
                    } else {
                      router.push('/citizen/login');
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" /> {language === 'en' ? 'Book Appointment' : 'சந்திப்பு முன்பதிவு'}
                </button>
                <button 
                  onClick={() => router.push('/citizen/track')}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-extrabold text-xs px-5 py-3.5 rounded-xl transition-all cursor-pointer"
                >
                  {t('home.track_btn')}
                </button>
              </div>
            </div>

            {/* Core Portfolios */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b pb-3 mb-4">{t('home.category_title')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Categories.map((c, i) => (
                  <div key={i} className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span className="text-[10px] font-extrabold text-slate-800">{categoryLabels[c] || c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bulletins board */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b pb-3 mb-4">{t('home.quick_links')}</h3>
              
              {announcements.length === 0 ? (
                <div className="py-6 text-center text-slate-400 font-bold text-xs">
                  {t('help.no_announcements')}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {announcements.map((ann: Announcement) => (
                    <div key={ann.id} className="flex gap-4 items-start border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border text-center font-bold font-mono">
                        <span className="text-[9px] uppercase block tracking-wider">{ann.category}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                          {new Date(ann.date).toLocaleDateString()}
                        </span>
                        <h4 className="font-extrabold text-slate-850 text-xs mt-1 truncate">{ann.title}</h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                          {ann.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT PANEL: PHONE FRAME SIMULATOR (Digital Kiosk) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Phone Simulator frame */}
            <div className="w-full max-w-[370px] mx-auto aspect-[9/18.5] bg-[#0c101b] rounded-[48px] p-3 shadow-2xl relative border-[9px] border-[#202738] flex flex-col select-none overflow-hidden">
              {/* Speaker & camera bar */}
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-28 h-5.5 bg-[#202738] rounded-full z-20 flex items-center justify-center">
                <span className="w-10 h-1 bg-[#121622] rounded-full block"></span>
              </div>

              {/* Inner phone screen */}
              <div className="flex-grow bg-white rounded-[38px] overflow-hidden flex flex-col relative pt-5 shadow-inner">
                
                {/* SCREEN 1: KIOSK WELCOME */}
                {mobileStep === 1 && (
                  <div className="flex-grow p-5 flex flex-col justify-between animate-fade-in text-center">
                    <div className="flex flex-col items-center justify-center gap-2 py-2">
                      <div className="bg-blue-50 text-gov-primary p-2 rounded-full border border-blue-100 shadow-inner">
                        <Landmark className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <h2 className="text-sm font-extrabold text-slate-850">{t('login.citizen_title')}</h2>
                        <h3 className="text-[11px] font-bold text-gov-primary uppercase tracking-wider">{t('nav.title')}</h3>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-auto">
                      {/* Representative Photo - using complete width inside the mt-auto container */}
                      <div className="flex flex-col gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-250 shadow-sm">
                        <div className="relative w-full h-72 rounded-xl overflow-hidden shadow-inner bg-slate-950 flex items-center justify-center">
                          <img
                            src="/mla-photo.jpg"
                            alt="Dr. R. Ramesh Kumar (Hon. MLA)"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-extrabold text-slate-850">Dr. R. Ramesh Kumar</p>
                          <p className="text-[9px] font-bold text-gov-primary uppercase tracking-wider mt-0.5">
                            {language === 'en' ? 'Hon. MLA, Constituency Representative' : 'மாண்புமிகு சட்டமன்ற உறுப்பினர்'}
                          </p>
                        </div>
                      </div>

                      {/* Language Selection */}
                      <div className="flex flex-col gap-1.5 text-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('home.lang_title')}</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                          <button
                            onClick={() => setLanguage('en')}
                            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                              language === 'en' ? 'bg-gov-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            English
                          </button>
                          <button
                            onClick={() => setLanguage('ta')}
                            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                              language === 'ta' ? 'bg-gov-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            தமிழ்
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (isAuthenticated && user?.role === 'CITIZEN') {
                            router.push('/citizen/submit');
                          } else {
                            router.push('/citizen/login');
                          }
                        }}
                        className="w-full bg-gov-primary hover:bg-gov-primary-dark text-white py-3 rounded-xl font-extrabold text-xs shadow flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {t('form.start_first_petition')} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 2: PERSONAL DETAILS & OTP */}
                {mobileStep === 2 && (
                  <div className="flex-grow p-4.5 flex flex-col justify-between animate-fade-in text-left">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gov-primary uppercase tracking-wider border-b pb-2">
                        <FileText className="w-3.5 h-3.5" /> {t('form.step1_title')}
                      </div>

                      {inlineError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-[10px] p-2.5 rounded-lg flex items-start gap-1.5 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>{inlineError}</span>
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t('form.name_label')}</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            required
                            disabled={otpVerified}
                            placeholder={t('form.name_placeholder')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-gov-primary disabled:bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t('form.mobile_label')}</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            disabled={otpVerified}
                            placeholder={t('form.mobile_placeholder')}
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-gov-primary disabled:bg-slate-50"
                          />
                        </div>
                      </div>

                      {/* Simulated OTP */}
                      {!otpVerified && (
                        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                          {otpSent ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                <span>Enter Code: <strong className="text-gov-primary font-mono">{otpCode}</strong></span>
                                <span className="text-[9px] text-emerald-650 bg-emerald-50 px-1.5 py-0.2 rounded border">Simulated</span>
                              </div>
                              <input
                                type="text"
                                maxLength={6}
                                placeholder={t('form.otp_input_placeholder')}
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                className="w-full p-2 border border-slate-200 rounded-lg outline-none text-xs font-bold text-center tracking-[0.2em]"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={verifyingOtp}
                                className="w-full bg-slate-900 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                {verifyingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('form.verify_otp')}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              className="w-full bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold py-2 rounded-lg transition-all"
                            >
                              {t('form.send_otp')}
                            </button>
                          )}
                        </div>
                      )}

                      {otpVerified && (
                        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs py-2 px-3 rounded-lg flex items-center justify-between font-bold mt-2">
                          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 stroke-[3]" /> Verified</span>
                          <span className="text-[10px] text-emerald-600">Secure link ✓</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                      <button
                        onClick={resetFlow}
                        className="bg-slate-100 text-slate-600 text-xs font-bold py-2 px-4 rounded-xl border border-slate-200"
                      >
                        {t('form.prev')}
                      </button>
                      <button
                        onClick={() => setMobileStep(3)}
                        disabled={!otpVerified}
                        className="bg-gov-primary text-white text-xs font-bold py-2 px-4 rounded-xl disabled:opacity-50 flex items-center gap-1"
                      >
                        {t('form.next')} <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 3: PETITION DETAILS */}
                {mobileStep === 3 && (
                  <div className="flex-grow p-4.5 flex flex-col justify-between animate-fade-in text-left">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gov-primary uppercase tracking-wider border-b pb-2">
                        <FileText className="w-3.5 h-3.5" /> {t('form.step3_title')}
                      </div>

                      {inlineError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-[10px] p-2.5 rounded-lg flex items-start gap-1.5 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>{inlineError}</span>
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t('form.category_label')}</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-2 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold bg-white cursor-pointer"
                        >
                          {Categories.map((c, idx) => (
                            <option key={idx} value={c}>{categoryLabels[c] || c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t('form.ward_label')}</label>
                        <select
                          value={ward}
                          onChange={(e) => setWard(e.target.value)}
                          className="w-full px-2 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold bg-white cursor-pointer"
                        >
                          {Wards.map((w, idx) => (
                            <option key={idx} value={w}>{w}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t('form.address_label')}</label>
                        <input
                          type="text"
                          required
                          placeholder={t('form.address_placeholder')}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full px-2 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-gov-primary"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t('form.description_label')}</label>
                        <textarea
                          placeholder={t('form.description_placeholder')}
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold"
                        />
                      </div>

                      {/* Photo Upload */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t('form.upload_label')}</label>
                        <div className="border border-dashed border-slate-200 rounded-lg p-2.5 text-center relative hover:border-gov-primary bg-slate-50/50">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {uploadedPhoto ? (
                            <div className="flex items-center gap-2 text-left bg-white p-1 rounded border">
                              <img src={uploadedPhoto} alt="upload" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                              <span className="text-[9px] text-slate-500 font-bold truncate flex-1">Image Selected</span>
                              <button onClick={(e) => { e.stopPropagation(); setUploadedPhoto(null); }} className="text-slate-400 p-0.5 hover:text-red-500">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5 text-slate-400 py-1">
                              <Upload className="w-4 h-4 text-slate-400" />
                              <span className="text-[9px] font-bold text-slate-500">Click to upload photo</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-4">
                      <button
                        onClick={() => setMobileStep(2)}
                        className="bg-slate-100 text-slate-650 text-xs font-bold py-2 px-4 rounded-xl border border-slate-200"
                      >
                        {t('form.prev')}
                      </button>
                      <button
                        onClick={handleSubmitPetition}
                        disabled={submitting}
                        className="bg-gov-primary text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1 shadow-sm disabled:opacity-50"
                      >
                        {submitting ? '...' : t('form.submit')}
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 4: SUCCESS */}
                {mobileStep === 4 && (
                  <div className="flex-grow p-5 flex flex-col justify-between animate-fade-in text-center">
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                      <div className="bg-emerald-50 text-emerald-500 p-4 rounded-full border border-emerald-100 shadow-inner">
                        <Check className="w-10 h-10 stroke-[3]" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900 leading-snug">{t('form.success_title')}</h2>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1 max-w-xs mx-auto">
                          {t('form.success_desc')}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 w-full mt-4 text-left flex flex-col gap-2">
                        <span className="text-[9px] text-slate-400 font-bold block">{t('form.ref_code')}</span>
                        <strong className="text-sm font-mono text-gov-primary block text-center font-bold tracking-wider">{createdId}</strong>
                      </div>
                    </div>

                    <button
                      onClick={loadCreatedForTracking}
                      className="w-full bg-gov-primary hover:bg-gov-primary-dark text-white py-3 rounded-xl font-extrabold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer mt-auto"
                    >
                      {t('form.track_flow_btn')}
                    </button>
                  </div>
                )}

                {/* SCREEN 5: TRACK STATUS TIMELINE */}
                {mobileStep === 5 && (
                  <div className="flex-grow p-4.5 flex flex-col gap-4 animate-fade-in text-left">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gov-primary uppercase tracking-wider border-b pb-2">
                      <Search className="w-3.5 h-3.5" /> {t('track.title')}
                    </div>

                    {/* Simple search bar */}
                    <form onSubmit={handleTrackSearch} className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder={language === 'en' ? 'Enter Petition ID or Mobile Number' : 'மனு குறியீடு அல்லது கைபேசி எண்'}
                        value={trackSearchId}
                        onChange={(e) => setTrackSearchId(e.target.value)}
                        className="p-2 rounded-lg border border-slate-200 text-xs font-bold uppercase tracking-wider text-gov-primary outline-none w-full"
                      />
                      <button type="submit" className="bg-slate-900 text-white p-2.5 rounded-lg text-xs font-bold w-full cursor-pointer">
                        {t('track.search_btn')}
                      </button>
                    </form>

                    {trackLoading && (
                      <div className="py-10 text-center text-xs font-semibold text-slate-500">{t('track.searching')}</div>
                    )}

                    {trackError && (
                      <div className="bg-red-50 text-red-655 text-[10px] p-2.5 rounded-lg border border-red-200 font-semibold text-left">{trackError}</div>
                    )}

                    {/* List of multiple petitions for mobile search */}
                    {!trackLoading && multipleTrackedPetitions && (
                      <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-0.5 text-left animate-fade-in">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">
                          Select a petition to track:
                        </span>
                        {multipleTrackedPetitions.map((pet) => (
                          <div
                            key={pet.id}
                            onClick={() => {
                              setTrackedPetition(pet);
                              setMultipleTrackedPetitions(null);
                            }}
                            className="bg-slate-50 hover:bg-slate-100 p-2.5 border rounded-lg text-[10px] leading-relaxed cursor-pointer transition-all flex flex-col gap-1 text-left"
                          >
                            <div className="flex justify-between items-center border-b pb-1 mb-1 font-bold">
                              <span className="text-slate-800 font-mono">{pet.id}</span>
                              <span className="text-gov-primary font-bold">{categoryLabels[pet.category] || pet.category}</span>
                            </div>
                            <span className="truncate">Issue: <strong>{pet.description}</strong></span>
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mt-1">
                              <span>Status: <strong className="text-gov-primary">{statusLabels[pet.status] || pet.status}</strong></span>
                              <span>{new Date(pet.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {mobileResultsStore && mobileResultsStore.length > 1 && trackedPetition && (
                      <button
                        onClick={() => {
                          setTrackedPetition(null);
                          setMultipleTrackedPetitions(mobileResultsStore);
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-1.5 px-3 rounded-lg border text-center cursor-pointer mb-2"
                      >
                        ← Back to Petition List
                      </button>
                    )}

                    {!trackLoading && trackedPetition && (
                      <div className="flex flex-col gap-4 overflow-y-auto max-h-[340px] pr-0.5 text-left">
                        <div className="bg-slate-50 p-2.5 border rounded-lg text-[10px] leading-relaxed flex flex-col gap-1 text-left">
                          <div className="flex justify-between items-center border-b pb-1.5 mb-1.5 font-bold">
                            <span className="text-slate-800 font-mono">{trackedPetition.id}</span>
                            <span className="text-gov-primary font-bold">{categoryLabels[trackedPetition.category] || trackedPetition.category}</span>
                          </div>
                          <span>Name: <strong>{trackedPetition.name}</strong></span>
                          <span>Priority: <strong className="uppercase text-red-600">{trackedPetition.priority || 'MEDIUM'}</strong></span>
                          <span>Assigned Department: <strong>{trackedPetition.assignedDept || 'Not Assigned Yet'}</strong></span>
                          <span className="block truncate">Issue: <strong className="text-slate-655">{trackedPetition.description}</strong></span>
                          {trackedPetition.publicRemarks && (
                            <span className="block bg-blue-50 text-blue-900 border border-blue-100 p-2 rounded mt-1 font-semibold leading-normal">
                              Public Remarks: {trackedPetition.publicRemarks}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 block mt-1">Last Updated: {new Date(trackedPetition.updatedAt).toLocaleString()}</span>
                          {trackedPetition.resolvedAt && (
                            <span className="text-[9px] text-emerald-600 block">Resolution Date: {new Date(trackedPetition.resolvedAt).toLocaleString()}</span>
                          )}
                        </div>

                        {/* Interactive status lists */}
                        <div className="flex flex-col gap-0 select-none text-left">
                          {STATUS_SEQUENCE.map((statusStep, index) => {
                            const currentIdx = STATUS_SEQUENCE.indexOf(trackedPetition.status);
                            const isCompleted = index <= currentIdx;
                            const isCurrent = statusStep === trackedPetition.status;

                            return (
                              <div key={index} className="flex gap-3 relative pb-5 last:pb-0 text-left">
                                {/* Vertical line connecting dots */}
                                {index < STATUS_SEQUENCE.length - 1 && (
                                  <div className={`absolute left-2.5 top-5 w-0.5 h-full ${
                                    index < currentIdx ? 'bg-emerald-500' : 'bg-slate-200'
                                  }`}></div>
                                )}

                                {/* Status Dot indicator */}
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 flex-shrink-0 border-2 ${
                                  isCompleted
                                    ? isCurrent
                                      ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                                      : 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'bg-white border-slate-200 text-slate-400'
                                }`}>
                                  {isCompleted ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                                  ) : (
                                    <span className="text-[9px] font-bold">{index + 1}</span>
                                  )}
                                </div>

                                <div className="leading-tight">
                                  <span className={`text-[10px] font-extrabold block ${
                                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                                  }`}>
                                    {statusLabels[statusStep] || statusStep}
                                  </span>
                                  
                                  {/* Detailed log remarks for the status step */}
                                  {isCompleted && (
                                    <div className="mt-1 bg-slate-50 border p-2 rounded-lg max-w-[240px]">
                                      <p className="text-[9px] text-slate-600 font-semibold leading-relaxed">
                                        {statusStep === 'SUBMITTED' 
                                          ? t('form.success_desc')
                                          : trackedPetition.history.find(h => h.status === statusStep)?.remarks || 'Status logged.'}
                                      </p>
                                      <span className="text-[8px] text-slate-400 block mt-1 font-bold">
                                        Action by: {trackedPetition.history.find(h => h.status === statusStep)?.actor || 'Staff Officer'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={resetFlow}
                      className="w-full bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-lg mt-auto text-center cursor-pointer"
                    >
                      {t('form.submit_another')}
                    </button>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
      </main>
    </>
  );
}
