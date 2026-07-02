import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Prompt, Chunk } from '@/src/lib/models';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { title, rawText, splitMethod, customRegex, domainId } = await req.json();
    
    const chunkingLogic = JSON.stringify({ splitMethod, customRegex });
    const prompt = new Prompt({ title: title || "Imported Prompt", description: "Auto-imported", domainId, chunkingLogic });
    await prompt.save();

    let sections: string[] = [];

    if (splitMethod === 'headers') {
      sections = rawText.split(/(?=\n#{1,6}\s)/g).filter((s: string) => s.trim().length > 0);
    } else if (splitMethod === 'paragraphs') {
      sections = rawText.split(/\n\s*\n/).filter((s: string) => s.trim().length > 0);
    } else if (splitMethod === 'kalpline') {
      sections = rawText.split(/\n?### -----\n?/).filter((s: string) => s.trim().length > 0);
    } else if (splitMethod === 'custom' && customRegex) {
      try {
        const regex = new RegExp(customRegex, 'g');
        sections = rawText.split(regex).filter((s: string) => s.trim().length > 0);
      } catch (e) {
        sections = [rawText];
      }
    } else {
      sections = rawText.split(/(?=\n#{1,6}\s)/g).filter((s: string) => s.trim().length > 0);
      if (sections.length <= 1) {
        sections = rawText.split(/\n\s*\n/).filter((s: string) => s.trim().length > 0);
      }
    }

    if (sections.length === 0) sections = [rawText];

    const chunkDocs = sections.map((sec: string, index: number) => {
      const lines = sec.trim().split('\n');
      const maybeTitle = lines[0].replace(/^#+\s*/, '').substring(0, 50).trim();
      return {
        promptId: prompt._id,
        title: maybeTitle || `Branch ${index + 1}`,
        content: sec.trim(),
        order: index,
        role: 'user'
      };
    });

    await Chunk.insertMany(chunkDocs);

    return NextResponse.json({ prompt, chunksCount: chunkDocs.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
