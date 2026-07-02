import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Domain, Prompt, Chunk, Version } from '@/src/lib/models';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const domain = await Domain.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(domain);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    await Domain.findByIdAndDelete(id);
    const prompts = await Prompt.find({ domainId: id });
    for (let prompt of prompts) {
        await Chunk.deleteMany({ promptId: prompt._id });
        await Version.deleteMany({ promptId: prompt._id });
        await Prompt.findByIdAndDelete(prompt._id);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
