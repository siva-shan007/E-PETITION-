export type UserRole = 'CITIZEN' | 'STAFF' | 'MLA';

export interface User {
  id: string;
  mobile: string;
  name?: string;
  role: UserRole;
  password?: string;
  ward?: string;
  createdAt: Date | string;
}

export type PetitionStatus =
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'UNDER_REVIEW'
  | 'FORWARDED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export interface StatusLog {
  id: string;
  petitionId: string;
  status: PetitionStatus;
  remarks?: string;
  actor: string;
  createdAt: Date | string;
}

export interface Petition {
  id: string; // Format: PET-YYYY-XXXXXX
  name: string;
  mobile: string;
  ward: string;
  address: string;
  category: string;
  description: string;
  documents: string[]; // List of base64 files or mocked links
  gpsLocation?: string;
  status: PetitionStatus;
  remarks?: string; // History log/internal audit summary remarks
  internalRemarks?: string; // Staff internal comments
  publicRemarks?: string; // Public response comments
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt?: Date | string; // Date resolved
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedDept?: string;
  history: StatusLog[];
}

export type AnnouncementCategory = 'ALERT' | 'PUBLIC_MEETING' | 'CAMP' | 'HOLIDAY' | 'GENERAL';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  date: Date | string;
  active: boolean;
}

export type NotificationChannel = 'SMS' | 'WHATSAPP' | 'EMAIL';

export interface NotificationLog {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  content: string;
  status: 'SENT' | 'FAILED';
  timestamp: Date | string;
  petitionId: string;
}

export type AppointmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESCHEDULED' | 'CANCELLED';

export interface Appointment {
  id: string; // e.g. APT-XXXXXX
  citizenId: string; // Citizen's unique identifier (e.g. mobile or user id)
  citizenName: string;
  citizenMobile: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "1:00 PM - 1:25 PM"
  purpose: string;
  status: AppointmentStatus;
  remarks?: string; // staff or admin comments/rescheduling reason
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AppointmentConfig {
  dailyLimit: number; // e.g. 12
  startTime: string; // HH:MM 24-hour format
  endTime: string; // HH:MM 24-hour format
  slotDuration: number; // minutes
  bufferTime: number; // minutes
  holidays: string[]; // List of YYYY-MM-DD
  weeklyOffDays: number[]; // Array of weekdays 0=Sunday, 6=Saturday
  specialBlockedDates: string[]; // List of YYYY-MM-DD
}
