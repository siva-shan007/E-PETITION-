'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAsCitizen: (mobile: string) => Promise<string>; // returns simulated OTP
  verifyCitizenOtp: (mobile: string, otp: string, name: string) => Promise<boolean>;
  loginStaff: (mobile: string, password: string) => Promise<boolean>;
  loginMla: (mobile: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMobile, setPendingMobile] = useState<string | null>(null);
  const [pendingOtp, setPendingOtp] = useState<string | null>(null);

  // Load user from storage on mount
  useEffect(() => {
    const savedUser = sessionStorage.getItem('epetition_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user session', e);
      }
    }
    setIsLoading(false);
  }, []);

  const loginAsCitizen = async (mobile: string): Promise<string> => {
    // Generate a random 6 digit OTP code
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Save temporary OTP and mobile in state and session storage
    setPendingMobile(mobile);
    setPendingOtp(mockOtp);
    try {
      sessionStorage.setItem('pending_citizen_mobile', mobile);
      sessionStorage.setItem('pending_citizen_otp', mockOtp);
    } catch (e) {
      console.warn('Session storage not supported in this environment', e);
    }

    // Dispatches a custom event to the notification logger
    const event = new CustomEvent('simulated_otp', {
      detail: { mobile, otp: mockOtp }
    });
    window.dispatchEvent(event);

    return mockOtp;
  };

  const verifyCitizenOtp = async (mobile: string, otp: string, name: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    let savedOtp = pendingOtp;
    let savedMobile = pendingMobile;

    if (!savedOtp) {
      try {
        savedOtp = sessionStorage.getItem('pending_citizen_otp');
        savedMobile = sessionStorage.getItem('pending_citizen_mobile');
      } catch (e) {
        console.warn('Session storage read failed', e);
      }
    }

    console.log('Verifying OTP:', { savedMobile, mobile, savedOtp, otp, name });

    // Enforce OTP match. If savedMobile matches or session storage is restricted, verify
    if (savedOtp === otp && (savedMobile === mobile || !savedMobile)) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, role: 'CITIZEN', name: name || 'Citizen' })
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setPendingOtp(null);
          setPendingMobile(null);
          try {
            sessionStorage.setItem('epetition_user', JSON.stringify(data.user));
            sessionStorage.removeItem('pending_citizen_otp');
            sessionStorage.removeItem('pending_citizen_mobile');
          } catch (e) {
            console.warn('Failed to persist user session', e);
          }
          return true;
        }
      } catch (e) {
        console.error('API verification request failed', e);
      }
    }

    return false;
  };

  const loginStaff = async (mobile: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password, role: 'STAFF' })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        sessionStorage.setItem('epetition_user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const loginMla = async (mobile: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password, role: 'MLA' })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        sessionStorage.setItem('epetition_user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('epetition_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginAsCitizen,
        verifyCitizenOtp,
        loginStaff,
        loginMla,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
