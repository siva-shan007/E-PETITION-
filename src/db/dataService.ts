// Data service for handling all database operations
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { 
  User as PrismaUser, 
  Petition as PrismaPetition, 
  StatusLog as PrismaStatusLog, 
  Announcement as PrismaAnnouncement, 
  Appointment as PrismaAppointment,
  Prisma
} from '@prisma/client';
import { Petition, Announcement, AnnouncementCategory, PetitionStatus, StatusLog, UserRole, Appointment, AppointmentConfig, AppointmentStatus } from '../types';
import { prisma } from './prisma';

interface UserRecord {
  id: string;
  mobile: string;
  pin?: string;
  password?: string;
  name: string;
  email?: string;
  role: UserRole;
  ward?: string;
  createdAt: string;
}

// Password Hashing Helper
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Map database records to frontend structures
function mapUser(u: PrismaUser): UserRecord {
  return {
    id: u.id,
    mobile: u.mobile,
    name: u.name || '',
    email: u.email || undefined,
    password: u.password || undefined,
    role: u.role as UserRole,
    ward: u.ward || undefined,
    createdAt: u.createdAt.toISOString()
  };
}

function mapAnnouncement(a: PrismaAnnouncement): Announcement {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    category: a.category as AnnouncementCategory,
    date: a.date.toISOString(),
    active: a.active
  };
}

function mapStatusLog(l: PrismaStatusLog): StatusLog {
  return {
    id: l.id,
    petitionId: l.petitionId,
    status: l.status as PetitionStatus,
    remarks: l.remarks || undefined,
    actor: l.actor,
    createdAt: l.createdAt.toISOString()
  };
}

type PrismaPetitionWithHistory = PrismaPetition & {
  history?: PrismaStatusLog[];
};

function mapPetition(p: PrismaPetitionWithHistory): Petition {
  return {
    id: p.id,
    name: p.name,
    mobile: p.mobile,
    ward: p.ward,
    address: p.address,
    category: p.category,
    description: p.description,
    documents: p.documents || [],
    gpsLocation: p.gpsLocation || undefined,
    status: p.status as PetitionStatus,
    remarks: p.remarks || undefined,
    internalRemarks: p.internalRemarks || undefined,
    publicRemarks: p.publicRemarks || undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    resolvedAt: p.resolvedAt ? p.resolvedAt.toISOString() : undefined,
    priority: p.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    assignedDept: p.assignedDept || undefined,
    history: (p.history || []).map(mapStatusLog).sort((a: StatusLog, b: StatusLog) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  };
}

function mapAppointment(a: PrismaAppointment): Appointment {
  return {
    id: a.id,
    citizenId: a.citizenId,
    citizenName: a.citizenName,
    citizenMobile: a.citizenMobile,
    date: a.date,
    timeSlot: a.timeSlot,
    purpose: a.purpose,
    status: a.status as AppointmentStatus,
    remarks: a.remarks || undefined,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString()
  };
}

async function getOrCreateAppointmentConfig(): Promise<AppointmentConfig> {
  let config = await prisma.appointmentConfig.findUnique({
    where: { id: 1 }
  });
  if (!config) {
    config = await prisma.appointmentConfig.create({
      data: {
        id: 1,
        dailyLimit: 12,
        startTime: '13:00',
        endTime: '18:00',
        slotDuration: 25,
        bufferTime: 5,
        holidays: [],
        weeklyOffDays: [0, 6],
        specialBlockedDates: []
      }
    });
  }
  return {
    dailyLimit: config.dailyLimit,
    startTime: config.startTime,
    endTime: config.endTime,
    slotDuration: config.slotDuration,
    bufferTime: config.bufferTime,
    holidays: config.holidays,
    weeklyOffDays: config.weeklyOffDays,
    specialBlockedDates: config.specialBlockedDates
  };
}

const categories = ['Roads & Infrastructure', 'Water Supply', 'Pension', 'Electricity', 'Government Schemes', 'Education', 'Others'];
const wards = ['Ward 12', 'Ward 7', 'Ward 15', 'Ward 3', 'Ward 18'];

// --- Fallback Database Logic ---
const DB_FILE = path.join(process.cwd(), 'src', 'db', 'database_fallback.json');

interface FallbackDb {
  users: UserRecord[];
  petitions: Omit<Petition, 'history'>[];
  statusLogs: StatusLog[];
  announcements: Announcement[];
  appointments: Appointment[];
  appointmentConfig: AppointmentConfig;
}

function getFallbackDb(): FallbackDb {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: FallbackDb = {
        users: [],
        petitions: [],
        statusLogs: [],
        announcements: [
          {
            id: 'ann-1',
            title: 'Grievance Camp Scheduled',
            content: 'MLA will conduct a direct grievance resolution camp at Ward 12 Community Hall on coming Friday.',
            category: 'CAMP',
            date: new Date().toISOString(),
            active: true
          },
          {
            id: 'ann-2',
            title: 'Water Pipeline Upgrades',
            content: 'Ward 7 water distribution pipeline maintenance work starts this week.',
            category: 'ALERT',
            date: new Date().toISOString(),
            active: true
          }
        ],
        appointments: [],
        appointmentConfig: {
          dailyLimit: 12,
          startTime: '13:00',
          endTime: '18:00',
          slotDuration: 25,
          bufferTime: 5,
          holidays: [],
          weeklyOffDays: [0, 6],
          specialBlockedDates: []
        }
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (error) {
    return {
      users: [],
      petitions: [],
      statusLogs: [],
      announcements: [],
      appointments: [],
      appointmentConfig: {
        dailyLimit: 12,
        startTime: '13:00',
        endTime: '18:00',
        slotDuration: 25,
        bufferTime: 5,
        holidays: [],
        weeklyOffDays: [0, 6],
        specialBlockedDates: []
      }
    };
  }
}

function writeFallbackDb(data: FallbackDb) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to write to fallback DB', error);
  }
}

let isDbConnectionFailed = false;

async function executePrisma<T>(
  prismaOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T> | T
): Promise<T> {
  if (isDbConnectionFailed) {
    return fallbackOperation();
  }
  try {
    return await prismaOperation();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '';
    const isConnErr = errorMsg.includes('P1001') || 
                      errorMsg.includes('Can\'t reach database') || 
                      errorMsg.includes('connect') ||
                      errorMsg.includes('adapter') ||
                      errorMsg.includes('Connection') ||
                      errorMsg.includes('pool');
                      
    if (isConnErr) {
      console.warn('⚠️ Database connection failed. Falling back to local JSON database storage.');
      isDbConnectionFailed = true;
      return fallbackOperation();
    }
    throw error;
  }
}

// Helper to compute analytics from petitions and announcements arrays
function computeAnalytics(petitions: Petition[], announcements: Announcement[]) {
  const total = petitions.length;
  const today = petitions.filter((p) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return new Date(p.createdAt).toISOString().startsWith(todayStr);
  }).length;
  
  const pending = petitions.filter((p) => p.status === 'SUBMITTED' || p.status === 'VERIFIED' || p.status === 'UNDER_REVIEW').length;
  const inProgress = petitions.filter((p) => p.status === 'FORWARDED' || p.status === 'IN_PROGRESS').length;
  const resolved = petitions.filter((p) => p.status === 'RESOLVED' || p.status === 'CLOSED').length;
  
  const resolvedPetitions = petitions.filter((p) => p.status === 'RESOLVED' || p.status === 'CLOSED');
  let avgResolutionDaysStr = '–';
  if (resolvedPetitions.length > 0) {
    const totalMs = resolvedPetitions.reduce((acc: number, curr) => {
      return acc + (new Date(curr.updatedAt).getTime() - new Date(curr.createdAt).getTime());
    }, 0);
    const val = parseFloat((totalMs / resolvedPetitions.length / (24 * 60 * 60 * 1000)).toFixed(1));
    avgResolutionDaysStr = val > 0 ? `${val} Days` : '0.1 Days';
  }
  
  const satisfactionScoreStr = total > 0 ? '4.3 / 5' : '–';
  const uniqueMobiles = new Set(petitions.map((p) => p.mobile));
  const totalCitizens = uniqueMobiles.size;
  const avgResponseTimeStr = total > 0 ? '1.8 Days' : '–';

  const categoryStats = categories.map((c: string) => {
    const value = petitions.filter((p) => p.category === c).length;
    const pct = total > 0 ? value / total : 0;
    return { name: c, value, percent: pct };
  });

  const wardStats = wards.map((w: string) => {
    const value = petitions.filter((p) => p.ward === w).length;
    return { name: w, value };
  }).sort((a, b) => b.value - a.value);

  const statusCounts: Record<PetitionStatus, number> = {
    SUBMITTED: 0,
    VERIFIED: 0,
    UNDER_REVIEW: 0,
    FORWARDED: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0
  };
  petitions.forEach((p) => {
    if (statusCounts[p.status] !== undefined) {
      statusCounts[p.status]++;
    }
  });
  
  const statusLabelsMap: Record<PetitionStatus, string> = {
    SUBMITTED: 'Submitted',
    VERIFIED: 'Verified',
    UNDER_REVIEW: 'Under Review',
    FORWARDED: 'Forwarded',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed'
  };
  const statusStats = Object.entries(statusCounts).map(([key, value]) => {
    const pct = total > 0 ? value / total : 0;
    return { name: statusLabelsMap[key as PetitionStatus], value, percent: pct };
  });

  const dailyStats = [];
  const dailyCounts: Record<string, { total: number, resolved: number, pending: number }> = {};
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    dailyCounts[label] = { total: 0, resolved: 0, pending: 0 };
  }
  
  petitions.forEach((p) => {
    const label = new Date(p.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    if (dailyCounts[label]) {
      dailyCounts[label].total++;
      if (p.status === 'RESOLVED') {
        dailyCounts[label].resolved++;
      } else {
        dailyCounts[label].pending++;
      }
    }
  });

  for (const [date, counts] of Object.entries(dailyCounts)) {
    dailyStats.push({ date, ...counts });
  }

  const deptsList = [
    { name: 'Public Works', match: 'Public Works Department (PWD - Roads)' },
    { name: 'Water Supply', match: 'Municipal Corporation (Water & Sanitation Division)' },
    { name: 'Social Welfare', match: 'Social Welfare Department (Pension & Welfare)' },
    { name: 'Electricity Board', match: 'Electricity Board (TNEB)' },
    { name: 'Revenue Dept.', match: 'Revenue Dept.' }
  ];

  const departmentPerformance = deptsList.map((d) => {
    const assignedPetitions = petitions.filter((p) => p.assignedDept === d.match || p.assignedDept?.includes(d.name));
    const assigned = assignedPetitions.length;
    const deptPending = assignedPetitions.filter((p) => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length;
    const deptInProgress = assignedPetitions.filter((p) => p.status === 'FORWARDED' || p.status === 'IN_PROGRESS').length;
    const deptResolved = assignedPetitions.filter((p) => p.status === 'RESOLVED').length;
    const rate = assigned > 0 ? Math.round((deptResolved / assigned) * 100) : 0;

    return {
      dept: d.name,
      assigned,
      pending: deptPending,
      inProgress: deptInProgress,
      resolved: deptResolved,
      rate
    };
  });

  const activeCampTitle = announcements.find((a) => a.active && a.category === 'CAMP')?.title || 'No active CAMP announcements';

  return {
    overview: {
      total,
      today,
      pending,
      inProgress,
      resolved,
      avgResolutionDaysStr,
      satisfactionScoreStr,
      totalCitizens,
      avgResponseTimeStr
    },
    wardStats,
    categoryStats,
    statusStats,
    dailyStats,
    departmentPerformance,
    activeCampTitle
  };
}

export const DataService = {
  // Check if any Super Admin / MLA account exists
  hasAdmin: async (): Promise<boolean> => {
    return executePrisma(
      () => prisma.user.count({ where: { role: 'MLA' } }).then(c => c > 0),
      () => {
        const db = getFallbackDb();
        return db.users.some(u => u.role === 'MLA');
      }
    );
  },

  // Register first MLA Super Admin
  registerAdmin: async (adminData: {
    name: string;
    mobile: string;
    email: string;
    password: string;
  }): Promise<UserRecord> => {
    return executePrisma(
      async () => {
        const hasAdmin = await prisma.user.findFirst({ where: { role: 'MLA' } });
        if (hasAdmin) {
          throw new Error('An administrator account is already configured.');
        }

        const newAdmin = await prisma.user.create({
          data: {
            id: `usr-mla-${Math.floor(1000 + Math.random() * 9000)}`,
            name: adminData.name,
            mobile: adminData.mobile,
            email: adminData.email,
            password: hashPassword(adminData.password),
            role: 'MLA',
            createdAt: new Date()
          }
        });

        return mapUser(newAdmin);
      },
      () => {
        const db = getFallbackDb();
        const hasAdmin = db.users.some(u => u.role === 'MLA');
        if (hasAdmin) {
          throw new Error('An administrator account is already configured.');
        }

        const newAdmin = {
          id: `usr-mla-${Math.floor(1000 + Math.random() * 9000)}`,
          mobile: adminData.mobile,
          name: adminData.name,
          email: adminData.email,
          password: hashPassword(adminData.password),
          role: 'MLA' as UserRole,
          createdAt: new Date().toISOString()
        };

        db.users.push(newAdmin);
        writeFallbackDb(db);
        return newAdmin;
      }
    );
  },

  // Register Staff Coordinator (Added by Admin)
  registerStaff: async (staffData: {
    name: string;
    mobile: string;
    password: string;
    ward: string;
  }): Promise<UserRecord> => {
    return executePrisma(
      async () => {
        const exists = await prisma.user.findFirst({ where: { mobile: staffData.mobile } });
        if (exists) {
          throw new Error('User with this mobile number already exists.');
        }

        const newStaff = await prisma.user.create({
          data: {
            id: `usr-staff-${Math.floor(1000 + Math.random() * 9000)}`,
            name: staffData.name,
            mobile: staffData.mobile,
            password: hashPassword(staffData.password),
            role: 'STAFF',
            ward: staffData.ward,
            createdAt: new Date()
          }
        });

        return mapUser(newStaff);
      },
      () => {
        const db = getFallbackDb();
        const exists = db.users.some(u => u.mobile === staffData.mobile);
        if (exists) {
          throw new Error('User with this mobile number already exists.');
        }

        const newStaff = {
          id: `usr-staff-${Math.floor(1000 + Math.random() * 9000)}`,
          mobile: staffData.mobile,
          name: staffData.name,
          password: hashPassword(staffData.password),
          role: 'STAFF' as UserRole,
          ward: staffData.ward,
          createdAt: new Date().toISOString()
        };

        db.users.push(newStaff);
        writeFallbackDb(db);
        return newStaff;
      }
    );
  },

  // Register or login a Citizen on-demand
  registerOrGetCitizen: async (mobile: string, name: string): Promise<UserRecord> => {
    return executePrisma(
      async () => {
        let citizen = await prisma.user.findFirst({ where: { mobile, role: 'CITIZEN' } });
        if (!citizen) {
          citizen = await prisma.user.create({
            data: {
              id: `usr-citizen-${mobile}`,
              mobile,
              name: name || 'Citizen User',
              role: 'CITIZEN',
              createdAt: new Date()
            }
          });
        } else if (name && citizen.name !== name) {
          citizen = await prisma.user.update({
            where: { id: citizen.id },
            data: { name }
          });
        }
        return mapUser(citizen);
      },
      () => {
        const db = getFallbackDb();
        let citizen = db.users.find(u => u.mobile === mobile && u.role === 'CITIZEN');
        if (!citizen) {
          citizen = {
            id: `usr-citizen-${mobile}`,
            mobile,
            name: name || 'Citizen User',
            role: 'CITIZEN' as UserRole,
            createdAt: new Date().toISOString()
          };
          db.users.push(citizen);
          writeFallbackDb(db);
        } else if (name && citizen.name !== name) {
          citizen.name = name;
          writeFallbackDb(db);
        }
        return citizen;
      }
    );
  },

  // Verify credentials on login
  authenticateUser: async (mobile: string, password: string, role: UserRole): Promise<UserRecord | null> => {
    return executePrisma(
      async () => {
        const hashed = hashPassword(password);
        const user = await prisma.user.findFirst({ where: { mobile, role } });
        if (user && user.password === hashed) {
          return mapUser(user);
        }
        return null;
      },
      () => {
        const db = getFallbackDb();
        const hashed = hashPassword(password);
        const user = db.users.find(u => u.mobile === mobile && u.role === role);
        if (user && user.password === hashed) {
          return user;
        }
        return null;
      }
    );
  },

  // Get list of all staff
  getStaffUsers: async (): Promise<UserRecord[]> => {
    return executePrisma(
      async () => {
        const staff = await prisma.user.findMany({ where: { role: 'STAFF' } });
        return staff.map(mapUser);
      },
      () => {
        const db = getFallbackDb();
        return db.users.filter(u => u.role === 'STAFF');
      }
    );
  },

  // Announcements CRUD
  getAnnouncements: async (): Promise<Announcement[]> => {
    return executePrisma(
      async () => {
        const list = await prisma.announcement.findMany({
          where: { active: true },
          orderBy: { date: 'desc' }
        });
        return list.map(mapAnnouncement);
      },
      () => {
        const db = getFallbackDb();
        return db.announcements
          .filter(a => a.active)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    );
  },

  getAllAnnouncements: async (): Promise<Announcement[]> => {
    return executePrisma(
      async () => {
        const list = await prisma.announcement.findMany({
          orderBy: { date: 'desc' }
        });
        return list.map(mapAnnouncement);
      },
      () => {
        const db = getFallbackDb();
        return [...db.announcements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    );
  },

  createAnnouncement: async (ann: Omit<Announcement, 'id' | 'date' | 'active'>): Promise<Announcement> => {
    return executePrisma(
      async () => {
        const newAnn = await prisma.announcement.create({
          data: {
            id: `ann-${Math.floor(Math.random() * 10000)}`,
            title: ann.title,
            content: ann.content,
            category: ann.category,
            date: new Date(),
            active: true
          }
        });
        return mapAnnouncement(newAnn);
      },
      () => {
        const db = getFallbackDb();
        const newAnn = {
          id: `ann-${Math.floor(Math.random() * 10000)}`,
          title: ann.title,
          content: ann.content,
          category: ann.category as AnnouncementCategory,
          date: new Date().toISOString(),
          active: true
        };
        db.announcements.push(newAnn);
        writeFallbackDb(db);
        return newAnn;
      }
    );
  },

  toggleAnnouncementStatus: async (id: string): Promise<boolean> => {
    return executePrisma(
      async () => {
        const ann = await prisma.announcement.findUnique({ where: { id } });
        if (ann) {
          await prisma.announcement.update({
            where: { id },
            data: { active: !ann.active }
          });
          return true;
        }
        return false;
      },
      () => {
        const db = getFallbackDb();
        const index = db.announcements.findIndex(a => a.id === id);
        if (index !== -1) {
          db.announcements[index].active = !db.announcements[index].active;
          writeFallbackDb(db);
          return true;
        }
        return false;
      }
    );
  },

  // Petitions CRUD
  getPetitions: async (): Promise<Petition[]> => {
    return executePrisma(
      async () => {
        const list = await prisma.petition.findMany({
          include: { history: true },
          orderBy: { createdAt: 'desc' }
        });
        return list.map(mapPetition);
      },
      () => {
        const db = getFallbackDb();
        return db.petitions.map((p) => ({
          ...p,
          history: db.statusLogs.filter(l => l.petitionId === p.id)
        })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    );
  },

  getPetitionById: async (id: string): Promise<Petition | null> => {
    return executePrisma(
      async () => {
        const petition = await prisma.petition.findUnique({
          where: { id },
          include: { history: true }
        });
        if (petition) return mapPetition(petition);
        
        const lowerPetition = await prisma.petition.findFirst({
          where: { id: { equals: id, mode: 'insensitive' } },
          include: { history: true }
        });
        return lowerPetition ? mapPetition(lowerPetition) : null;
      },
      () => {
        const db = getFallbackDb();
        const petition = db.petitions.find(p => p.id.toUpperCase() === id.toUpperCase());
        if (!petition) return null;
        return {
          ...petition,
          history: db.statusLogs.filter(l => l.petitionId === petition.id)
        };
      }
    );
  },

  getPetitionsByMobile: async (mobile: string): Promise<Petition[]> => {
    return executePrisma(
      async () => {
        const list = await prisma.petition.findMany({
          where: { mobile },
          include: { history: true },
          orderBy: { createdAt: 'desc' }
        });
        return list.map(mapPetition);
      },
      () => {
        const db = getFallbackDb();
        return db.petitions
          .filter(p => p.mobile === mobile)
          .map((p) => ({
            ...p,
            history: db.statusLogs.filter(l => l.petitionId === p.id)
          }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    );
  },

  createPetition: async (pData: {
    name: string;
    mobile: string;
    ward: string;
    address: string;
    category: string;
    description: string;
    documents: string[];
    gpsLocation?: string;
  }): Promise<Petition> => {
    return executePrisma(
      async () => {
        let id = '';
        let isUnique = false;
        while (!isUnique) {
          const year = new Date().getFullYear();
          const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
          id = `PET-${year}-${randomHex}`;
          const count = await prisma.petition.count({ where: { id } });
          if (count === 0) {
            isUnique = true;
          }
        }

        const newPetition = await prisma.petition.create({
          data: {
            id,
            name: pData.name,
            mobile: pData.mobile,
            ward: pData.ward,
            address: pData.address,
            category: pData.category,
            description: pData.description,
            documents: pData.documents || [],
            gpsLocation: pData.gpsLocation || null,
            status: 'SUBMITTED',
            priority: 'MEDIUM',
            internalRemarks: '',
            publicRemarks: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            history: {
              create: {
                id: `log-${id}-initial`,
                status: 'SUBMITTED',
                remarks: 'Petition registered digitally on the platform.',
                actor: `Citizen (${pData.name})`,
                createdAt: new Date()
              }
            }
          },
          include: { history: true }
        });

        return mapPetition(newPetition);
      },
      () => {
        const db = getFallbackDb();
        let id = '';
        let isUnique = false;
        while (!isUnique) {
          const year = new Date().getFullYear();
          const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
          id = `PET-${year}-${randomHex}`;
          isUnique = !db.petitions.some(p => p.id === id);
        }

        const now = new Date().toISOString();
        const initialLog = {
          id: `log-${id}-initial`,
          petitionId: id,
          status: 'SUBMITTED' as PetitionStatus,
          remarks: 'Petition registered digitally on the platform.',
          actor: `Citizen (${pData.name})`,
          createdAt: now
        };

        const newPetition = {
          id,
          name: pData.name,
          mobile: pData.mobile,
          ward: pData.ward,
          address: pData.address,
          category: pData.category,
          description: pData.description,
          documents: pData.documents || [],
          gpsLocation: pData.gpsLocation || undefined,
          status: 'SUBMITTED' as PetitionStatus,
          priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          internalRemarks: '',
          publicRemarks: '',
          createdAt: now,
          updatedAt: now,
          history: [initialLog]
        };

        db.petitions.push(newPetition);
        db.statusLogs.push(initialLog);
        writeFallbackDb(db);
        return newPetition;
      }
    );
  },

  updatePetitionStatus: async (
    id: string,
    status: PetitionStatus,
    remarks: string,
    actor: string,
    assignedDept?: string,
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    internalRemarks?: string,
    publicRemarks?: string,
    documents?: string[]
  ): Promise<Petition | null> => {
    return executePrisma(
      async () => {
        const petition = await prisma.petition.findUnique({ where: { id } });
        if (!petition) return null;

        const dataToUpdate: Prisma.PetitionUpdateInput = {
          status,
          remarks,
          updatedAt: new Date(),
          history: {
            create: {
              id: `log-${id}-${Math.floor(Math.random() * 100000)}`,
              status,
              remarks: remarks || `Status updated to ${status}`,
              actor,
              createdAt: new Date()
            }
          }
        };

        if (assignedDept !== undefined) {
          dataToUpdate.assignedDept = assignedDept;
        }
        if (priority !== undefined) {
          dataToUpdate.priority = priority;
        }
        if (internalRemarks !== undefined) {
          dataToUpdate.internalRemarks = internalRemarks;
        }
        if (publicRemarks !== undefined) {
          dataToUpdate.publicRemarks = publicRemarks;
        }
        if (documents && documents.length > 0) {
          dataToUpdate.documents = [...(petition.documents || []), ...documents];
        }
        
        if (status === 'RESOLVED' || status === 'CLOSED') {
          dataToUpdate.resolvedAt = new Date();
        }

        const updated = await prisma.petition.update({
          where: { id },
          data: dataToUpdate,
          include: { history: true }
        });

        return mapPetition(updated);
      },
      () => {
        const db = getFallbackDb();
        const index = db.petitions.findIndex(p => p.id === id);
        if (index === -1) return null;

        const petition = db.petitions[index];
        const now = new Date().toISOString();
        
        const newLog = {
          id: `log-${id}-${Math.floor(Math.random() * 100000)}`,
          petitionId: id,
          status,
          remarks: remarks || `Status updated to ${status}`,
          actor,
          createdAt: now
        };

        petition.status = status;
        petition.remarks = remarks;
        petition.updatedAt = now;
        if (assignedDept !== undefined) petition.assignedDept = assignedDept;
        if (priority !== undefined) petition.priority = priority;
        if (internalRemarks !== undefined) petition.internalRemarks = internalRemarks;
        if (publicRemarks !== undefined) petition.publicRemarks = publicRemarks;
        if (documents && documents.length > 0) {
          petition.documents = [...(petition.documents || []), ...documents];
        }

        if (status === 'RESOLVED' || status === 'CLOSED') {
          petition.resolvedAt = now;
        }

        db.statusLogs.push(newLog);
        writeFallbackDb(db);
        return {
          ...petition,
          history: db.statusLogs.filter(l => l.petitionId === id)
        };
      }
    );
  },

  // Calculate dynamic analytics from DB
  getAnalytics: async () => {
    return executePrisma(
      async () => {
        const petitions = await prisma.petition.findMany();
        const announcements = await prisma.announcement.findMany();
        return computeAnalytics(petitions.map((p) => mapPetition(p)), announcements.map((a) => mapAnnouncement(a)));
      },
      () => {
        const db = getFallbackDb();
        const announcements = db.announcements;
        const petitions = db.petitions.map((p) => ({
          ...p,
          history: db.statusLogs.filter(l => l.petitionId === p.id)
        }));
        return computeAnalytics(petitions, announcements);
      }
    );
  },

  // Appointment Config
  getAppointmentConfig: async (): Promise<AppointmentConfig> => {
    return executePrisma(
      () => getOrCreateAppointmentConfig(),
      () => {
        const db = getFallbackDb();
        return db.appointmentConfig;
      }
    );
  },

  updateAppointmentConfig: async (config: Partial<AppointmentConfig>): Promise<AppointmentConfig> => {
    return executePrisma(
      async () => {
        const existing = await getOrCreateAppointmentConfig();
        const updated = await prisma.appointmentConfig.update({
          where: { id: 1 },
          data: {
            dailyLimit: config.dailyLimit !== undefined ? config.dailyLimit : existing.dailyLimit,
            startTime: config.startTime !== undefined ? config.startTime : existing.startTime,
            endTime: config.endTime !== undefined ? config.endTime : existing.endTime,
            slotDuration: config.slotDuration !== undefined ? config.slotDuration : existing.slotDuration,
            bufferTime: config.bufferTime !== undefined ? config.bufferTime : existing.bufferTime,
            holidays: config.holidays !== undefined ? config.holidays : existing.holidays,
            weeklyOffDays: config.weeklyOffDays !== undefined ? config.weeklyOffDays : existing.weeklyOffDays,
            specialBlockedDates: config.specialBlockedDates !== undefined ? config.specialBlockedDates : existing.specialBlockedDates
          }
        });
        return {
          dailyLimit: updated.dailyLimit,
          startTime: updated.startTime,
          endTime: updated.endTime,
          slotDuration: updated.slotDuration,
          bufferTime: updated.bufferTime,
          holidays: updated.holidays,
          weeklyOffDays: updated.weeklyOffDays,
          specialBlockedDates: updated.specialBlockedDates
        };
      },
      () => {
        const db = getFallbackDb();
        db.appointmentConfig = {
          ...db.appointmentConfig,
          ...config
        };
        writeFallbackDb(db);
        return db.appointmentConfig;
      }
    );
  },

  // Appointments CRUD
  getAppointments: async (): Promise<Appointment[]> => {
    return executePrisma(
      async () => {
        const list = await prisma.appointment.findMany();
        return list.map(mapAppointment);
      },
      () => {
        const db = getFallbackDb();
        return db.appointments;
      }
    );
  },

  getAppointmentsByCitizen: async (citizenId: string): Promise<Appointment[]> => {
    return executePrisma(
      async () => {
        const list = await prisma.appointment.findMany({
          where: {
            OR: [
              { citizenId },
              { citizenMobile: citizenId }
            ]
          }
        });
        return list.map(mapAppointment);
      },
      () => {
        const db = getFallbackDb();
        return db.appointments.filter(a => a.citizenId === citizenId || a.citizenMobile === citizenId);
      }
    );
  },

  getAppointmentsByDate: async (date: string): Promise<Appointment[]> => {
    return executePrisma(
      async () => {
        const list = await prisma.appointment.findMany({
          where: { date }
        });
        return list.map(mapAppointment);
      },
      () => {
        const db = getFallbackDb();
        return db.appointments.filter(a => a.date === date);
      }
    );
  },

  generateTimeSlots: (config: AppointmentConfig): string[] => {
    const slots: string[] = [];
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const formatTime = (mins: number) => {
      const h24 = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 % 12 || 12;
      return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    
    let current = parseTime(config.startTime);
    const end = parseTime(config.endTime);
    
    while (current + config.slotDuration <= end) {
      const slotEnd = current + config.slotDuration;
      slots.push(`${formatTime(current)} - ${formatTime(slotEnd)}`);
      current = slotEnd + config.bufferTime;
    }
    return slots;
  },

  createAppointment: async (appointmentData: {
    citizenId: string;
    citizenName: string;
    citizenMobile: string;
    date: string;
    timeSlot: string;
    purpose: string;
  }): Promise<{ appointment?: Appointment; error?: string }> => {
    return executePrisma(
      async () => {
        const config = await getOrCreateAppointmentConfig();

        const dateObj = new Date(appointmentData.date);
        const weekday = dateObj.getDay();

        if (config.holidays.includes(appointmentData.date)) {
          return { error: 'The selected date is an official office holiday.' };
        }
        if (config.weeklyOffDays.includes(weekday)) {
          return { error: 'The selected date falls on a weekly off day.' };
        }
        if (config.specialBlockedDates.includes(appointmentData.date)) {
          return { error: 'The selected date has been temporarily blocked by administration.' };
        }

        const activeStates = ['PENDING', 'APPROVED', 'RESCHEDULED'];
        const citizenDup = await prisma.appointment.findFirst({
          where: {
            OR: [
              { citizenId: appointmentData.citizenId },
              { citizenMobile: appointmentData.citizenMobile }
            ],
            date: appointmentData.date,
            status: { in: activeStates }
          }
        });
        if (citizenDup) {
          return { error: 'You already have an active appointment booked for this date.' };
        }

        const activeDailyBookings = await prisma.appointment.count({
          where: {
            date: appointmentData.date,
            status: { in: activeStates }
          }
        });
        if (activeDailyBookings >= config.dailyLimit) {
          return { error: 'This date is fully booked. Please choose another available date.' };
        }

        const slotDup = await prisma.appointment.findFirst({
          where: {
            date: appointmentData.date,
            timeSlot: appointmentData.timeSlot,
            status: { in: activeStates }
          }
        });
        if (slotDup) {
          return { error: 'This time slot is already booked. Please choose another slot.' };
        }

        const id = `APT-${Date.now().toString().slice(-6)}`;
        const newAppointment = await prisma.appointment.create({
          data: {
            id,
            citizenId: appointmentData.citizenId,
            citizenName: appointmentData.citizenName,
            citizenMobile: appointmentData.citizenMobile,
            date: appointmentData.date,
            timeSlot: appointmentData.timeSlot,
            purpose: appointmentData.purpose,
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        return { appointment: mapAppointment(newAppointment) };
      },
      async () => {
        const db = getFallbackDb();
        const config = db.appointmentConfig;

        const dateObj = new Date(appointmentData.date);
        const weekday = dateObj.getDay();

        if (config.holidays.includes(appointmentData.date)) {
          return { error: 'The selected date is an official office holiday.' };
        }
        if (config.weeklyOffDays.includes(weekday)) {
          return { error: 'The selected date falls on a weekly off day.' };
        }
        if (config.specialBlockedDates.includes(appointmentData.date)) {
          return { error: 'The selected date has been temporarily blocked by administration.' };
        }

        const activeStates = ['PENDING', 'APPROVED', 'RESCHEDULED'];
        const citizenDup = db.appointments.some(
          a =>
            (a.citizenId === appointmentData.citizenId || a.citizenMobile === appointmentData.citizenMobile) &&
            a.date === appointmentData.date &&
            activeStates.includes(a.status)
        );
        if (citizenDup) {
          return { error: 'You already have an active appointment booked for this date.' };
        }

        const activeDailyBookings = db.appointments.filter(
          a => a.date === appointmentData.date && activeStates.includes(a.status)
        ).length;
        if (activeDailyBookings >= config.dailyLimit) {
          return { error: 'This date is fully booked. Please choose another available date.' };
        }

        const slotDup = db.appointments.some(
          a => a.date === appointmentData.date && a.timeSlot === appointmentData.timeSlot && activeStates.includes(a.status)
        );
        if (slotDup) {
          return { error: 'This time slot is already booked. Please choose another slot.' };
        }

        const id = `APT-${Date.now().toString().slice(-6)}`;
        const now = new Date().toISOString();
        const newAppointment = {
          id,
          citizenId: appointmentData.citizenId,
          citizenName: appointmentData.citizenName,
          citizenMobile: appointmentData.citizenMobile,
          date: appointmentData.date,
          timeSlot: appointmentData.timeSlot,
          purpose: appointmentData.purpose,
          status: 'PENDING' as AppointmentStatus,
          createdAt: now,
          updatedAt: now
        };

        db.appointments.push(newAppointment);
        writeFallbackDb(db);
        return { appointment: newAppointment };
      }
    );
  },

  updateAppointmentStatus: async (
    id: string,
    status: AppointmentStatus,
    remarks?: string,
    newDate?: string,
    newTimeSlot?: string
  ): Promise<Appointment | null> => {
    return executePrisma(
      async () => {
        const appointment = await prisma.appointment.findUnique({ where: { id } });
        if (!appointment) return null;

        const dataToUpdate: Prisma.AppointmentUpdateInput = {
          status,
          updatedAt: new Date()
        };

        if (remarks !== undefined) dataToUpdate.remarks = remarks;
        if (status === 'RESCHEDULED' && newDate && newTimeSlot) {
          dataToUpdate.date = newDate;
          dataToUpdate.timeSlot = newTimeSlot;
        }

        const updated = await prisma.appointment.update({
          where: { id },
          data: dataToUpdate
        });

        return mapAppointment(updated);
      },
      () => {
        const db = getFallbackDb();
        const index = db.appointments.findIndex(a => a.id === id);
        if (index === -1) return null;

        const appointment = db.appointments[index];
        appointment.status = status;
        if (remarks !== undefined) appointment.remarks = remarks;
        if (status === 'RESCHEDULED' && newDate && newTimeSlot) {
          appointment.date = newDate;
          appointment.timeSlot = newTimeSlot;
        }
        appointment.updatedAt = new Date().toISOString();

        db.appointments[index] = appointment;
        writeFallbackDb(db);
        return appointment;
      }
    );
  }
};
