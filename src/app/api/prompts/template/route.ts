import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Prompt, Chunk } from '@/src/lib/models';
import { ecomTemplate } from '@/src/lib/ecomTemplate';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { type, domainId } = await req.json();
    let rawText = '';
    if (type === 'ecommerce') {
      rawText = ecomTemplate;
    }

    const prompt = new Prompt({
      title: "E-Commerce Master Prompt",
      description: "Default e-commerce prompt with best practices",
      domainId,
      variables: {
        "COMPANY_NAME": "Kalp Fashion",
        "PROJECT_SLUG": "kalpfashion",
        "BUSINESS_TYPE": "B2C",
        "VERTICAL": "Fashion",
        "INDUSTRY": "Retail",
        "BUSINESS_GOAL": "Sales",
        "CURRENT_TENANT_DB_HEADER": "tenant_1",
        "ACTIVE_LANGUAGES": "en",
        "DEFAULT_LANGUAGE": "en",
        "ACTIVE_CURRENCIES": "USD",
        "DEFAULT_CURRENCY": "USD",
        "COMPANY_ADDRESS": "123 Kalp St",
        "COMPANY_PHONE": "1234567890",
        "COMPANY_EMAIL": "support@kalp.com",
        "COMPANY_WHATSAPP": "1234567890"
      }
    });
    await prompt.save();

    const parts = rawText.split(/(?=\n##\s)/g).filter((s: string) => s.trim().length > 0);
    
    const chunkDocs = parts.map((sec: string, index: number) => {
      const lines = sec.trim().split('\n');
      const maybeTitle = lines[0].replace(/^#+\s*/, '').substring(0, 50).trim();
      return {
        promptId: prompt._id,
        title: maybeTitle || `Branch ${index + 1}`,
        content: sec.trim(),
        order: index,
        role: 'system',
        locked: true
      };
    });

    await Chunk.insertMany(chunkDocs);

    return NextResponse.json({ prompt, chunksCount: chunkDocs.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
