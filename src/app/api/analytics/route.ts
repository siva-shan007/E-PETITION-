import { NextResponse } from 'next/server';
import { DataService } from '@/db/dataService';

export async function GET() {
  try {
    const stats = await DataService.getAnalytics();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
