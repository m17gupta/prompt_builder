import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Prompt, Chunk, Version } from '@/src/lib/models';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const prompt = await Prompt.findById(id);
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }
    return NextResponse.json(prompt);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const prompt = await Prompt.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(prompt);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    await Prompt.findByIdAndDelete(id);
    await Chunk.deleteMany({ promptId: id });
    await Version.deleteMany({ promptId: id });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
