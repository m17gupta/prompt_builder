import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Chunk } from '@/src/lib/models';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const chunks = await Chunk.find({ promptId: id }).sort({ order: 1 });
    return NextResponse.json(chunks);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
