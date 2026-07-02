import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Chunk } from '@/src/lib/models';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { chunkIds } = await req.json(); // array of chunk IDs in new order
    for (let i = 0; i < chunkIds.length; i++) {
      await Chunk.findByIdAndUpdate(chunkIds[i], { order: i });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
