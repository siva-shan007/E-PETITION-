import { NextResponse } from 'next/server';
import { DataService } from '@/db/dataService';

export async function GET() {
  try {
    const hasAdmin = await DataService.hasAdmin();
    return NextResponse.json({ setupRequired: !hasAdmin });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
