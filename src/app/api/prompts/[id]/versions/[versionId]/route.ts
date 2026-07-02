import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Version } from '@/src/lib/models';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, versionId: string }> }) {
  try {
    await dbConnect();
    const { versionId } = await params;
    await Version.findByIdAndDelete(versionId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
