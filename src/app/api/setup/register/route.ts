import { NextResponse } from 'next/server';
import { DataService } from '@/db/dataService';

export async function POST(request: Request) {
  try {
    const hasAdmin = await DataService.hasAdmin();
    if (hasAdmin) {
      return NextResponse.json({ error: 'Setup is already completed.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, mobile, email, password } = body;

    if (!name || !mobile || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const admin = await DataService.registerAdmin({ name, mobile, email, password });
    return NextResponse.json({ success: true, user: { name: admin.name, mobile: admin.mobile, role: admin.role } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 550 });
  }
}
