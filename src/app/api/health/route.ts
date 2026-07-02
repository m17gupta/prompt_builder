import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ status: "ok", db: mongoose.connection.readyState });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
