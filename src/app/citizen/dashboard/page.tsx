'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, FileText, Search, ClipboardList, HelpCircle, Bell, ArrowRight, User, Phone, Loader2, Calendar, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { Petition, Announcement, Appointment } from '@/types';
import Link from 'next/link';

export default function CitizenDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { language, t } = useLanguage();
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeTab, setActiveTab] = useState<'PETITIONS' | 'APPOINTMENTS'>('PETITIONS');
  const router = useRouter();

  const fetchAppointments = () => {
    if (!user?.mobile) return;
    fetch(`/api/appointments?citizenId=${user.mobile}`)
      .then(res => res.json())
      .then(data => {
        setAppointments(data);
      })
      .catch(console.error);
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm(language === 'en' ? 'Are you sure you want to cancel this appointment?' : 'இந்த சந்திப்பை ரத்து செய்ய விரும்புகிறீர்களா?')) return;

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          remarks: 'Cancelled by citizen'
        })
      });

      if (res.ok) {
        fetchAppointments();
      } else {
        alert('Failed to cancel appointment.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'RESCHEDULED':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'CANCELLED':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 border-slate-250';
    }
  };

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'CITIZEN')) {
      router.push('/citizen/login');
      return;
    }

    if (user?.mobile) {
      fetch('/api/petitions')
        .then(res => res.json())
        .then(data => {
          const filtered = data.filter((p: Petition) => p.mobile === user.mobile);
          setPetitions(filtered);
        })
        .catch(console.error);

      fetchAppointments();

      fetch('/api/announcements')
        .then(res => res.json())
        .then(data => {
          const active = data.filter((a: Announcement) => a.active);
          setAnnouncements(active);
        })
        .catch(console.error);
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gov-primary" />
          <span className="text-sm font-semibold text-slate-500">Verifying session...</span>
        </div>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    'Roads & Infrastructure': t('cat.roads'),
    'Water Supply': t('cat.water'),
    'Pension': t('cat.pension'),
    'Electricity': t('cat.electricity'),
    'Government Schemes': t('cat.schemes'),
    'Education': t('cat.education'),
    'Others': t('cat.others')
  };

  const statusColors: Record<string, { bg: string, text: string, border: string }> = {
    SUBMITTED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    UNDER_REVIEW: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    FORWARDED: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    IN_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    RESOLVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
  };

  const statusLabels: Record<string, string> = {
    'SUBMITTED': t('status.submitted'),
    'UNDER_REVIEW': t('status.under_review'),
    'FORWARDED': t('status.forwarded'),
    'IN_PROGRESS': t('status.in_progress'),
    'RESOLVED': t('status.resolved')
  };

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 select-none text-left">
        
        {/* Welcome Section */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gov-primary"></div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-gov-primary p-3 rounded-full border border-blue-100 flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {language === 'en' ? 'Hello' : 'வணக்கம்'}, {user.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gov-text-muted mt-1 font-semibold">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> +91 {user.mobile}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden sm:inline"></span>
                <span className="bg-blue-50 border border-blue-100 text-gov-primary px-1.5 py-0.2 rounded uppercase tracking-wider text-[9px] font-bold">{t('nav.login')}</span>
              </div>
            </div>
          </div>
          <Link
            href="/citizen/submit"
            className="w-full sm:w-auto bg-gov-primary hover:bg-gov-primary-dark text-white px-5 py-3 rounded-xl font-bold shadow text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4" /> {t('nav.new_petition')}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Grid: My Petitions Registry */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* Tab Switcher */}
            <div className="flex gap-4 border-b border-slate-200 mb-2">
              <button
                onClick={() => setActiveTab('PETITIONS')}
                className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'PETITIONS'
                    ? 'border-gov-primary text-gov-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                📋 {language === 'en' ? 'My Petitions' : 'என் மனுக்கள்'} ({petitions.length})
              </button>
              <button
                onClick={() => setActiveTab('APPOINTMENTS')}
                className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'APPOINTMENTS'
                    ? 'border-gov-primary text-gov-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                🗓️ {language === 'en' ? 'My Appointments' : 'எனது சந்திப்புகள்'} ({appointments.length})
              </button>
            </div>

            {activeTab === 'PETITIONS' ? (
              /* Petitions List Tab */
              petitions.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center gap-4 shadow-sm">
                  <div className="bg-slate-50 p-4 rounded-full text-slate-300">
                    <ClipboardList className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{t('form.empty_state_not_submitted')}</h3>
                  </div>
                  <Link
                    href="/citizen/submit"
                    className="bg-gov-primary hover:bg-gov-primary-dark text-white px-5 py-3 rounded-xl font-bold shadow text-xs flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" /> {t('form.start_first_petition')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {petitions.map((pet) => {
                    const style = statusColors[pet.status] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
                    return (
                      <div 
                        key={pet.id} 
                        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all hover:shadow-md hover:border-slate-300 text-left"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {pet.id}
                              </span>
                              <span className="text-xs font-semibold text-gov-primary bg-blue-50 px-2 py-0.5 rounded-full">
                                {categoryLabels[pet.category] || pet.category}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium block mt-1.5">
                              {new Date(pet.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.8 rounded-lg border flex items-center justify-center text-center ${style.bg} ${style.text} ${style.border}`}>
                            {statusLabels[pet.status] || pet.status}
                          </span>
                        </div>

                        <p className="text-xs text-gov-text-muted leading-relaxed line-clamp-2 bg-slate-50/50 p-2.5 rounded border border-slate-100 font-medium">
                          {pet.description}
                        </p>

                        {pet.assignedDept && (
                          <div className="text-[10px] text-slate-500 font-semibold bg-slate-50 px-2.5 py-1.5 rounded flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gov-primary"></span>
                            {t('track.assigned_dept')} <span className="text-slate-700 font-bold">{pet.assignedDept}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-[11px]">
                          <span className="text-slate-400 font-medium">
                            Last update: {new Date(pet.updatedAt).toLocaleDateString()}
                          </span>
                          <Link
                            href={`/citizen/track?id=${pet.id}`}
                            className="text-gov-primary hover:text-gov-primary-dark font-bold flex items-center gap-1"
                          >
                            {t('form.track_flow_btn')} <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Appointments List Tab */
              appointments.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center gap-4 shadow-sm">
                  <div className="bg-slate-50 p-4 rounded-full text-slate-350">
                    <Calendar className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">No appointments booked yet</h3>
                    <p className="text-xs text-gov-text-muted mt-1 leading-normal">
                      Schedule a meeting with the Hon. MLA or grievance office coordinators.
                    </p>
                  </div>
                  <Link
                    href="/citizen/appointments"
                    className="bg-gov-primary hover:bg-gov-primary-dark text-white px-5 py-3 rounded-xl font-bold shadow text-xs flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-4 h-4" /> Book Appointment
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all hover:shadow-md hover:border-slate-300 text-left text-xs"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded border">
                              {apt.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getStatusBadgeClass(apt.status)}`}>
                              {apt.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold block mt-1.5">
                            Booked on: {new Date(apt.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-slate-700 font-semibold">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Scheduled Date</span>
                          <span className="font-extrabold text-slate-850 mt-0.5 block">{apt.date}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Time Slot</span>
                          <span className="font-extrabold text-slate-850 mt-0.5 block flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {apt.timeSlot}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Purpose</span>
                        <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 whitespace-pre-line leading-relaxed shadow-inner">
                          {apt.purpose}
                        </p>
                      </div>

                      {apt.remarks && (
                        <div className="bg-blue-50 border border-blue-100 text-blue-900 p-2.5 rounded-lg font-semibold">
                          <span className="font-bold text-[10px] text-blue-800 block uppercase tracking-wider mb-0.5">Admin Response / Remarks</span>
                          {apt.remarks}
                        </div>
                      )}

                      {/* Cancel Trigger */}
                      {['PENDING', 'APPROVED', 'RESCHEDULED'].includes(apt.status) && (
                        <div className="border-t border-slate-100 pt-3 mt-1 flex justify-between items-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Actions available</span>
                          <button
                            type="button"
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 hover:text-rose-800 transition-all font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Cancel Appointment
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Sidebar: Announcements Widget */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Announcements Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 text-left">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Bell className="w-4.5 h-4.5 text-gov-primary" /> {t('help.announcements_board')}
              </h3>

              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">{t('help.no_announcements')}</p>
                ) : (
                  announcements.slice(0, 3).map((ann) => (
                    <div key={ann.id} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-blue-50 text-gov-primary text-[8px] font-extrabold px-1.5 py-0.2 rounded border border-blue-100 uppercase">
                          {ann.category}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {new Date(ann.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs mt-1">{ann.title}</h4>
                      <p className="text-[10px] text-slate-505 leading-normal mt-0.5 line-clamp-2">{ann.content}</p>
                    </div>
                  ))
                )}
              </div>

              <Link
                href="/citizen/help"
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 text-center py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200 mt-2 block"
              >
                {t('help.announcements_board')}
              </Link>
            </div>

            {/* Helpline Quick Contact Widget */}
            <div className="bg-blue-900 text-white rounded-2xl p-5 shadow-md flex flex-col gap-3 relative overflow-hidden text-left">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                <Landmark className="w-32 h-32" />
              </div>
              <h3 className="font-extrabold text-sm">{t('nav.subtitle')}</h3>
              <p className="text-[11px] text-blue-100 leading-relaxed font-medium">
                If you need help or have questions regarding public schemes, you can contact our e-Grievance coordinator directly.
              </p>
              <div className="border-t border-blue-800 pt-3 flex flex-col gap-1.5 text-xs text-blue-100 font-medium">
                <span>Coordinator: <strong>Siva Shankaran D.</strong></span>
                <span>Helpline: <strong className="text-white">+91 9361786461</strong></span>
              </div>
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </>
  );
}
