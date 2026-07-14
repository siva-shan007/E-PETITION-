import { NextResponse } from 'next/server';
import { DataService } from '@/db/dataService';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const success = await DataService.toggleAnnouncementStatus(id);
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}
