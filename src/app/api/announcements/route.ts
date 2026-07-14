import { NextResponse } from 'next/server';
import { DataService } from '@/db/dataService';

export async function GET() {
  try {
    const list = await DataService.getAllAnnouncements();
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newAnn = await DataService.createAnnouncement(body);
    return NextResponse.json(newAnn, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
