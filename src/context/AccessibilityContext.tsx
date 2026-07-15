'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type FontScale = 'normal' | 'large' | 'xlarge';

interface AccessibilityContextType {
  fontScale: FontScale;
  highContrast: boolean;
  toggleHighContrast: () => void;
  setFontScale: (scale: FontScale) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>('normal');
  const [highContrast, setHighContrast] = useState(false);

  const setFontScale = (scale: FontScale) => {
    setFontScaleState(scale);
    localStorage.setItem('access_font_scale', scale);

    // Apply root font-size scaling
    // 'normal' = 16px (100%), 'large' = 19.2px (120%), 'xlarge' = 22.4px (140%)
    if (scale === 'normal') {
      document.documentElement.style.fontSize = '100%';
    } else if (scale === 'large') {
      document.documentElement.style.fontSize = '115%';
    } else if (scale === 'xlarge') {
      document.documentElement.style.fontSize = '130%';
    }
  };

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedScale = localStorage.getItem('access_font_scale') as FontScale;
    const savedContrast = localStorage.getItem('access_high_contrast') === 'true';

    const timer = setTimeout(() => {
      if (savedScale) {
        setFontScale(savedScale);
      }
      if (savedContrast) {
        setHighContrast(savedContrast);
        document.documentElement.classList.add('accessibility-high-contrast');
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const toggleHighContrast = () => {
    const newVal = !highContrast;
    setHighContrast(newVal);
    localStorage.setItem('access_high_contrast', String(newVal));

    if (newVal) {
      document.documentElement.classList.add('accessibility-high-contrast');
    } else {
      document.documentElement.classList.remove('accessibility-high-contrast');
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontScale,
        highContrast,
        toggleHighContrast,
        setFontScale,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
