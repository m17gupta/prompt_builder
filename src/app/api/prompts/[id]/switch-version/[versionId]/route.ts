import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Prompt, Chunk, Version } from '@/src/lib/models';

export async function POST(req: Request, { params }: { params: Promise<{ id: string, versionId: string }> }) {
  try {
    await dbConnect();
    const { id, versionId } = await params;
    const version = await Version.findById(versionId);
    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const chunksSnapshot = JSON.parse(version.contentSnapshot || "[]");
    
    // Delete current chunks
    await Chunk.deleteMany({ promptId: id });

    // Insert snapshot chunks
    const newChunks = chunksSnapshot.map((c: any) => {
      const { _id, createdAt, updatedAt, ...rest } = c;
      return { ...rest, promptId: id };
    });
    
    await Chunk.insertMany(newChunks);

    const prompt = await Prompt.findById(id);
    if (prompt) {
      prompt.version = version.versionNumber;
      await prompt.save();
    }

    return NextResponse.json({ success: true, newVersion: version.versionNumber });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
