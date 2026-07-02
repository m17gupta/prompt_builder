import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Prompt, Chunk, Version } from '@/src/lib/models';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const versions = await Version.find({ promptId: id }).sort({ versionNumber: -1 });
    return NextResponse.json(versions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const prompt = await Prompt.findById(id);
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const chunks = await Chunk.find({ promptId: prompt._id }).sort({ order: 1 });
    
    prompt.version = (prompt.version || 1) + 1;
    await prompt.save();

    const newVersion = new Version({
      promptId: prompt._id,
      versionNumber: prompt.version,
      contentSnapshot: JSON.stringify(chunks)
    });
    await newVersion.save();
    
    return NextResponse.json({ prompt, version: newVersion });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
