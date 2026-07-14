import { NextResponse } from 'next/server';
import { DataService } from '@/db/dataService';

export async function GET() {
  try {
    const config = await DataService.getAppointmentConfig();
    const slots = DataService.generateTimeSlots(config);
    return NextResponse.json({ config, slots });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch appointment configuration' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await DataService.updateAppointmentConfig(body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update appointment configuration' }, { status: 500 });
  }
}
