'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Landmark, LayoutDashboard, FileText, ListOrdered, Building, Users, BarChart3, 
  Bell, Settings, LogOut, Award, Sparkles, Star, Calendar, StarHalf, Plus, ShieldCheck, Phone, Lock, Trash2, Check, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Petition, User } from '@/types';
import Link from 'next/link';

// Import Recharts
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

const WardsList = ['Ward 12', 'Ward 7', 'Ward 15', 'Ward 3', 'Ward 18'];

interface MlaAnalytics {
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

export default function MlaDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [analytics, setAnalytics] = useState<MlaAnalytics | null>(null);
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'appointments'>('dashboard');

  // Staff creation form states
  const [staffName, setStaffName] = useState('');
  const [staffMobile, setStaffMobile] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffWard, setStaffWard] = useState('Ward 12');
  const [staffList, setStaffList] = useState<User[]>([]);
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffError, setStaffError] = useState('');

  // Appointment Settings Console states
  const [dailyLimit, setDailyLimit] = useState<number>(12);
  const [officeStartTime, setOfficeStartTime] = useState<string>('13:00');
  const [officeEndTime, setOfficeEndTime] = useState<string>('18:00');
  const [slotDuration, setSlotDuration] = useState<number>(25);
  const [bufferTime, setBufferTime] = useState<number>(5);
  const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([0, 6]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [specialBlockedDates, setSpecialBlockedDates] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState<string>('');
  const [newBlockedDate, setNewBlockedDate] = useState<string>('');
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const loadData = async () => {
    try {
      const statsRes = await fetch('/api/analytics');
      const stats = await statsRes.json();
      const listRes = await fetch('/api/petitions');
      const list = await listRes.json();
      const staffRes = await fetch('/api/staff');
      const staffData = await staffRes.json();

      setAnalytics(stats);
      setPetitions(Array.isArray(list) ? list : []);
      setStaffList(Array.isArray(staffData) ? staffData : []);

      const configRes = await fetch('/api/appointments/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        const conf = configData.config;
        setDailyLimit(conf.dailyLimit);
        setOfficeStartTime(conf.officeStartTime);
        setOfficeEndTime(conf.officeEndTime);
        setSlotDuration(conf.slotDuration);
        setBufferTime(conf.bufferTime);
        setWeeklyOffDays(conf.weeklyOffDays || [0, 6]);
        setHolidays(conf.holidays || []);
        setSpecialBlockedDates(conf.specialBlockedDates || []);
      }
    } catch (e) {
      console.error('Failed to load MLA analytics', e);
    }
  };

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'MLA')) {
      router.push('/mla/login');
      return;
    }

    if (mounted) {
      const timer = setTimeout(() => {
        loadData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, isAuthenticated, isLoading, router, mounted]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    if (!staffName.trim() || !staffMobile.trim() || !staffPassword.trim() || !staffWard) {
      setStaffError(t('form.validation_error'));
      return;
    }
    if (staffMobile.length !== 10) {
      setStaffError('Mobile number must be exactly 10 digits.');
      return;
    }

    setAddingStaff(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffName,
          mobile: staffMobile,
          password: staffPassword,
          ward: staffWard
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Staff coordinator added successfully!');
        setStaffName('');
        setStaffMobile('');
        setStaffPassword('');
        // Reload list
        const reloadRes = await fetch('/api/staff');
        const staffData = await reloadRes.json();
        setStaffList(staffData);
      } else {
        setStaffError(data.error || 'Failed to register coordinator.');
      }
    } catch (err) {
      setStaffError('Network error. Please try again.');
    } finally {
      setAddingStaff(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('/api/appointments/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyLimit,
          officeStartTime,
          officeEndTime,
          slotDuration,
          bufferTime,
          weeklyOffDays,
          holidays,
          specialBlockedDates
        })
      });

      if (res.ok) {
        alert('Appointment configuration saved successfully!');
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save configuration.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating configuration.');
    } finally {
      setSavingConfig(false);
    }
  };

  const addHoliday = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newHoliday && !holidays.includes(newHoliday)) {
      setHolidays([...holidays, newHoliday].sort());
      setNewHoliday('');
    }
  };

  const removeHoliday = (date: string) => {
    setHolidays(holidays.filter(h => h !== date));
  };

  const addBlockedDate = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newBlockedDate && !specialBlockedDates.includes(newBlockedDate)) {
      setSpecialBlockedDates([...specialBlockedDates, newBlockedDate].sort());
      setNewBlockedDate('');
    }
  };

  const removeBlockedDate = (date: string) => {
    setSpecialBlockedDates(specialBlockedDates.filter(b => b !== date));
  };

  const toggleWeeklyOff = (day: number) => {
    if (weeklyOffDays.includes(day)) {
      setWeeklyOffDays(weeklyOffDays.filter(d => d !== day));
    } else {
      setWeeklyOffDays([...weeklyOffDays, day]);
    }
  };

  if (isLoading || !user || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="text-center flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
          <span className="text-sm font-semibold text-slate-400">Loading Executive Console...</span>
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

  const statusColors: Record<string, string> = {
    'SUBMITTED': 'bg-blue-100 text-blue-800 border-blue-200',
    'VERIFIED': 'bg-teal-100 text-teal-800 border-teal-200',
    'UNDER_REVIEW': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'FORWARDED': 'bg-pink-100 text-pink-800 border-pink-200',
    'IN_PROGRESS': 'bg-amber-100 text-amber-800 border-amber-200',
    'RESOLVED': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'CLOSED': 'bg-slate-100 text-slate-800 border-slate-200'
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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col justify-between flex-shrink-0 z-10 select-none text-left">
        <div className="flex flex-col gap-6 py-5">
          {/* Sidebar Header */}
          <div className="px-5 flex items-center gap-2.5">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm block">MLA Office</span>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5 tracking-wider">e-Petition Portal</span>
            </div>
          </div>

          {/* Menu routes */}
          <nav className="flex flex-col gap-0.5 px-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> {t('mla.nav_dashboard')}
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" /> {t('mla.nav_coordinators')}
            </button>

            <Link
              href="/staff/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all text-left"
            >
              <FileText className="w-4 h-4" /> {t('dash.backlog_title')}
            </Link>

            <Link
              href="/mla/announcements"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all text-left"
            >
              <Bell className="w-4 h-4" /> {t('mla.nav_announcements')}
            </Link>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'appointments'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" /> {language === 'en' ? 'Appointment Config' : 'சந்திப்பு அமைப்புகள்'}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-all cursor-pointer text-left mt-4"
            >
              <LogOut className="w-4 h-4" /> {t('nav.logout')}
            </button>
          </nav>
        </div>

        {/* Admin Card */}
        <div className="p-4 border-t border-slate-800 bg-[#0b0f19]/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-inner uppercase flex-shrink-0">
              {user.name ? user.name.slice(0, 2) : 'MLA'}
            </div>
            <div className="leading-tight text-left min-w-0">
              <span className="text-xs font-extrabold text-white block truncate" title={user.name}>{user.name}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">MLA Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* DASHBOARD CONTENT AREA */}
      <main className="flex-grow flex flex-col overflow-y-auto">
        
        {/* Content Header */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center shadow-sm select-none text-left">
          <div>
            <h1 className="text-base font-extrabold text-slate-900">
              {activeTab === 'dashboard' ? t('mla.nav_dashboard') : t('mla.nav_coordinators')}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">
              {t('nav.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-gov-primary" /> 
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </header>

        {/* TAB 1: EXECUTIVE ANALYTICS DASHBOARD */}
        {activeTab === 'dashboard' && analytics && (
          <div className="p-6 flex flex-col gap-6 text-left">
            
            {/* ROW 1: METRICS OVERVIEW CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                { label: t('dash.total_claims'), value: analytics.overview.total.toString(), change: 'Registered claims', color: 'text-blue-600' },
                { label: "Today's Petitions", value: analytics.overview.today.toString(), change: 'New entries today', color: 'text-emerald-600' },
                { label: t('dash.pending_audit'), value: analytics.overview.pending.toString(), change: 'Awaiting review', color: 'text-amber-600' },
                { label: t('dash.under_action'), value: analytics.overview.inProgress.toString(), change: 'Active processing', color: 'text-indigo-600' },
                { label: t('dash.resolved_cases'), value: analytics.overview.resolved.toString(), change: 'Successfully resolved', color: 'text-emerald-600' },
                { label: t('dash.avg_resolution'), value: analytics.overview.avgResolutionDaysStr, change: 'Action KPI score', color: 'text-blue-700' }
              ].map((card, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-slate-200"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{card.label}</span>
                  <span className={`text-xl sm:text-2xl font-extrabold block my-2 ${card.color}`}>{card.value}</span>
                  <span className="text-[9px] text-slate-400 font-bold leading-none block">{card.change}</span>
                </div>
              ))}
            </div>

            {/* ROW 2: LINE CHART, CATEGORY PIE, RECENT LIST */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Petitions Trend Line Chart */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4 text-left">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b pb-2 mb-1">{t('mla.chart_trend')}</h3>
                <div className="h-60 w-full text-[10px] font-bold flex items-center justify-center">
                  {analytics.overview.total === 0 ? (
                    <span className="text-slate-400 font-bold">No Data Available</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.dailyStats} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 'bold' }} />
                        <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} />
                        <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, fontWeight: 'bold' }} />
                        <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} name="Total" dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="pending" stroke="#f97316" strokeWidth={2} name="Pending" dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Petitions Category Distribution Pie */}
              <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4 text-left">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b pb-2 mb-1">{t('mla.chart_category')}</h3>
                <div className="h-60 w-full flex items-center justify-center relative">
                  {analytics.overview.total === 0 ? (
                    <span className="text-slate-400 font-bold">No Data Available</span>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.categoryStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {analytics.categoryStats.map((entry: { name: string; value: number; percent: number }, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-extrabold text-slate-900 leading-none">{analytics.overview.total}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recent Petitions List */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4 text-left">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b pb-2 mb-1">Recent Petitions</h3>
                <div className="space-y-3.5 overflow-y-auto max-h-[250px] pr-0.5">
                  {petitions.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                      <ListOrdered className="w-8 h-8 text-slate-300" />
                      <span className="text-xs font-bold">📋 {t('dash.no_petitions_title')}</span>
                      <p className="text-[10px] text-slate-405 font-medium leading-normal px-4">
                        {t('dash.no_petitions_desc')}
                      </p>
                    </div>
                  ) : (
                    petitions.slice(0, 5).map((pet) => (
                      <div key={pet.id} className="flex justify-between items-start gap-3 border-b border-slate-50 pb-2.5 last:border-0 text-left">
                        <div className="flex flex-col gap-1 overflow-hidden">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border">
                              {pet.id}
                            </span>
                            <span className={`text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.2 rounded-lg border ${statusColors[pet.status] || ''}`}>
                              {statusLabels[pet.status] || pet.status}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-850 text-xs mt-0.5 truncate">{pet.description}</h4>
                          <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                            {pet.name} • {pet.ward} • {new Date(pet.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* ROW 3: WARD BAR, DEPT TABLE, STATUS DONUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Petitions by Ward (Top 5) */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4 text-left">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b pb-2 mb-1">{t('mla.chart_ward')}</h3>
                <div className="h-60 w-full text-[10px] font-bold flex items-center justify-center">
                  {analytics.overview.total === 0 ? (
                    <span className="text-slate-400 font-bold">No Data Available</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.wardStats} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 9, fontWeight: 'bold' }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fontWeight: 'bold' }} />
                        <Tooltip contentStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                        <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Department Wise Distribution Table */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4 text-left">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b pb-2 mb-1">{t('mla.dept_perf')}</h3>
                <div className="overflow-x-auto">
                  {analytics.overview.total === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-400 font-bold text-xs">
                      No Data Available
                    </div>
                  ) : (
                    <table className="w-full text-xs font-semibold leading-normal">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase text-left">
                          <th className="pb-2">{t('mla.dept_name')}</th>
                          <th className="pb-2 text-center">Total</th>
                          <th className="pb-2 text-center">Pending</th>
                          <th className="pb-2 text-center">In Progress</th>
                          <th className="pb-2 text-center">Resolved</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analytics.departmentPerformance.map((dept: { dept: string; assigned: number; pending: number; inProgress: number; resolved: number; rate: number }, idx: number) => (
                          <tr key={idx} className="text-left">
                            <td className="py-2.5 font-bold text-slate-805">{dept.dept}</td>
                            <td className="py-2.5 text-center text-slate-700">{dept.assigned}</td>
                            <td className="py-2.5 text-center text-amber-600 font-bold">{dept.pending}</td>
                            <td className="py-2.5 text-center text-indigo-600 font-bold">{dept.inProgress}</td>
                            <td className="py-2.5 text-center text-emerald-600 font-bold">{dept.resolved}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Petition Status Distribution Donut */}
              <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4 text-left">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b pb-2 mb-1">{t('mla.chart_status')}</h3>
                <div className="h-60 w-full flex items-center justify-center relative">
                  {analytics.overview.total === 0 ? (
                    <span className="text-slate-400 font-bold">No Data Available</span>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.statusStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {analytics.statusStats.map((entry: { name: string; value: number; percent: number }, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status split</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* ROW 4: BOTTOM SUMMARY STATS BAR */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-6 text-left items-center select-none">
              
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('dash.satisfaction')}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <strong className="text-base text-slate-850">{analytics.overview.satisfactionScoreStr}</strong>
                  {analytics.overview.total > 0 && (
                    <div className="flex text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 opacity-30" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Most Common Issue</span>
                {analytics.overview.total > 0 ? (
                  <strong className="text-xs text-gov-primary mt-1.5 block bg-blue-50 px-2 py-0.5 border border-blue-100 rounded w-max">
                    {categoryLabels['Roads & Infrastructure']}
                  </strong>
                ) : (
                  <strong className="text-sm text-slate-800 mt-1 block">No Data</strong>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Average Response Time</span>
                <strong className="text-base text-slate-800 mt-1 block">{analytics.overview.avgResponseTimeStr}</strong>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Citizens Registered</span>
                <strong className="text-base text-slate-850 mt-1 block">{analytics.overview.totalCitizens}</strong>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Announcements</span>
                <strong className="text-xs text-slate-800 truncate max-w-xs mt-1 block">
                  {analytics.activeCampTitle}
                </strong>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: STAFF COORDINATORS DIRECTORY */}
        {activeTab === 'staff' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Provision Coordinator Form */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-left">
              <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-gov-primary" /> {t('mla.provision_title')}
              </h3>

              {staffError && (
                <div className="bg-red-50 border border-red-200 text-red-750 text-xs p-3 rounded-lg mt-3 font-semibold">
                  {staffError}
                </div>
              )}

              <form onSubmit={handleAddStaff} className="flex flex-col gap-4 mt-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('mla.staff_name')}</label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-gov-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('mla.staff_mobile')}</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={staffMobile}
                      onChange={(e) => setStaffMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-gov-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('mla.staff_password')}</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-gov-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('mla.staff_ward')}</label>
                  <select
                    value={staffWard}
                    onChange={(e) => setStaffWard(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold bg-white cursor-pointer"
                  >
                    {WardsList.map((w, idx) => (
                      <option key={idx} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={addingStaff}
                  className="bg-gov-primary hover:bg-gov-primary-dark text-white font-bold py-2.5 rounded-xl text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {addingStaff ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {t('mla.staff_btn')}
                </button>
              </form>
            </div>

            {/* Right: Coordinators Directory Listing */}
            <div className="lg:col-span-7 flex flex-col gap-4 text-left">
              <h3 className="font-extrabold text-slate-800 text-sm">{t('mla.staff_list_title')} ({staffList.length})</h3>
              
              {staffList.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center gap-2">
                  <Users className="w-8 h-8 text-slate-300" />
                  <span className="text-xs font-bold">{t('mla.staff_no_users')}</span>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-xs font-semibold leading-normal text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-400 text-[10px] font-bold uppercase">
                        <th className="p-3">{t('mla.staff_name')}</th>
                        <th className="p-3">Mobile No</th>
                        <th className="p-3">{t('mla.staff_ward')}</th>
                        <th className="p-3">Registered Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffList.map((staff) => (
                        <tr key={staff.id}>
                          <td className="p-3 font-bold text-slate-850">{staff.name}</td>
                          <td className="p-3 text-slate-600 font-mono">+91 {staff.mobile}</td>
                          <td className="p-3 text-gov-primary font-bold">{staff.ward}</td>
                          <td className="p-3 text-slate-400">{new Date(staff.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: APPOINTMENT CONFIGURATION MANAGER */}
        {activeTab === 'appointments' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none text-left">
            {/* Left Column: Config Form parameters */}
            <form onSubmit={handleSaveConfig} className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-6 text-left">
              <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 flex items-center gap-1.5">
                <Settings className="w-4.5 h-4.5 text-gov-primary" /> Appointment Constraints Console
              </h3>

              {/* Constraint Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Daily Booking Limit</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(parseInt(e.target.value) || 12)}
                    className="w-full px-2.5 py-2 border rounded outline-none text-slate-800"
                  />
                  <span className="text-[9px] text-slate-405 font-semibold mt-0.5">Maximum bookings permitted per date</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Meeting Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    required
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(parseInt(e.target.value) || 25)}
                    className="w-full px-2.5 py-2 border rounded outline-none text-slate-800"
                  />
                  <span className="text-[9px] text-slate-405 font-semibold mt-0.5">Duration of each individual session</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Session Buffer (Minutes)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    required
                    value={bufferTime}
                    onChange={(e) => setBufferTime(parseInt(e.target.value) || 5)}
                    className="w-full px-2.5 py-2 border rounded outline-none text-slate-800"
                  />
                  <span className="text-[9px] text-slate-405 font-semibold mt-0.5">Time gap between successive meetings</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Start & End Hours</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      required
                      value={officeStartTime}
                      onChange={(e) => setOfficeStartTime(e.target.value)}
                      className="w-full px-2.5 py-1.8 border rounded outline-none text-slate-800 bg-slate-50"
                    />
                    <input
                      type="time"
                      required
                      value={officeEndTime}
                      onChange={(e) => setOfficeEndTime(e.target.value)}
                      className="w-full px-2.5 py-1.8 border rounded outline-none text-slate-800 bg-slate-50"
                    />
                  </div>
                  <span className="text-[9px] text-slate-405 font-semibold mt-0.5">Daily operational meeting hours window</span>
                </div>
              </div>

              {/* Weekly Off Days */}
              <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5 text-xs font-semibold">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Weekly Off Days</label>
                <div className="flex flex-wrap gap-2">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => {
                    const isOff = weeklyOffDays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleWeeklyOff(idx)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                          isOff
                            ? 'bg-gov-primary text-white border-gov-primary shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[9px] text-slate-405 font-medium">Toggle days when the office is closed (typically Saturday/Sunday)</span>
              </div>

              {/* Submit Config */}
              <button
                type="submit"
                disabled={savingConfig}
                className="bg-gov-primary hover:bg-gov-primary-dark text-white font-bold py-2.5 rounded-xl text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
              >
                {savingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Constraints Settings
              </button>
            </form>

            {/* Right Column: Holidays and Blocked Dates lists */}
            <div className="lg:col-span-5 flex flex-col gap-6 text-left">
              
              {/* Holidays Section */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4 text-left">
                <h3 className="font-extrabold text-slate-805 text-xs uppercase tracking-wider border-b pb-2 mb-1">
                  📅 Office Holidays
                </h3>

                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newHoliday}
                    onChange={(e) => setNewHoliday(e.target.value)}
                    className="px-2 py-1.8 border rounded outline-none text-xs font-semibold bg-slate-50 flex-grow"
                  />
                  <button
                    type="button"
                    onClick={addHoliday}
                    className="bg-slate-900 hover:bg-slate-805 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                  {holidays.length === 0 ? (
                    <span className="text-[10px] text-slate-400 font-bold block text-center py-4">No holidays listed.</span>
                  ) : (
                    holidays.map((date) => (
                      <div key={date} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2 rounded-lg text-xs font-bold text-slate-700">
                        <span>{date}</span>
                        <button
                          type="button"
                          onClick={() => removeHoliday(date)}
                          className="text-red-500 hover:text-red-700 font-extrabold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Blocked Dates Section */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4 text-left">
                <h3 className="font-extrabold text-slate-805 text-xs uppercase tracking-wider border-b pb-2 mb-1">
                  🚫 Blocked Dates
                </h3>

                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                    className="px-2 py-1.8 border rounded outline-none text-xs font-semibold bg-slate-50 flex-grow"
                  />
                  <button
                    type="button"
                    onClick={addBlockedDate}
                    className="bg-slate-900 hover:bg-slate-805 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                  >
                    Block
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                  {specialBlockedDates.length === 0 ? (
                    <span className="text-[10px] text-slate-400 font-bold block text-center py-4">No dates blocked.</span>
                  ) : (
                    specialBlockedDates.map((date) => (
                      <div key={date} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2 rounded-lg text-xs font-bold text-slate-700">
                        <span>{date}</span>
                        <button
                          type="button"
                          onClick={() => removeBlockedDate(date)}
                          className="text-red-500 hover:text-red-700 font-extrabold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
