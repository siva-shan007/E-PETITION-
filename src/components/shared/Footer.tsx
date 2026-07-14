'use client';

import React from 'react';
import { Landmark, Phone, Mail, Clock, ShieldAlert } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* MLA Office Info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-white">
              <Landmark className="w-5 h-5 text-blue-400" />
              <span className="font-extrabold text-base tracking-wide">MLA Office e-Grievance Cell</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Making constituency services accessible, transparent, and completely paperless. Every petition submitted is logged directly, audited, and processed by official departments.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Official Government Technology Portal
            </div>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Office Information</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Mon - Sat: 09:30 AM - 05:30 PM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a href="tel:0442345678" className="hover:text-white transition-all">+91 44 2345 6789 (MLA Office)</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a href="mailto:support@mlaoffice.gov.in" className="hover:text-white transition-all">support@mlaoffice.gov.in</a>
              </li>
            </ul>
          </div>

          {/* Guidelines Disclaimers */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Citizen Security Notice</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Citizens are advised that OTP authentication is required for all petition submissions. Please do not share your OTP. For urgent local assistance or emergency situations, please call the official emergency numbers directly.
            </p>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Powered by e-Governance Initiatives © 2026. All rights reserved.
            </div>
          </div>
          
        </div>

        {/* Bottom copyright line */}
        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 e-Petition Constituency Management Portal. Government-grade security verified.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
            <a href="#" className="hover:text-slate-400">Feedback Form</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
