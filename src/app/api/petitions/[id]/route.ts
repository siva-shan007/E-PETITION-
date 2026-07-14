import { NextResponse } from 'next/server';
import { DataService } from '@/db/dataService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const petition = await DataService.getPetitionById(id);
    if (!petition) {
      return NextResponse.json({ error: 'Petition not found' }, { status: 404 });
    }

    return NextResponse.json({ petition });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch petition' }, { status: 550 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const body = await request.json();
    const { status, remarks, actor, assignedDept, priority, internalRemarks, publicRemarks, documents } = body;

    const updated = await DataService.updatePetitionStatus(
      id,
      status,
      remarks,
      actor,
      assignedDept,
      priority,
      internalRemarks,
      publicRemarks,
      documents
    );

    if (!updated) {
      return NextResponse.json({ error: 'Petition not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update petition' }, { status: 500 });
  }
}
