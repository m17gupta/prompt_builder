import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Prompt, Chunk } from '@/src/lib/models';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const originalPrompt = await Prompt.findById(id);
    if (!originalPrompt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const newPrompt = new Prompt({
      title: `${originalPrompt.title} (Clone)`,
      description: originalPrompt.description,
      tags: originalPrompt.tags,
      variables: originalPrompt.variables,
      domainId: body.domainId || null
    });
    await newPrompt.save();

    const chunks = await Chunk.find({ promptId: originalPrompt._id });
    for (let chunk of chunks) {
      const newChunk = new Chunk({
        promptId: newPrompt._id,
        content: chunk.content,
        order: chunk.order,
        role: chunk.role,
        locked: chunk.locked
      });
      await newChunk.save();
    }

    return NextResponse.json(newPrompt);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
