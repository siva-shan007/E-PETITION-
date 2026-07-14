import { NextResponse } from 'next/server';
import { DataService } from '@/db/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get('mobile');
    
    let list = await DataService.getPetitions();
    if (mobile) {
      list = list.filter(p => p.mobile === mobile);
    }
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch petitions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPetition = await DataService.createPetition(body);
    return NextResponse.json(newPetition, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create petition' }, { status: 500 });
  }
}
