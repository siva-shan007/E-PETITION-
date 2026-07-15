'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Landmark, ArrowLeft, Search, Check, AlertCircle, Calendar, User, Building, MapPin, Loader2, Clock, Phone } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Petition, PetitionStatus } from '@/types';

const STATUS_SEQUENCE: PetitionStatus[] = ['SUBMITTED', 'VERIFIED', 'UNDER_REVIEW', 'FORWARDED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

function TrackPetitionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idParam = searchParams.get('id');
  const mobileParam = searchParams.get('mobile');
  const { language, t } = useLanguage();
  const { user } = useAuth();

  const [searchId, setSearchId] = useState(idParam || mobileParam || '');
  const [petition, setPetition] = useState<Petition | null>(null);
  const [multiplePetitions, setMultiplePetitions] = useState<Petition[] | null>(null);
  const [mobileResultsStore, setMobileResultsStore] = useState<Petition[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const categoryLabels: Record<string, string> = {
    'Roads & Infrastructure': t('cat.roads'),
    'Water Supply': t('cat.water'),
    'Pension': t('cat.pension'),
    'Electricity': t('cat.electricity'),
    'Government Schemes': t('cat.schemes'),
    'Education': t('cat.education'),
    'Others': t('cat.others')
  };

  const statusLabels: Record<PetitionStatus, string> = {
    'SUBMITTED': t('status.submitted'),
    'VERIFIED': t('status.verified'),
    'UNDER_REVIEW': t('status.under_review'),
    'FORWARDED': t('status.forwarded'),
    'IN_PROGRESS': t('status.in_progress'),
    'RESOLVED': t('status.resolved'),
    'CLOSED': t('status.closed')
  };

  const fetchPetition = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    setPetition(null);
    setMultiplePetitions(null);
    setMobileResultsStore(null);

    const isMobile = /^\d{10}$/.test(query.trim());

    try {
      if (isMobile) {
        const res = await fetch(`/api/petitions?mobile=${query.trim()}`);
        if (res.ok) {
          const result = await res.json();
          if (Array.isArray(result) && result.length > 0) {
            if (result.length === 1) {
              setPetition(result[0]);
            } else {
              setMultiplePetitions(result);
              setMobileResultsStore(result);
            }
          } else {
            setError('No petitions found for this mobile number.');
          }
        } else {
          setError(t('track.not_found'));
        }
      } else {
        const res = await fetch(`/api/petitions/${query.trim().toUpperCase()}`);
        if (res.ok) {
          const result = await res.json();
          setPetition(result.petition);
        } else {
          setPetition(null);
          setError(t('track.not_found'));
        }
      }
    } catch (err) {
      setError('An error occurred while tracking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.mobile && !searchId) {
        setSearchId(user.mobile);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [user, searchId]);

  useEffect(() => {
    const q = idParam || mobileParam;
    if (q) {
      const timer = setTimeout(() => {
        fetchPetition(q);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [idParam, mobileParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const isMobile = /^\d{10}$/.test(searchId.trim());
    if (isMobile) {
      router.replace(`/citizen/track?mobile=${searchId.trim()}`);
    } else {
      router.replace(`/citizen/track?id=${searchId.trim().toUpperCase()}`);
    }
    fetchPetition(searchId);
  };

  const getStatusIndex = (currentStatus: PetitionStatus): number => {
    return STATUS_SEQUENCE.indexOf(currentStatus);
  };

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6 select-none text-left">
        
        {/* Back Link */}
        <Link 
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-gov-text-muted hover:text-gov-primary transition-all w-max bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm animate-fade-in"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('form.prev')}
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Search className="w-6 h-6 text-gov-primary" /> {t('track.title')}
          </h1>
          <p className="text-xs text-gov-text-muted mt-0.5">{t('track.desc')}</p>
        </div>

        {/* Search Bar Input */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 animate-fade-in">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                placeholder={language === 'en' ? 'Enter Petition ID or Mobile Number' : 'மனு குறியீடு அல்லது கைபேசி எண்'}
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-gov-primary focus:ring-1 focus:ring-gov-primary outline-none transition-all text-sm font-bold uppercase tracking-wider text-gov-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gov-primary hover:bg-gov-primary-dark text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> ...
                </>
              ) : (
                t('track.search_btn')
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-755 text-xs p-4 rounded-xl flex items-start gap-2.5 shadow-sm font-semibold animate-fade-in text-left">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* List of multiple petitions for mobile search */}
        {searched && !loading && multiplePetitions && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 animate-fade-in flex flex-col gap-4 text-left">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">
              Select a petition to track:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {multiplePetitions.map((pet) => (
                <div
                  key={pet.id}
                  onClick={() => {
                    setPetition(pet);
                    setMultiplePetitions(null);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 p-4 border rounded-xl cursor-pointer transition-all flex flex-col gap-2 border-slate-200"
                >
                  <div className="flex justify-between items-center border-b pb-1.5 font-bold text-xs">
                    <span className="text-slate-800 font-mono">{pet.id}</span>
                    <span className="text-gov-primary">{categoryLabels[pet.category] || pet.category}</span>
                  </div>
                  <p className="text-xs text-slate-655 line-clamp-2 leading-relaxed">
                    {pet.description}
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t pt-2 mt-1">
                    <span>Status: <strong className="text-gov-primary">{statusLabels[pet.status] || pet.status}</strong></span>
                    <span>{new Date(pet.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to list button if selected from multiple results */}
        {mobileResultsStore && mobileResultsStore.length > 1 && petition && !loading && (
          <button
            onClick={() => {
              setPetition(null);
              setMultiplePetitions(mobileResultsStore);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-gov-primary bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl shadow-sm hover:bg-blue-100 transition-all cursor-pointer w-max animate-fade-in"
          >
            ← Back to Petition List
          </button>
        )}

        {/* Detailed Status Result */}
        {searched && petition && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            
            {/* Left Column: Petition Details Summary Card */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-5 sticky top-20 text-left">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-gov-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{petition.id}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('track.info_title')}</span>
              </div>

              <div className="flex flex-col gap-3.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">{t('form.name_label')}</span>
                  <span className="font-extrabold text-slate-800 mt-1 block flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {petition.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Priority</span>
                  <span className="font-bold uppercase text-red-600 mt-1 block">{petition.priority || 'MEDIUM'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">{t('form.category_label')}</span>
                  <span className="font-bold text-gov-primary bg-blue-50 px-2.5 py-0.5 border border-blue-100 rounded w-max mt-1 block">{categoryLabels[petition.category] || petition.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">{t('form.ward_label')}</span>
                  <span className="font-bold text-slate-800 mt-1 block truncate">{petition.ward}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">{t('form.address_label')}</span>
                  <span className="font-medium text-slate-650 mt-1 block leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">{petition.address}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">{t('form.description_label')}</span>
                  <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed mt-1 whitespace-pre-line">
                    {petition.description}
                  </p>
                </div>

                {petition.assignedDept && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Assigned Department</span>
                    <span className="font-bold text-slate-800 mt-1 block flex items-center gap-1"><Building className="w-3.5 h-3.5 text-slate-400" /> {petition.assignedDept}</span>
                  </div>
                )}
                
                {petition.gpsLocation && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">{t('form.gps_label')}</span>
                    <span className="font-bold text-slate-850 mt-1 block font-mono flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-500" /> {petition.gpsLocation}</span>
                  </div>
                )}

                {petition.publicRemarks && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-1 text-[11px] leading-relaxed shadow-inner">
                    <span className="text-[10px] text-blue-600 font-bold block uppercase tracking-wider mb-1">Public Remarks</span>
                    <p className="font-bold text-blue-900">{petition.publicRemarks}</p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Last Updated Date & Time</span>
                  <span className="font-semibold text-slate-700 mt-1 block">{new Date(petition.updatedAt).toLocaleString()}</span>
                </div>

                {petition.resolvedAt && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Resolution Date & Time</span>
                    <span className="font-bold text-emerald-600 mt-1 block">{new Date(petition.resolvedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Visual Timeline Card */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-6 text-left">
              <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <Clock className="w-4.5 h-4.5 text-gov-primary" /> {t('track.timeline_title')}
              </h3>

              {/* Vertical Timeline Component */}
              <div className="flex flex-col gap-0 select-none text-left">
                {STATUS_SEQUENCE.map((statusStep, index) => {
                  const currentIdx = getStatusIndex(petition.status);
                  const isCompleted = index < currentIdx;
                  const isActive = index === currentIdx;
                  const isFuture = index > currentIdx;

                  // Find log in history matching this step status
                  const logDetail = petition.history.find(h => h.status === statusStep);

                  return (
                    <div key={statusStep} className="flex gap-4 min-h-[90px] relative text-left">
                      {/* Left: Indicator circles & line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCompleted 
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                            : isActive
                              ? 'bg-gov-primary border-gov-primary text-white scale-110 shadow animate-pulse'
                              : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <span className="text-[10px] font-bold">{index + 1}</span>
                          )}
                        </div>

                        {/* Connection Line */}
                        {index < STATUS_SEQUENCE.length - 1 && (
                          <div className={`w-0.5 flex-1 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                        )}
                      </div>

                      {/* Right: Content details */}
                      <div className="flex-1 pb-6 text-left">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <h4 className={`text-sm font-extrabold ${isActive ? 'text-gov-primary' : isFuture ? 'text-slate-400' : 'text-slate-800'}`}>
                            {statusLabels[statusStep] || statusStep}
                          </h4>
                          {logDetail && (
                            <span className="text-[10px] text-slate-400 font-semibold font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(logDetail.createdAt).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Status logs detail content */}
                        {logDetail ? (
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mt-2 flex flex-col gap-1 text-[11px] leading-relaxed shadow-inner">
                            <p className="font-semibold text-slate-700">{logDetail.remarks}</p>
                            <span className="text-[10px] text-gov-primary font-bold mt-1 uppercase tracking-wider">
                              {logDetail.actor}
                            </span>
                          </div>
                        ) : isActive ? (
                          <p className="text-[11px] text-gov-primary font-semibold mt-1 animate-pulse">
                            🔄 Processing active step...
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 mt-1">
                            Pending.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </main>

      <Footer />
    </>
  );
}

export default function TrackPetition() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-gov-primary" />
      </div>
    }>
      <TrackPetitionContent />
    </React.Suspense>
  );
}
