import { NextResponse } from 'next/server';
import { DataService } from '@/db/dataService';

export async function GET() {
  try {
    const list = await DataService.getStaffUsers();
    // Exclude hashed passwords in listing for security
    const cleanList = list.map(u => ({
      id: u.id,
      name: u.name,
      mobile: u.mobile,
      role: u.role,
      ward: u.ward,
      createdAt: u.createdAt
    }));
    return NextResponse.json(cleanList);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve staff directory' }, { status: 550 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, mobile, password, ward } = body;

    if (!name || !mobile || !password || !ward) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const staff = await DataService.registerStaff({ name, mobile, password, ward });
    return NextResponse.json({
      success: true,
      user: {
        id: staff.id,
        name: staff.name,
        mobile: staff.mobile,
        role: staff.role,
        ward: staff.ward,
        createdAt: staff.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
