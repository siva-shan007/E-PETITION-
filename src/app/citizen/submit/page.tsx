'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, ArrowLeft, ArrowRight, Check, MapPin, Upload, X, FileText, User, Phone, CheckCircle, Copy, FileIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import Link from 'next/link';
import confetti from 'canvas-confetti';

const Wards = ['Ward 12', 'Ward 7', 'Ward 15', 'Ward 3', 'Ward 18'];
const Categories = ['Roads & Infrastructure', 'Water Supply', 'Pension', 'Electricity', 'Government Schemes', 'Education', 'Others'];

interface FormState {
  name: string;
  mobile: string;
  ward: string;
  address: string;
  category: string;
  description: string;
  gpsLocation: string;
  documents: { name: string; size: string; type: string; base64?: string }[];
}

export default function SubmitPetition() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();

  // Form State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormState>({
    name: '',
    mobile: '',
    ward: 'Ward 12',
    address: '',
    category: 'Roads & Infrastructure',
    description: '',
    gpsLocation: '',
    documents: []
  });

  const [gpsCapturing, setGpsCapturing] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'CITIZEN')) {
      router.push('/citizen/login');
      return;
    }

    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        mobile: user.mobile || ''
      }));
    }
  }, [user, isAuthenticated, isLoading, router]);

  const categoryLabels: Record<string, string> = {
    'Roads & Infrastructure': t('cat.roads'),
    'Water Supply': t('cat.water'),
    'Pension': t('cat.pension'),
    'Electricity': t('cat.electricity'),
    'Government Schemes': t('cat.schemes'),
    'Education': t('cat.education'),
    'Others': t('cat.others')
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

  // Handle GPS Capture
  const handleCaptureGps = () => {
    setGpsCapturing(true);
    setGpsStatus('IDLE');

    if (!navigator.geolocation) {
      setGpsStatus('ERROR');
      setGpsCapturing(false);
      // Fallback coordinates for demo
      setFormData(prev => ({ ...prev, gpsLocation: '13.0827° N, 80.2707° E' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(4)}° N, ${position.coords.longitude.toFixed(4)}° E`;
        setFormData(prev => ({ ...prev, gpsLocation: coords }));
        setGpsStatus('SUCCESS');
        setGpsCapturing(false);
      },
      (error) => {
        console.warn('Geolocation error, loading fallback coords', error);
        setGpsStatus('ERROR');
        setGpsCapturing(false);
        // Fallback coordination
        setFormData(prev => ({ ...prev, gpsLocation: '13.0827° N, 80.2707° E' }));
      },
      { timeout: 8000 }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    
    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
        setFormData(prev => ({
          ...prev,
          documents: [
            ...prev.documents,
            {
              name: file.name,
              size: sizeStr,
              type: file.type,
              base64: reader.result as string
            }
          ]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (currentStep: number) => {
    const errors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.name.trim()) errors.name = 'Name is required';
      if (!formData.ward) errors.ward = 'Ward selection is required';
      if (!formData.address.trim()) errors.address = 'Residential Address is required';
    }
    if (currentStep === 2) {
      if (!formData.category) errors.category = 'Category is required';
      if (!formData.description.trim()) {
        errors.description = 'Description is required';
      } else if (formData.description.length < 10) {
        errors.description = t('form.description_min_len');
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/petitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          mobile: formData.mobile,
          ward: formData.ward,
          address: formData.address,
          category: formData.category,
          description: formData.description,
          documents: formData.documents.map(d => d.base64 || ''),
          gpsLocation: formData.gpsLocation || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit petition');
      }

      const petition = await response.json();
      setSubmittedId(petition.id);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
    } catch (err) {
      console.error(err);
      alert('Error submitting petition. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Petition ID copied to clipboard!');
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6 select-none text-left">
        
        {/* Back Link */}
        {!submittedId && (
          <Link 
            href="/citizen/dashboard"
            className="flex items-center gap-1.5 text-xs font-bold text-gov-text-muted hover:text-gov-primary transition-all w-max bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        )}

        {/* Success Screen */}
        {submittedId ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 text-center flex flex-col items-center gap-6 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>

            <div className="bg-emerald-50 text-emerald-500 p-4 rounded-full border border-emerald-100 shadow-inner">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('form.success_title')}</h1>
              <p className="text-xs text-gov-text-muted mt-1 leading-relaxed max-w-md mx-auto">
                {t('form.success_desc')}
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 w-full max-w-md flex flex-col gap-3.5">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('form.ref_code')}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-mono font-bold text-gov-primary">{submittedId}</span>
                  <button 
                    onClick={() => copyToClipboard(submittedId)}
                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-650"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">{t('form.name_label')}</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{formData.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">{t('form.mobile_label')}</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">+91 {formData.mobile}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">{t('form.category_label')}</span>
                  <span className="font-bold text-gov-primary mt-0.5 block bg-blue-50 px-2 py-0.5 rounded w-max border border-blue-100">{categoryLabels[formData.category] || formData.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">{t('form.ward_label')}</span>
                  <span className="font-bold text-slate-800 mt-0.5 block truncate">{formData.ward}</span>
                </div>
              </div>

              {formData.gpsLocation && (
                <div className="text-left border-t border-slate-200 pt-3 text-[10px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>{t('form.gps_label')}: <strong className="text-slate-650 font-mono">{formData.gpsLocation}</strong></span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <Link 
                href={`/citizen/track?id=${submittedId}`}
                className="flex-1 bg-gov-primary hover:bg-gov-primary-dark text-white py-3 rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5"
              >
                {t('form.track_flow_btn')}
              </Link>
              <Link 
                href="/citizen/dashboard"
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs border border-slate-200 transition-all flex items-center justify-center"
              >
                {t('nav.help_center')}
              </Link>
            </div>
          </div>
        ) : (
          /* Form Wizard */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gov-primary"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Landmark className="w-5 h-5 text-gov-primary" /> {t('nav.new_petition')}
                </h1>
                <p className="text-xs text-gov-text-muted mt-0.5">{t('nav.subtitle')}</p>
              </div>
              <span className="text-xs font-bold text-gov-primary bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                Step {step} of 3
              </span>
            </div>

            {/* Steps Progress Header Indicator */}
            <div className="flex items-center gap-2 mb-8 select-none">
              {[1, 2, 3].map((num) => (
                <React.Fragment key={num}>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === num 
                        ? 'bg-gov-primary text-white scale-110 shadow' 
                        : step > num 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {step > num ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : num}
                    </span>
                    <span className={`text-[10px] sm:text-xs font-bold ${step === num ? 'text-gov-primary' : step > num ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {num === 1 ? t('form.step2_title') : num === 2 ? t('form.step3_title') : t('form.step5_title')}
                    </span>
                  </div>
                  {num < 3 && <div className={`flex-1 h-0.5 border-t-2 border-dashed ${step > num ? 'border-emerald-500' : 'border-slate-200'}`}></div>}
                </React.Fragment>
              ))}
            </div>

            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">{t('form.name_label')}</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        placeholder={t('form.name_placeholder')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full pl-9 pr-4 py-3 rounded-xl border outline-none text-sm font-semibold transition-all ${
                          formErrors.name ? 'border-red-400' : 'border-slate-200 focus:border-gov-primary focus:ring-1'
                        }`}
                      />
                    </div>
                    {formErrors.name && <span className="text-[10px] text-red-655 font-bold">{formErrors.name}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">{t('form.mobile_label')}</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        disabled
                        value={`+91 ${formData.mobile}`}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-semibold cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">{t('form.ward_label')}</label>
                  <select
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    className={`w-full px-3 py-3 rounded-xl border outline-none text-sm font-semibold bg-white transition-all ${
                      formErrors.ward ? 'border-red-400' : 'border-slate-200 focus:border-gov-primary focus:ring-1'
                    }`}
                  >
                    {Wards.map((w, idx) => (
                      <option key={idx} value={w}>{w}</option>
                    ))}
                  </select>
                  {formErrors.ward && <span className="text-[10px] text-red-655 font-bold">{formErrors.ward}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">{t('form.address_label')}</label>
                  <textarea
                    placeholder={t('form.address_placeholder')}
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full p-3 rounded-xl border outline-none text-sm font-semibold transition-all ${
                      formErrors.address ? 'border-red-400' : 'border-slate-200 focus:border-gov-primary focus:ring-1'
                    }`}
                  />
                  {formErrors.address && <span className="text-[10px] text-red-655 font-bold">{formErrors.address}</span>}
                </div>
              </div>
            )}

            {/* STEP 2: Grievance Details */}
            {step === 2 && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">{t('form.category_label')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3 py-3 rounded-xl border outline-none text-sm font-semibold bg-white transition-all ${
                      formErrors.category ? 'border-red-400' : 'border-slate-200 focus:border-gov-primary focus:ring-1'
                    }`}
                  >
                    {Categories.map((c, idx) => (
                      <option key={idx} value={c}>{categoryLabels[c] || c}</option>
                    ))}
                  </select>
                  {formErrors.category && <span className="text-[10px] text-red-655 font-bold">{formErrors.category}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">{t('form.description_label')}</label>
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">
                      {formData.description.length}/1000 characters
                    </span>
                  </div>
                  <textarea
                    placeholder={t('form.description_placeholder')}
                    rows={5}
                    maxLength={1000}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full p-3 rounded-xl border outline-none text-sm font-semibold transition-all ${
                      formErrors.description ? 'border-red-400' : 'border-slate-200 focus:border-gov-primary focus:ring-1'
                    }`}
                  />
                  {formErrors.description && <span className="text-[10px] text-red-655 font-bold">{formErrors.description}</span>}
                </div>

                {/* Optional GPS Location */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-5 h-5 text-gov-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{t('form.gps_label')}</h4>
                      <p className="text-[10px] text-slate-505 leading-normal mt-0.5">
                        Pinpoint coordinates dynamically for faster processing.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
                    {formData.gpsLocation ? (
                      <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 w-full sm:w-auto justify-center">
                        <Check className="w-3.5 h-3.5" /> {formData.gpsLocation}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCaptureGps}
                        disabled={gpsCapturing}
                        className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {gpsCapturing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-gov-primary" /> ...
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5 text-gov-primary" /> {t('form.gps_fetch')}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Upload Documents & Final Review */}
            {step === 3 && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* Document Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">{t('form.upload_label')}</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-gov-primary/50 transition-all relative">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-700 block">{t('form.upload_desc')}</span>
                  </div>

                  {/* Uploaded File Previews */}
                  {formData.documents.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                      {formData.documents.map((file, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-3 shadow-inner">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {file.type.startsWith('image/') && file.base64 ? (
                              <img src={file.base64} alt="preview" className="w-9 h-9 rounded object-cover flex-shrink-0 border border-slate-200" />
                            ) : (
                              <div className="bg-blue-50 text-gov-primary p-2 rounded flex-shrink-0">
                                <FileIcon className="w-5 h-5" />
                              </div>
                            )}
                            <div className="overflow-hidden leading-tight">
                              <span className="text-xs font-bold text-slate-800 block truncate">{file.name}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex-shrink-0 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Final Summary Card */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                    <h4 className="text-xs font-bold text-slate-700">{t('form.step5_desc')}</h4>
                  </div>
                  <div className="p-4 space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">{t('form.name_label')}</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{formData.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">{t('form.category_label')}</span>
                        <span className="font-bold text-gov-primary mt-0.5 block bg-blue-50 px-2 py-0.5 border border-blue-100 rounded w-max">{categoryLabels[formData.category] || formData.category}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{t('form.ward_label')}</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{formData.ward || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{t('form.address_label')}</span>
                      <span className="font-bold text-slate-800 mt-0.5 block leading-normal">{formData.address || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{t('form.description_label')}</span>
                      <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed mt-0.5">
                        {formData.description || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('form.prev')}
                </button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-gov-primary hover:bg-gov-primary-dark text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  {t('form.next')} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gov-primary hover:bg-gov-primary-dark text-white font-bold px-6 py-3 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer ml-auto disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> ...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-300" /> {t('form.submit')}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
