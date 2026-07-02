import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Prompt } from '@/src/lib/models';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = req.nextUrl;
    const domainId = searchParams.get('domainId');

    const filter: any = {};
    if (domainId) {
      filter.domainId = domainId;
    } else {
      filter.domainId = { $exists: false };
    }

    let prompts = await Prompt.find(filter).sort({ updatedAt: -1 });

    if (!domainId) {
      const nullDomainPrompts = await Prompt.find({ domainId: null }).sort({ updatedAt: -1 });
      const allIds = new Set(prompts.map(p => p._id.toString()));
      nullDomainPrompts.forEach(p => {
        if (!allIds.has(p._id.toString())) prompts.push(p);
      });
    }

    return NextResponse.json(prompts);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const prompt = new Prompt(body);
    await prompt.save();
    return NextResponse.json(prompt);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
