'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, ArrowLeft, Bell, HelpCircle, ChevronDown, ChevronUp, Search, Phone, Calendar, Mail, QrCode, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { Announcement } from '@/types';

export default function HelpCenter() {
  const { language, t } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annSearch, setAnnSearch] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(setAnnouncements)
      .catch(console.error);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const filteredAnnouncements = announcements.filter(ann =>
    ann.title.toLowerCase().includes(annSearch.toLowerCase()) ||
    ann.content.toLowerCase().includes(annSearch.toLowerCase()) ||
    ann.category.toLowerCase().includes(annSearch.toLowerCase())
  );

  const categoryBadges: Record<string, string> = {
    ALERT: 'bg-red-100 text-red-800 border-red-200',
    PUBLIC_MEETING: 'bg-blue-100 text-blue-800 border-blue-200',
    CAMP: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    HOLIDAY: 'bg-amber-100 text-amber-800 border-amber-200',
    GENERAL: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  const FAQs = [
    {
      question: t('help.faq1_q'),
      answer: t('help.faq1_a')
    },
    {
      question: t('help.faq2_q'),
      answer: t('help.faq2_a')
    },
    {
      question: t('help.faq3_q'),
      answer: t('help.faq3_a')
    }
  ];

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 select-none text-left">
        
        {/* Back Link */}
        <Link 
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-gov-text-muted hover:text-gov-primary transition-all w-max bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('form.prev')}
        </Link>

        {/* Hero title */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-gov-primary" /> {t('help.title')}
          </h1>
          <p className="text-xs text-gov-text-muted mt-0.5">{t('help.desc')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: FAQ accordions */}
          <div className="lg:col-span-7 flex flex-col gap-5 text-left">
            <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <HelpCircle className="w-5 h-5 text-gov-primary" /> {t('help.tabs_title')}
            </h2>

            <div className="space-y-3 text-left">
              {FAQs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all hover:border-slate-300"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full px-5 py-4 text-left flex justify-between items-center gap-4 focus:outline-none"
                    >
                      <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                        {faq.question}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-gov-primary flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gov-primary flex-shrink-0" />
                      )}
                    </button>
                    
                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-slate-50 pt-3">
                        <p className="text-xs sm:text-sm text-gov-text-muted leading-relaxed font-semibold">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Flow Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mt-4 flex flex-col gap-4 text-left">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <QrCode className="w-4.5 h-4.5 text-gov-primary" /> Digital Submission Guide
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold leading-normal">
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <span className="bg-blue-50 text-gov-primary px-2 py-0.5 rounded border border-blue-100 font-bold block w-max mb-1 text-[10px]">STEP 1</span>
                  <p className="text-[11px] text-slate-700">Scan entrance QR & input your mobile number to get simulated OTP.</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <span className="bg-blue-50 text-gov-primary px-2 py-0.5 rounded border border-blue-100 font-bold block w-max mb-1 text-[10px]">STEP 2</span>
                  <p className="text-[11px] text-slate-700">Enter code, describe the grievance, choose ward, and upload files.</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <span className="bg-blue-50 text-gov-primary px-2 py-0.5 rounded border border-blue-100 font-bold block w-max mb-1 text-[10px]">STEP 3</span>
                  <p className="text-[11px] text-slate-700">Copy generated ID. Check progress dynamically via Timeline tracking.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Announcement Search & Board */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Announcements Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 text-left">
              <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <Bell className="w-5 h-5 text-gov-primary" /> {t('help.announcements_board')}
              </h2>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={annSearch}
                  onChange={(e) => setAnnSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-gov-primary text-xs font-semibold"
                />
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {filteredAnnouncements.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center font-medium">{t('help.no_announcements')}</p>
                ) : (
                  filteredAnnouncements.map((ann) => (
                    <div 
                      key={ann.id} 
                      className={`border border-slate-200 rounded-xl p-4 flex flex-col gap-2 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all ${
                        !ann.active ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded border uppercase ${categoryBadges[ann.category]}`}>
                          {ann.category}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(ann.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-xs">{ann.title}</h4>
                      <p className="text-[11px] text-gov-text-muted leading-relaxed font-semibold">{ann.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Support Hotline Widget */}
            <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl p-5 shadow-sm flex flex-col gap-3 text-left">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-blue-400" /> General Office Helpline
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                For administrative assistance, physical documents verification, or constituency visits, please contact during official hours.
              </p>
              
              <div className="border-t border-slate-850 pt-3 flex flex-col gap-2 text-xs font-semibold">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <span>+91 9361786461</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>support@mlaoffice.gov.in</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </>
  );
}
