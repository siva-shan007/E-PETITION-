'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, ArrowLeft, BellPlus, Calendar, Eye, EyeOff, RefreshCw, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { Announcement, AnnouncementCategory } from '@/types';
import Link from 'next/link';

const Categories: AnnouncementCategory[] = ['ALERT', 'PUBLIC_MEETING', 'CAMP', 'HOLIDAY', 'GENERAL'];

export default function AnnouncementManager() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('GENERAL');
  const [publishing, setPublishing] = useState(false);

  const loadAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      const list = await res.json();
      setAnnouncements(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'MLA')) {
      router.push('/mla/login');
      return;
    }

    loadAnnouncements();
  }, [user, isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setPublishing(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create announcement');
      }

      await loadAnnouncements();
      setTitle('');
      setContent('');
      setCategory('GENERAL');
      alert('Announcement published successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to publish announcement.');
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'PUT'
      });
      if (res.ok) {
        await loadAnnouncements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gov-primary"></div>
          <span className="text-sm font-semibold text-slate-650">Verifying session...</span>
        </div>
      </div>
    );
  }

  const categoryLabels: Record<AnnouncementCategory, string> = {
    ALERT: language === 'en' ? 'Emergency Alert' : 'அவசர எச்சரிக்கை',
    PUBLIC_MEETING: language === 'en' ? 'Public Meeting' : 'பொதுக் கூட்டம்',
    CAMP: language === 'en' ? 'Government Welfare Camp' : 'அரசு நலத்திட்ட முகாம்',
    HOLIDAY: language === 'en' ? 'Office Holiday Notice' : 'அலுவலக விடுமுறை அறிவிப்பு',
    GENERAL: language === 'en' ? 'General Update' : 'பொதுவான அறிவிப்பு'
  };

  const categoryBadges: Record<string, string> = {
    ALERT: 'bg-red-100 text-red-800 border-red-200',
    PUBLIC_MEETING: 'bg-blue-100 text-blue-800 border-blue-200',
    CAMP: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    HOLIDAY: 'bg-amber-100 text-amber-800 border-amber-200',
    GENERAL: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 select-none text-left">
        
        {/* Back Link */}
        <Link 
          href="/mla/dashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-gov-text-muted hover:text-gov-primary transition-all w-max bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('form.prev')}
        </Link>

        {/* Title */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-5 text-left">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BellPlus className="w-6.5 h-6.5 text-gov-primary" /> {t('mla.nav_announcements')}
            </h1>
            <p className="text-xs text-gov-text-muted mt-0.5">Post camp announcements, meetings, and updates for constituency citizens.</p>
          </div>
          <button 
            onClick={loadAnnouncements}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer w-max"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload
          </button>
        </div>

        {/* Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Post Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-left">
            <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <BellPlus className="w-4.5 h-4.5 text-gov-primary" /> Publish Announcement
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Eye Testing Camp on Sunday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 outline-none text-xs font-semibold focus:border-gov-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Category Typology</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 outline-none text-xs font-semibold bg-white cursor-pointer"
                >
                  {Categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{categoryLabels[cat] || cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Detailed Message Content</label>
                <textarea
                  placeholder="Type details of the announcement here..."
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 outline-none text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={publishing}
                className="bg-gov-primary hover:bg-gov-primary-dark text-white font-bold py-2.5 rounded-xl text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
              >
                <Send className="w-3.5 h-3.5 text-blue-250" /> {publishing ? '...' : 'Publish'}
              </button>
            </form>
          </div>

          {/* Right Column: Registry lists */}
          <div className="lg:col-span-7 flex flex-col gap-4 text-left">
            <h3 className="font-extrabold text-slate-800 text-sm">Bulletin Registry ({announcements.length})</h3>

            {announcements.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="w-10 h-10 text-slate-350" />
                <p className="text-sm font-semibold">No announcements found</p>
                <p className="text-xs mt-1">Publish your first office update using the editor panel.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {announcements.map((ann) => (
                  <div 
                    key={ann.id} 
                    className={`bg-white border rounded-xl p-4.5 shadow-sm transition-all flex flex-col gap-3 relative overflow-hidden text-left ${
                      !ann.active ? 'border-slate-200 opacity-60 bg-slate-50/50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2.5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded border uppercase ${categoryBadges[ann.category]}`}>
                            {categoryLabels[ann.category] || ann.category}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(ann.date).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-xs mt-1.5">{ann.title}</h4>
                      </div>
                      
                      <button
                        onClick={() => handleToggleStatus(ann.id)}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          ann.active 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {ann.active ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-500" /> Archive
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" /> Activate
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-gov-text-muted leading-relaxed font-semibold">
                      {ann.content}
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-2.5 mt-1">
                      <span>Status: <strong className={ann.active ? 'text-emerald-600' : 'text-slate-550'}>{ann.active ? 'Active' : 'Archived'}</strong></span>
                      <span>ID: {ann.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
