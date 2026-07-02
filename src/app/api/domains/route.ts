import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Domain } from '@/src/lib/models';

export async function GET() {
  try {
    await dbConnect();
    const domains = await Domain.find().sort({ createdAt: -1 });
    return NextResponse.json(domains);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const domain = new Domain({ name: body.name, variables: body.variables || {} });
    await domain.save();
    return NextResponse.json(domain);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
