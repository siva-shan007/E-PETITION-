'use client';

import React, { useState } from 'react';
import { Eye, Type, Check, Settings, X } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

export function AccessibilityPanel() {
  const { fontScale, highContrast, toggleHighContrast, setFontScale } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center bg-gov-primary hover:bg-gov-primary-dark text-white p-3 rounded-full shadow-lg border border-white/20 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
        aria-label="Accessibility Settings"
        title="Accessibility Settings"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Settings className="w-6 h-6 animate-spin-slow" />}
      </button>

      {/* Expanded Controls Panel */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 bg-white border border-slate-200 text-slate-900 rounded-xl shadow-2xl p-4 w-72 flex flex-col gap-4 animate-fade-in-up">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-gov-primary">
              <Eye className="w-4 h-4" /> Accessibility Controls
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Constituency Care</span>
          </div>

          {/* High Contrast Mode Toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 block">Visual Mode</label>
            <button
              onClick={toggleHighContrast}
              className={`w-full py-2.5 px-3 rounded-lg border text-left flex items-center justify-between text-sm font-semibold transition-all ${
                highContrast 
                  ? 'bg-slate-950 text-white border-slate-950 font-bold' 
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-950 border border-white flex items-center justify-center text-[10px] text-white font-bold font-mono">C</span>
                High Contrast Black & White
              </span>
              {highContrast && <Check className="w-4 h-4 text-white" />}
            </button>
          </div>

          {/* Font Size Adjuster */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 block">Text Size</label>
            <div className="grid grid-cols-3 gap-1">
              {(['normal', 'large', 'xlarge'] as const).map((scale) => {
                const labels = { normal: 'Normal', large: 'Large (115%)', xlarge: 'Huge (130%)' };
                const sizeClasses = { normal: 'text-xs', large: 'text-sm', xlarge: 'text-base font-bold' };
                const active = fontScale === scale;
                return (
                  <button
                    key={scale}
                    onClick={() => setFontScale(scale)}
                    className={`py-2 px-1 rounded-lg border text-center transition-all ${
                      active
                        ? 'bg-gov-primary text-white border-gov-primary font-bold'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`block ${sizeClasses[scale]}`}>A</span>
                    <span className="text-[10px] opacity-80 block mt-0.5">{scale === 'normal' ? '100%' : scale === 'large' ? '115%' : '130%'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-normal bg-slate-50 p-2 rounded">
            Adjusting text size scales all page contents, inputs, and buttons automatically for comfortable reading.
          </p>
        </div>
      )}
    </div>
  );
}
