import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Chunk } from '@/src/lib/models';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    if (body.order === undefined) {
      const lastChunk = await Chunk.findOne({ promptId: body.promptId }).sort({ order: -1 });
      body.order = lastChunk ? lastChunk.order + 1 : 0;
    }
    const chunk = new Chunk(body);
    await chunk.save();
    return NextResponse.json(chunk);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
