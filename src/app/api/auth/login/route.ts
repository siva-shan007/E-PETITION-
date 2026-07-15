import { NextResponse } from 'next/server';
import { DataService } from '@/db/dataService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobile, password, role, name } = body;

    if (!mobile || !role) {
      return NextResponse.json({ error: 'Mobile and role are required.' }, { status: 400 });
    }

    if (role === 'CITIZEN') {
      // Citizen login with simulated OTP completed. Register/Retrieve citizen profile
      const citizen = await DataService.registerOrGetCitizen(mobile, name || 'Citizen User');
      return NextResponse.json({
        success: true,
        user: {
          id: citizen.id,
          mobile: citizen.mobile,
          name: citizen.name,
          role: citizen.role,
          createdAt: citizen.createdAt
        }
      });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required for staff/admin logins.' }, { status: 400 });
    }

    const authenticated = await DataService.authenticateUser(mobile, password, role);

    if (!authenticated) {
      return NextResponse.json({ error: 'Invalid mobile or password credentials.' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authenticated.id,
        mobile: authenticated.mobile,
        name: authenticated.name,
        role: authenticated.role,
        ward: authenticated.ward,
        createdAt: authenticated.createdAt
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
