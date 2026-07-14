import { NextResponse } from 'next/server';
import { DataService } from '@/db/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const citizenId = searchParams.get('citizenId') || searchParams.get('mobile');

    let list = await DataService.getAppointments();

    if (date) {
      list = list.filter(a => a.date === date);
    }
    if (citizenId) {
      list = list.filter(a => a.citizenId === citizenId || a.citizenMobile === citizenId);
    }

    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { citizenId, citizenName, citizenMobile, date, timeSlot, purpose } = body;

    if (!citizenId || !citizenName || !citizenMobile || !date || !timeSlot || !purpose) {
      return NextResponse.json({ error: 'Missing required booking fields.' }, { status: 400 });
    }

    const result = await DataService.createAppointment({
      citizenId,
      citizenName,
      citizenMobile,
      date,
      timeSlot,
      purpose
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.appointment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to book appointment' }, { status: 500 });
  }
}
