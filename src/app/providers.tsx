'use client';

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { LanguageProvider } from '../context/LanguageContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AccessibilityProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </AccessibilityProvider>
    </LanguageProvider>
  );
}
