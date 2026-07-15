'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, AlertCircle, CheckCircle, Trash2, Loader2, User, Phone, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { Appointment, AppointmentConfig } from '@/types';
import Link from 'next/link';

export default function CitizenAppointments() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();

  // Booking Form State
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [purpose, setPurpose] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Configuration and Date checks
  const [config, setConfig] = useState<AppointmentConfig | null>(null);
  const [allSlots, setAllSlots] = useState<string[]>([]);
  const [bookedSlotsForDate, setBookedSlotsForDate] = useState<string[]>([]);
  const [dateStatusMessage, setDateStatusMessage] = useState('');
  const [dateIsBlocked, setDateIsBlocked] = useState(false);

  // Citizen's Appointments List
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/appointments/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setAllSlots(data.slots);
      }
    } catch (err) {
      console.error('Failed to load appointment configuration', err);
    }
  };

  const fetchCitizenAppointments = async () => {
    if (!user) return;
    setListLoading(true);
    try {
      const res = await fetch(`/api/appointments?citizenId=${user.mobile}`);
      if (res.ok) {
        const data = await res.json();
        setMyAppointments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch citizen appointments', err);
    } finally {
      setListLoading(false);
    }
  };

  const checkDateAvailability = async (selectedDate: string) => {
    if (!config) return;

    setDateStatusMessage('');
    setDateIsBlocked(false);
    setSelectedSlot('');

    const dateObj = new Date(selectedDate);
    const weekday = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

    // Check holidays
    if (config.holidays.includes(selectedDate)) {
      setDateStatusMessage(language === 'en' ? 'This date is an official holiday.' : 'இந்த தேதி ஒரு அலுவலக விடுமுறை நாளாகும்.');
      setDateIsBlocked(true);
      return;
    }

    // Check weekly off days
    if (config.weeklyOffDays.includes(weekday)) {
      setDateStatusMessage(language === 'en' ? 'Office is closed on weekends.' : 'சனி மற்றும் ஞாயிற்றுக்கிழமைகளில் அலுவலகம் மூடப்படும்.');
      setDateIsBlocked(true);
      return;
    }

    // Check special blocked dates
    if (config.specialBlockedDates.includes(selectedDate)) {
      setDateStatusMessage(language === 'en' ? 'This date is temporarily blocked.' : 'இந்த தேதி தற்காலிகமாக தடுக்கப்பட்டுள்ளது.');
      setDateIsBlocked(true);
      return;
    }

    try {
      const res = await fetch(`/api/appointments?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        const activeBookings = data.filter((a: Appointment) => ['PENDING', 'APPROVED', 'RESCHEDULED'].includes(a.status));
        
        // Find slot timings that are taken
        const taken = activeBookings.map((a: Appointment) => a.timeSlot);
        setBookedSlotsForDate(taken);

        if (activeBookings.length >= config.dailyLimit) {
          setDateStatusMessage(language === 'en' ? 'This date is fully booked. Please choose another available date.' : 'இந்த தேதி முழுமையாக முன்பதிவு செய்யப்பட்டுள்ளது. வேறு தேதியைத் தேர்ந்தெடுக்கவும்.');
          setDateIsBlocked(true);
        }
      }
    } catch (err) {
      console.error('Failed to check date availability', err);
    }
  };

  // Load config & citizen appointments on mount
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'CITIZEN')) {
      router.push('/citizen/login');
      return;
    }

    if (user) {
      const timer = setTimeout(() => {
        fetchConfig();
        fetchCitizenAppointments();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Fetch slots occupancy whenever date changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (date && config) {
        checkDateAvailability(date);
      } else {
        setBookedSlotsForDate([]);
        setDateStatusMessage('');
        setDateIsBlocked(false);
        setSelectedSlot('');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [date, config]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    if (!user) return;
    if (!date || !selectedSlot || !purpose.trim()) {
      setBookingError(language === 'en' ? 'Please complete all required booking fields.' : 'தேவையான அனைத்து விவரங்களையும் நிரப்பவும்.');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId: user.mobile,
          citizenName: user.name || 'Citizen',
          citizenMobile: user.mobile,
          date,
          timeSlot: selectedSlot,
          purpose
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBookingSuccess(language === 'en' ? `Appointment Booked Successfully! ID: ${data.id}` : `சந்திப்பு வெற்றிகரமாக முன்பதிவு செய்யப்பட்டது! ID: ${data.id}`);
        setDate('');
        setSelectedSlot('');
        setPurpose('');
        fetchCitizenAppointments();
      } else {
        setBookingError(data.error || 'Failed to book appointment.');
      }
    } catch (err) {
      setBookingError('Connection error. Please try again.');
    } finally {
      setBookingLoading(false);
    }
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
        fetchCitizenAppointments();
        // If the date currently selected is the one canceled, refresh its slots
        if (date) {
          checkDateAvailability(date);
        }
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

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 h-[80vh]">
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gov-primary" />
          <span className="text-sm font-semibold text-slate-500">Loading citizen profile...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 text-left select-none">
        
        {/* Header section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gov-primary"></div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {language === 'en' ? 'Appointment Redressal Booking' : 'மனுதாரர் சந்திப்பு முன்பதிவு'}
            </h1>
            <p className="text-xs text-gov-text-muted mt-1 font-semibold">
              {language === 'en' ? 'Schedule a meeting with the Hon. MLA or grievance office coordinators.' : 'மாண்புமிகு சட்டமன்ற உறுப்பினர் அல்லது தொகுதி ஒருங்கிணைப்பாளர்களை நேரில் சந்திக்க முன்பதிவு செய்யவும்.'}
            </p>
          </div>
          <Link
            href="/citizen/dashboard"
            className="text-xs font-bold text-gov-primary bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all py-2.5 px-4 rounded-xl shadow-sm"
          >
            {language === 'en' ? 'Back to Dashboard' : 'முகப்பு பலகைக்கு'}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Booking Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-6">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gov-primary" />
              {language === 'en' ? 'Schedule New Appointment' : 'புதிய சந்திப்பு முன்பதிவு'}
            </h3>

            {bookingError && (
              <div className="bg-red-50 border border-red-200 text-red-755 text-xs p-3.5 rounded-xl flex items-start gap-2.5 font-semibold animate-fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {bookingSuccess && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs p-3.5 rounded-xl flex items-start gap-2.5 font-semibold animate-fade-in">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{bookingSuccess}</span>
              </div>
            )}

            <form onSubmit={handleBookAppointment} className="flex flex-col gap-5 text-xs font-semibold text-slate-700">
              
              {/* Date Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  {language === 'en' ? 'Select Date' : 'தேதியைத் தேர்ந்தெடுக்கவும்'}
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="p-3 border border-slate-200 rounded-xl outline-none font-bold text-sm bg-slate-50 focus:border-gov-primary focus:bg-white transition-all w-full"
                />
              </div>

              {/* Date Alert Messages */}
              {dateStatusMessage && (
                <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-start gap-2 ${
                  dateIsBlocked 
                    ? 'bg-rose-50 text-rose-800 border-rose-200' 
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{dateStatusMessage}</span>
                </div>
              )}

              {/* Time Slots Selector */}
              {date && !dateIsBlocked && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {language === 'en' ? 'Select Available Time Slot' : 'நேரத்தைத் தேர்ந்தெடுக்கவும்'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {allSlots.map((slot) => {
                      const isBooked = bookedSlotsForDate.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl border text-center font-bold text-[10px] sm:text-xs transition-all ${
                            isBooked
                              ? 'bg-slate-100 text-slate-350 border-slate-200 cursor-not-allowed line-through'
                              : selectedSlot === slot
                              ? 'bg-gov-primary text-white border-gov-primary shadow'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-gov-primary hover:bg-slate-50'
                          }`}
                        >
                          {slot}
                          {isBooked && ' (Booked)'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Purpose Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  {language === 'en' ? 'Grievance Meeting Purpose / Notes' : 'சந்திப்பிற்கான காரணம் / சுருக்கம்'}
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={language === 'en' ? 'Explain the grievance issue you wish to discuss with the MLA...' : 'சட்டமன்ற உறுப்பினருடன் நீங்கள் விவாதிக்க விரும்பும் பிரச்சினையைப் பற்றி எழுதவும்...'}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="p-3 border border-slate-200 rounded-xl outline-none font-semibold focus:border-gov-primary bg-slate-50 focus:bg-white transition-all text-xs"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={bookingLoading || dateIsBlocked || !selectedSlot}
                className="w-full bg-gov-primary hover:bg-gov-primary-dark text-white font-extrabold py-3.5 rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm mt-2"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === 'en' ? 'Requesting Appointment...' : 'முன்பதிவு செய்யப்படுகிறது...'}
                  </>
                ) : (
                  language === 'en' ? 'Book Appointment' : 'சந்திப்பை உறுதிசெய்'
                )}
              </button>

            </form>
          </div>

          {/* RIGHT COLUMN: Booked List */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-6">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">
              {language === 'en' ? 'My Appointments History' : 'எனது சந்திப்புகள்'}
            </h3>

            {listLoading ? (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <span className="text-xs text-slate-400 font-semibold">Loading history...</span>
              </div>
            ) : myAppointments.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center gap-3.5 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <Calendar className="w-10 h-10 text-slate-300" />
                <div className="text-xs font-semibold text-slate-500">
                  {language === 'en' ? 'No appointments scheduled yet.' : 'உங்களுக்கு எந்த சந்திப்புகளும் முன்பதிவு செய்யப்படவில்லை.'}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
                {myAppointments.map((apt) => (
                  <div key={apt.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-inner relative text-xs">
                    
                    {/* Top Row ID & Status */}
                    <div className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 font-mono">{apt.id}</span>
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getStatusBadgeClass(apt.status)}`}>
                          {apt.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {new Date(apt.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Particulars */}
                    <div className="grid grid-cols-2 gap-4 text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Scheduled Date</span>
                        <span className="font-extrabold text-slate-800 mt-0.5 block">{apt.date}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Time Slot</span>
                        <span className="font-extrabold text-slate-800 mt-0.5 block flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {apt.timeSlot}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Purpose</span>
                      <p className="font-medium text-slate-850 mt-1 leading-normal whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100 shadow-sm">
                        {apt.purpose}
                      </p>
                    </div>

                    {apt.remarks && (
                      <div className="bg-blue-50 border border-blue-100 text-blue-900 p-2.5 rounded-lg font-semibold leading-normal">
                        <span className="font-bold text-[10px] text-blue-800 block uppercase tracking-wider mb-0.5">Admin Response / Remarks</span>
                        {apt.remarks}
                      </div>
                    )}

                    {/* Cancellation Trigger */}
                    {['PENDING', 'APPROVED', 'RESCHEDULED'].includes(apt.status) && (
                      <button
                        type="button"
                        onClick={() => handleCancelAppointment(apt.id)}
                        className="w-max bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 hover:text-rose-800 transition-all font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {language === 'en' ? 'Cancel Appointment' : 'சந்திப்பை ரத்துசெய்'}
                      </button>
                    )}

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
