'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, ClipboardCheck, Search, Check, Eye, X, Building, MessageSquare, AlertCircle, FileIcon, User, Phone, MapPin, Loader2, RefreshCw, Paperclip, Calendar, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { Petition, PetitionStatus, Appointment, AppointmentStatus, AppointmentConfig } from '@/types';

const Wards = ['Ward 12', 'Ward 7', 'Ward 15', 'Ward 3', 'Ward 18'];
const Categories = ['Roads & Infrastructure', 'Water Supply', 'Pension', 'Electricity', 'Government Schemes', 'Education', 'Others'];

const Departments = [
  'Municipal Corporation (Water & Sanitation Division)',
  'Public Works Department (PWD - Roads)',
  'Electricity Board (TNEB)',
  'Social Welfare Department (Pension & Welfare)',
  'Metro Water & Sewerage Board',
  'District Industries Center (DIC)',
  'Education Department',
  'Medical & Public Health Department',
  'District Police Department'
];

const Statuses: PetitionStatus[] = ['SUBMITTED', 'VERIFIED', 'UNDER_REVIEW', 'FORWARDED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

interface StaffAnalytics {
  overview: {
    total: number;
    today: number;
    pending: number;
    inProgress: number;
    resolved: number;
    avgResolutionDaysStr: string;
    satisfactionScoreStr: string;
    totalCitizens: number;
    avgResponseTimeStr: string;
  };
  wardStats: { name: string; value: number; }[];
  categoryStats: { name: string; value: number; percent: number; }[];
  statusStats: { name: string; value: number; percent: number; }[];
  dailyStats: { date: string; total: number; resolved: number; pending: number; }[];
  departmentPerformance: {
    dept: string;
    assigned: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rate: number;
  }[];
  activeCampTitle: string;
}

export default function StaffDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();

  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [analytics, setAnalytics] = useState<StaffAnalytics | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'PETITIONS' | 'APPOINTMENTS'>('PETITIONS');

  // Appointments States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [aptActionStatus, setAptActionStatus] = useState<AppointmentStatus>('APPROVED');
  const [aptActionRemarks, setAptActionRemarks] = useState('');
  const [aptRescheduleDate, setAptRescheduleDate] = useState('');
  const [aptRescheduleSlot, setAptRescheduleSlot] = useState('');
  const [aptAllSlots, setAptAllSlots] = useState<string[]>([]);
  const [aptBookedSlotsForDate, setAptBookedSlotsForDate] = useState<string[]>([]);
  const [aptConfig, setAptConfig] = useState<AppointmentConfig | null>(null);
  const [aptDateMessage, setAptDateMessage] = useState('');
  const [aptDateBlocked, setAptDateBlocked] = useState(false);

  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Selected Petition details panel
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  
  // Action form states
  const [actionStatus, setActionStatus] = useState<PetitionStatus>('UNDER_REVIEW');
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionDept, setActionDept] = useState('');
  const [actionPriority, setActionPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [actionInternalRemarks, setActionInternalRemarks] = useState('');
  const [actionPublicRemarks, setActionPublicRemarks] = useState('');
  const [actionUploadedPhotos, setActionUploadedPhotos] = useState<string[]>([]);
  const [updatingAction, setUpdatingAction] = useState(false);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const listRes = await fetch('/api/petitions');
      const list = await listRes.json();
      const petitionsList = Array.isArray(list) ? list : [];
      setPetitions(petitionsList);

      const statsRes = await fetch('/api/analytics');
      const stats = await statsRes.json();
      setAnalytics(stats);

      const aptsRes = await fetch('/api/appointments');
      if (aptsRes.ok) {
        const apts = await aptsRes.json();
        const appointmentsList = Array.isArray(apts) ? apts : [];
        setAppointments(appointmentsList);
        if (selectedAppointment) {
          const updatedApt = appointmentsList.find((a: Appointment) => a.id === selectedAppointment.id);
          if (updatedApt) {
            setSelectedAppointment(updatedApt);
          }
        }
      }

      const configRes = await fetch('/api/appointments/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        setAptConfig(configData.config);
        setAptAllSlots(configData.slots);
      }

      // Keep selected petition updated if open
      if (selectedPetition) {
        const updated = petitionsList.find((p: Petition) => p.id.toUpperCase() === selectedPetition.id.toUpperCase());
        if (updated) {
          setSelectedPetition(updated);
        }
      }
    } catch (e) {
      console.error('Failed to load coordinator data', e);
    } finally {
      setLoadingData(false);
    }
  };

  const checkRescheduleDateAvailability = async (selectedDate: string) => {
    if (!aptConfig) return;
    setAptDateMessage('');
    setAptDateBlocked(false);
    setAptRescheduleSlot('');

    const dateObj = new Date(selectedDate);
    const weekday = dateObj.getDay();

    if (aptConfig.holidays.includes(selectedDate)) {
      setAptDateMessage('Official office holiday.');
      setAptDateBlocked(true);
      return;
    }
    if (aptConfig.weeklyOffDays.includes(weekday)) {
      setAptDateMessage('Office closed on weekends.');
      setAptDateBlocked(true);
      return;
    }
    if (aptConfig.specialBlockedDates.includes(selectedDate)) {
      setAptDateMessage('Date temporarily blocked.');
      setAptDateBlocked(true);
      return;
    }

    try {
      const res = await fetch(`/api/appointments?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        const activeBookings = data.filter((a: Appointment) => ['PENDING', 'APPROVED', 'RESCHEDULED'].includes(a.status));
        const taken = activeBookings.map((a: Appointment) => a.timeSlot);
        setAptBookedSlotsForDate(taken);

        if (activeBookings.length >= aptConfig.dailyLimit) {
          setAptDateMessage('This date is fully booked.');
          setAptDateBlocked(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (aptRescheduleDate && aptConfig) {
        checkRescheduleDateAvailability(aptRescheduleDate);
      } else {
        setAptBookedSlotsForDate([]);
        setAptDateMessage('');
        setAptDateBlocked(false);
        setAptRescheduleSlot('');
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [aptRescheduleDate, aptConfig]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'STAFF')) {
      router.push('/staff/login');
      return;
    }

    const timer = setTimeout(() => {
      loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, isLoading, router]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetition) return;

    setUpdatingAction(true);
    try {
      const response = await fetch(`/api/petitions/${selectedPetition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionStatus,
          remarks: actionRemarks || `Status updated to ${actionStatus}`,
          actor: `${user?.name} (Staff Coordinator)`,
          assignedDept: actionStatus === 'FORWARDED' ? actionDept : undefined,
          priority: actionPriority,
          internalRemarks: actionInternalRemarks,
          publicRemarks: actionPublicRemarks,
          documents: actionUploadedPhotos
        })
      });

      if (response.ok) {
        alert(t('staff.success_alert') || 'Status updated successfully');
        setActionRemarks('');
        setActionUploadedPhotos([]);
        await loadData();
      } else {
        alert('Failed to update action.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating. Check connection.');
    } finally {
      setUpdatingAction(false);
    }
  };

  const openAppointmentDetails = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setAptActionStatus(apt.status === 'PENDING' ? 'APPROVED' : apt.status);
    setAptActionRemarks(apt.remarks || '');
    setAptRescheduleDate(apt.date);
    setAptRescheduleSlot(apt.timeSlot);
  };

  const handleUpdateAppointmentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setUpdatingAction(true);
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: aptActionStatus,
          remarks: aptActionRemarks,
          newDate: aptActionStatus === 'RESCHEDULED' ? aptRescheduleDate : undefined,
          newTimeSlot: aptActionStatus === 'RESCHEDULED' ? aptRescheduleSlot : undefined
        })
      });

      if (response.ok) {
        alert('Appointment status updated successfully!');
        setAptActionRemarks('');
        await loadData();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to update appointment.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating appointment.');
    } finally {
      setUpdatingAction(false);
    }
  };

  const openPetitionDetails = (pet: Petition) => {
    setSelectedPetition(pet);
    setActionStatus(pet.status);
    setActionRemarks('');
    setActionDept(pet.assignedDept || Departments[0]);
    setActionPriority(pet.priority || 'MEDIUM');
    setActionInternalRemarks(pet.internalRemarks || '');
    setActionPublicRemarks(pet.publicRemarks || '');
    setActionUploadedPhotos([]);
  };

  const handleActionPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setActionUploadedPhotos(prev => [...prev, event.target!.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredPetitions = petitions.filter(pet => {
    const matchesSearch = 
      pet.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.mobile.includes(searchQuery) ||
      pet.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesWard = selectedWard ? pet.ward === selectedWard : true;
    const matchesCategory = selectedCategory ? pet.category === selectedCategory : true;
    const matchesStatus = selectedStatus ? pet.status === selectedStatus : true;

    return matchesSearch && matchesWard && matchesCategory && matchesStatus;
  });

  const categoryLabels: Record<string, string> = {
    'Roads & Infrastructure': t('cat.roads'),
    'Water Supply': t('cat.water'),
    'Pension': t('cat.pension'),
    'Electricity': t('cat.electricity'),
    'Government Schemes': t('cat.schemes'),
    'Education': t('cat.education'),
    'Others': t('cat.others')
  };

  const statusColors: Record<string, string> = {
    'SUBMITTED': 'bg-blue-100 text-blue-800 border-blue-200',
    'VERIFIED': 'bg-teal-100 text-teal-800 border-teal-200',
    'UNDER_REVIEW': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'FORWARDED': 'bg-pink-100 text-pink-800 border-pink-200',
    'IN_PROGRESS': 'bg-amber-100 text-amber-800 border-amber-200',
    'RESOLVED': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'CLOSED': 'bg-slate-100 text-slate-800 border-slate-200'
  };

  const statusLabels: Record<PetitionStatus, string> = {
    SUBMITTED: t('status.submitted'),
    VERIFIED: t('status.verified'),
    UNDER_REVIEW: t('status.under_review'),
    FORWARDED: t('status.forwarded'),
    IN_PROGRESS: t('status.in_progress'),
    RESOLVED: t('status.resolved'),
    CLOSED: t('status.closed')
  };

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

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 select-none text-left animate-fade-in">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 text-left">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardCheck className="w-6.5 h-6.5 text-gov-primary" /> {t('nav.staff')}: {user.name}
            </h1>
            <p className="text-xs text-gov-text-muted mt-0.5">{language === 'en' ? 'Manage daily workflows, assign departments, and dispatch resolutions.' : 'தினசரி பணிகளை நிர்வகிக்கவும், துறைகளை ஒதுக்கவும் மற்றும் தீர்வுகளை வழங்கவும்.'}</p>
          </div>
          <button 
            onClick={loadData}
            disabled={loadingData}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer w-max disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} /> {language === 'en' ? 'Refresh Queue' : 'பட்டியலை புதுப்பி'}
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('PETITIONS')}
            className={`pb-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'PETITIONS'
                ? 'border-gov-primary text-gov-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 {language === 'en' ? 'Grievance Petitions Queue' : 'புகார் மனுக்கள்'}
          </button>
          <button
            onClick={() => setActiveTab('APPOINTMENTS')}
            className={`pb-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'APPOINTMENTS'
                ? 'border-gov-primary text-gov-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🗓️ {language === 'en' ? 'Appointments Calendar' : 'சந்திப்புகள் அட்டவணை'}
          </button>
        </div>

        {activeTab === 'PETITIONS' ? (
          <>
            {/* Overview Stat Widgets */}
            {analytics && (
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                  { label: t('dash.total_claims'), value: analytics.overview.total.toString(), color: 'text-blue-600' },
                  { label: t('dash.pending_audit'), value: petitions.filter(p => p.status === 'SUBMITTED').length.toString(), color: 'text-amber-600' },
                  { label: t('dash.under_action'), value: petitions.filter(p => ['VERIFIED', 'UNDER_REVIEW', 'FORWARDED', 'IN_PROGRESS'].includes(p.status)).length.toString(), color: 'text-purple-600' },
                  { label: t('dash.resolved_cases'), value: analytics.overview.resolved.toString(), color: 'text-emerald-600' },
                  { label: t('dash.avg_resolution'), value: analytics.overview.avgResolutionDaysStr, color: 'text-indigo-600' },
                  { label: t('dash.satisfaction'), value: analytics.overview.satisfactionScoreStr, color: 'text-emerald-600' },
                ].map((card, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{card.label}</span>
                    <span className={`text-xl sm:text-2xl font-extrabold block my-1.5 ${card.color}`}>{card.value}</span>
                    <span className="text-[9px] text-slate-400 font-semibold block">Office KPI live</span>
                  </div>
                ))}
              </div>
            )}

            {/* Filter Toolbar & Search */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-405 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder={t('dash.search_filters')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 outline-none text-xs font-semibold focus:border-gov-primary transition-all"
                  />
                </div>
                
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="px-3 py-3 rounded-xl border border-slate-200 outline-none text-xs font-semibold bg-white cursor-pointer"
                >
                  <option value="">{t('dash.all_wards')}</option>
                  {Wards.map((w, idx) => (
                    <option key={idx} value={w}>{w}</option>
                  ))}
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-3 rounded-xl border border-slate-200 outline-none text-xs font-semibold bg-white cursor-pointer"
                >
                  <option value="">{t('dash.all_categories')}</option>
                  {Categories.map((c, idx) => (
                    <option key={idx} value={c}>{categoryLabels[c] || c}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-3 rounded-xl border border-slate-200 outline-none text-xs font-semibold bg-white cursor-pointer"
                >
                  <option value="">{t('dash.all_statuses')}</option>
                  {Statuses.map((s, idx) => (
                    <option key={idx} value={s}>{statusLabels[s] || s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Petitions Queue List & Side details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Main Registry Column */}
              <div className="lg:col-span-7 flex flex-col gap-4 text-left">
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-extrabold text-slate-800 text-sm">{t('dash.backlog_title')} ({filteredPetitions.length})</h3>
                </div>

                {petitions.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">📋</span>
                    <h3 className="text-sm font-bold text-slate-800">{t('dash.no_petitions_title')}</h3>
                    <p className="text-xs text-gov-text-muted mt-1 leading-normal font-semibold">
                      {t('dash.no_petitions_desc')}
                    </p>
                  </div>
                ) : filteredPetitions.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-350" />
                    <p className="text-sm font-semibold">No petitions match the filters</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPetitions.map((pet) => {
                      const isActive = selectedPetition?.id.toUpperCase() === pet.id.toUpperCase();
                      return (
                        <div
                          key={pet.id}
                          onClick={() => openPetitionDetails(pet)}
                          className={`bg-white border rounded-xl p-4 sm:p-5 shadow-sm transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                            isActive ? 'border-gov-primary ring-1 ring-gov-primary' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="absolute left-0 top-0 w-1 h-full bg-slate-900"></div>
                          
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {pet.id}
                              </span>
                              <span className="text-xs font-semibold text-gov-primary bg-blue-50 px-2 py-0.5 rounded-full">
                                {categoryLabels[pet.category] || pet.category}
                              </span>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                pet.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                                pet.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                pet.priority === 'LOW' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {pet.priority || 'MEDIUM'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold">{new Date(pet.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">{t('form.name_label')}</span>
                              <span className="text-slate-800 font-extrabold mt-0.5 block">{pet.name}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">{t('form.ward_label')}</span>
                              <span className="text-slate-850 font-bold mt-0.5 block truncate">{pet.ward}</span>
                            </div>
                          </div>

                          <div className="text-xs">
                            <span className="text-[10px] text-slate-400 font-bold block">{t('form.description_label')}</span>
                            <p className="text-slate-600 font-medium mt-0.5 truncate leading-relaxed">{pet.description}</p>
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-1">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border rounded-full ${statusColors[pet.status] || 'bg-slate-50 text-slate-700'}`}>
                              {statusLabels[pet.status] || pet.status}
                            </span>
                            {pet.assignedDept && (
                              <span className="text-[9px] font-bold text-slate-400 truncate max-w-[200px]">➡️ {pet.assignedDept.split('(')[0]}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action / Details Column */}
              <div className="lg:col-span-5 flex flex-col gap-4 text-left">
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-extrabold text-slate-800 text-sm">{t('staff.details_title')}</h3>
                </div>

                {!selectedPetition ? (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-400 shadow-inner">
                    <span className="text-2xl block mb-2">🔍</span>
                    <p className="text-xs font-bold text-slate-500 leading-normal">
                      {t('staff.select_prompt')}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-5 sticky top-20 text-left">
                    
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-gov-primary bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">{selectedPetition.id}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('track.info_title')}</span>
                    </div>

                    <div className="flex flex-col gap-3.5 text-xs font-semibold">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{t('form.name_label')}</span>
                          <span className="font-extrabold text-slate-800 mt-0.5 block flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {selectedPetition.name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{t('form.mobile_label')}</span>
                          <span className="font-extrabold text-slate-800 mt-0.5 block flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedPetition.mobile}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{t('form.ward_label')}</span>
                          <span className="font-bold text-slate-850 mt-0.5 block truncate">{selectedPetition.ward}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{t('form.category_label')}</span>
                          <span className="font-bold text-gov-primary mt-0.5 block bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded w-max">{categoryLabels[selectedPetition.category] || selectedPetition.category}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{t('form.address_label')}</span>
                        <span className="font-medium text-slate-650 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-normal block mt-1">{selectedPetition.address}</span>
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{t('form.description_label')}</span>
                        <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed mt-1 whitespace-pre-line shadow-inner">{selectedPetition.description}</p>
                      </div>

                      {selectedPetition.gpsLocation && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                          <MapPin className="w-4 h-4 text-gov-primary" /> GPS Location: <span className="font-mono text-slate-800">{selectedPetition.gpsLocation}</span>
                        </div>
                      )}
                    </div>

                    {/* Attachment image preview if present */}
                    {selectedPetition.documents && selectedPetition.documents.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {selectedPetition.documents.map((doc, dIdx) => (
                          doc.startsWith('data:image/') ? (
                            <div key={dIdx} className="rounded-lg border overflow-hidden bg-slate-50 relative group">
                              <img src={doc} alt={`attachment-${dIdx}`} className="w-full h-[80px] object-cover" />
                              <a href={doc} download={`attached-image-${dIdx}`} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[9px] font-bold">
                                Download
                              </a>
                            </div>
                          ) : (
                            <div key={dIdx} className="rounded-lg border bg-slate-50 p-2 flex items-center gap-1.5 text-[9px] text-slate-600 font-semibold truncate">
                              <FileIcon className="w-4 h-4 text-gov-primary" /> Attachment {dIdx + 1}
                            </div>
                          )
                        ))}
                      </div>
                    )}

                    {/* Action log history summary */}
                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">{t('track.timeline_title')}</span>
                      <div className="space-y-2 overflow-y-auto max-h-[110px] pr-0.5">
                        {selectedPetition.history.map((log) => (
                          <div key={log.id} className="bg-slate-50 border border-slate-100 p-2 rounded text-[9px] leading-relaxed">
                            <div className="flex justify-between items-center text-slate-505 font-bold border-b pb-0.5 mb-1">
                              <span>{statusLabels[log.status] || log.status}</span>
                              <span>{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-700 font-semibold">{log.remarks}</p>
                            <span className="text-[8px] text-gov-primary block mt-0.5 font-bold uppercase">{log.actor}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Update Form */}
                    <form onSubmit={handleUpdateStatus} className="border-t border-slate-100 pt-4 flex flex-col gap-4 mt-1 text-left">
                      <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <MessageSquare className="w-4 h-4 text-gov-primary" /> {t('staff.action_title')}
                      </h3>

                      <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">{t('staff.select_status')}</label>
                          <select
                            value={actionStatus}
                            onChange={(e) => setActionStatus(e.target.value as PetitionStatus)}
                            className="w-full px-2 py-1.8 border rounded bg-white cursor-pointer outline-none"
                          >
                            {Statuses.map((s, idx) => (
                              <option key={idx} value={s}>{statusLabels[s] || s}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">Priority Rating</label>
                          <select
                            value={actionPriority}
                            onChange={(e) => setActionPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')}
                            className="w-full px-2 py-1.8 border rounded bg-white cursor-pointer outline-none"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-xs font-semibold">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">Assign Department</label>
                          <select
                            disabled={actionStatus !== 'FORWARDED'}
                            value={actionDept}
                            onChange={(e) => setActionDept(e.target.value)}
                            className="w-full px-2 py-1.8 border rounded bg-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer outline-none truncate"
                          >
                            {Departments.map((d, idx) => (
                              <option key={idx} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Internal Office Remarks (Only Staff/MLA view)</label>
                        <textarea
                          placeholder="Enter internal verification remarks/notes..."
                          rows={2}
                          value={actionInternalRemarks}
                          onChange={(e) => setActionInternalRemarks(e.target.value)}
                          className="w-full p-2 border rounded outline-none text-xs font-semibold"
                        />
                      </div>

                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Public Remarks (Visible to Citizen tracker)</label>
                        <textarea
                          placeholder="Enter resolution notes or public updates visible to the citizen..."
                          rows={2}
                          value={actionPublicRemarks}
                          onChange={(e) => setActionPublicRemarks(e.target.value)}
                          className="w-full p-2 border rounded outline-none text-xs font-semibold"
                        />
                      </div>

                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">{t('staff.remarks_label')} (Timeline audit message)</label>
                        <textarea
                          placeholder={t('staff.remarks_placeholder')}
                          rows={2}
                          required
                          value={actionRemarks}
                          onChange={(e) => setActionRemarks(e.target.value)}
                          className="w-full p-2 border rounded outline-none text-xs font-semibold"
                        />
                      </div>

                      {/* Supporting documents/photos upload */}
                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Attach Supporting Files/Photos</label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center justify-center gap-1.5 bg-slate-50 border border-dashed border-slate-350 p-2.5 rounded-xl text-[10px] font-bold cursor-pointer hover:bg-slate-100 transition-all flex-1 text-center">
                            <Paperclip className="w-3.5 h-3.5 text-slate-505 text-slate-500" />
                            <span>Upload supporting doc</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleActionPhotoUpload}
                              className="hidden"
                            />
                          </label>
                          {actionUploadedPhotos.length > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-250 px-2 py-1 rounded">
                              {actionUploadedPhotos.length} files queued
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={updatingAction}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-1"
                      >
                        {updatingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4 text-emerald-300" />}
                        {t('staff.update_btn')}
                      </button>
                    </form>

                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* APPOINTMENTS VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in text-left">
            {/* Left Panel: Appointments Queue */}
            <div className="lg:col-span-7 flex flex-col gap-4 text-left">
              <h3 className="font-extrabold text-slate-800 text-sm">
                Appointments Registry ({appointments.length})
              </h3>
              
              {appointments.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center gap-2">
                  <Calendar className="w-10 h-10 text-slate-300" />
                  <h3 className="text-sm font-bold text-slate-850">No Appointments Booked Yet</h3>
                  <p className="text-xs text-gov-text-muted mt-1 leading-normal font-semibold">
                    Scheduled meetings will appear here once citizens book them.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => {
                    const isActive = selectedAppointment?.id === apt.id;
                    const statusBadgeClass = (status: string) => {
                      switch (status) {
                        case 'PENDING': return 'bg-amber-50 text-amber-800 border-amber-200';
                        case 'APPROVED': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                        case 'REJECTED': return 'bg-rose-50 text-rose-800 border-rose-200';
                        case 'RESCHEDULED': return 'bg-blue-50 text-blue-800 border-blue-200';
                        case 'CANCELLED': return 'bg-slate-50 text-slate-600 border-slate-200';
                        default: return 'bg-slate-50 border-slate-250';
                      }
                    };
                    return (
                      <div
                        key={apt.id}
                        onClick={() => openAppointmentDetails(apt)}
                        className={`bg-white border rounded-xl p-4 sm:p-5 shadow-sm transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                          isActive ? 'border-gov-primary ring-1 ring-gov-primary' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="absolute left-0 top-0 w-1 h-full bg-slate-900"></div>
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border">
                              {apt.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider uppercase ${statusBadgeClass(apt.status)}`}>
                              {apt.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">
                            Booked: {new Date(apt.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">Citizen Mobile</span>
                            <span className="text-slate-850 font-extrabold mt-0.5 block">{apt.citizenMobile}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">Meeting Date & Slot</span>
                            <span className="text-slate-850 font-extrabold mt-0.5 block flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {apt.date} ({apt.timeSlot})
                            </span>
                          </div>
                        </div>

                        <div className="text-xs">
                          <span className="text-[10px] text-slate-400 font-bold block">Citizen Name</span>
                          <span className="font-bold text-slate-850 mt-0.5 block">{apt.citizenName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Panel: Detailed Appointment Audit & Action Panel */}
            <div className="lg:col-span-5 flex flex-col gap-4 text-left">
              <h3 className="font-extrabold text-slate-800 text-sm">
                Appointment Action Console
              </h3>
              
              {!selectedAppointment ? (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center text-slate-400 shadow-inner">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-350" />
                  <p className="text-xs font-bold text-slate-500 leading-normal">
                    Select an appointment from the list to view details and execute admin actions.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-5 sticky top-20 text-left">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-gov-primary bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                      {selectedAppointment.id}
                    </span>
                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Meeting Details</span>
                  </div>

                  <div className="flex flex-col gap-3.5 text-xs font-semibold text-left">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Citizen Name</span>
                      <span className="font-extrabold text-slate-800 block mt-0.5 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {selectedAppointment.citizenName}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Citizen Mobile</span>
                      <span className="font-extrabold text-slate-800 block mt-0.5 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedAppointment.citizenMobile}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Meeting Date</span>
                        <span className="font-extrabold text-slate-850 block mt-0.5">{selectedAppointment.date}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Time Slot</span>
                        <span className="font-extrabold text-slate-850 block mt-0.5 flex items-center gap-1 truncate">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {selectedAppointment.timeSlot}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Purpose of Meeting</span>
                      <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 whitespace-pre-line leading-relaxed shadow-inner">{selectedAppointment.purpose}</p>
                    </div>

                    {selectedAppointment.remarks && (
                      <div className="bg-blue-50 border border-blue-100 text-blue-900 p-2.5 rounded-lg text-left">
                        <span className="font-bold text-[9px] text-blue-800 block uppercase tracking-wider mb-0.5">Response Notes</span>
                        {selectedAppointment.remarks}
                      </div>
                    )}
                  </div>

                  {/* Actions form */}
                  {['PENDING', 'APPROVED', 'RESCHEDULED'].includes(selectedAppointment.status) && (
                    <form onSubmit={handleUpdateAppointmentStatus} className="border-t border-slate-100 pt-4 flex flex-col gap-4 text-left">
                      <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-gov-primary" /> Update Booking Status
                      </h3>

                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Select Action</label>
                        <select
                          value={aptActionStatus}
                          onChange={(e) => setAptActionStatus(e.target.value as AppointmentStatus)}
                          className="w-full px-2 py-1.8 border rounded bg-white cursor-pointer outline-none"
                        >
                          <option value="APPROVED">Approve Appointment</option>
                          <option value="REJECTED">Reject Appointment</option>
                          <option value="RESCHEDULED">Reschedule Appointment</option>
                          <option value="CANCELLED">Cancel Appointment</option>
                        </select>
                      </div>

                      {/* Rescheduling sub-fields */}
                      {aptActionStatus === 'RESCHEDULED' && (
                        <div className="flex flex-col gap-3.5 border-l-2 border-gov-primary pl-3 py-1 font-semibold text-xs animate-slide-down">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase">New Reschedule Date</label>
                            <input
                              type="date"
                              required
                              min={new Date().toISOString().split('T')[0]}
                              value={aptRescheduleDate}
                              onChange={(e) => setAptRescheduleDate(e.target.value)}
                              className="w-full px-2 py-1 border rounded bg-slate-50 outline-none"
                            />
                          </div>

                          {aptDateMessage && (
                            <div className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded">
                              ⚠️ {aptDateMessage}
                            </div>
                          )}

                          {aptRescheduleDate && !aptDateBlocked && (
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] text-slate-400 font-bold uppercase">Available Time Slots</label>
                              <div className="grid grid-cols-2 gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                                {aptAllSlots.map((slot) => {
                                  const isTaken = aptBookedSlotsForDate.includes(slot);
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      disabled={isTaken}
                                      onClick={() => setAptRescheduleSlot(slot)}
                                      className={`p-1.5 rounded border text-[9px] font-bold transition-all ${
                                        isTaken
                                          ? 'bg-slate-100 text-slate-350 border-slate-200 cursor-not-allowed line-through'
                                          : aptRescheduleSlot === slot
                                          ? 'bg-gov-primary text-white border-gov-primary shadow'
                                          : 'bg-white text-slate-700 border-slate-200 hover:border-gov-primary'
                                      }`}
                                    >
                                      {slot}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Remarks / Notes to Citizen</label>
                        <textarea
                          required
                          placeholder="Provide the reason for approval, rejection, or rescheduling notes..."
                          rows={2.5}
                          value={aptActionRemarks}
                          onChange={(e) => setAptActionRemarks(e.target.value)}
                          className="w-full p-2 border rounded outline-none text-xs font-semibold"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={updatingAction || (aptActionStatus === 'RESCHEDULED' && (aptDateBlocked || !aptRescheduleSlot))}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-1"
                      >
                        {updatingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4 text-emerald-300" />}
                        Submit Appointment Status
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </main>
      
      <Footer />
    </>
  );
}
