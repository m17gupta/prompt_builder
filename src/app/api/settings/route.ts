import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Settings } from '@/src/lib/models';

export async function GET() {
  try {
    await dbConnect();
    let settings = await Settings.findOne({ userId: 'default' });
    if (!settings) {
      settings = await Settings.create({ userId: 'default' });
    }
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const settings = await Settings.findOneAndUpdate(
      { userId: 'default' },
      body,
      { new: true, upsert: true }
    );
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
