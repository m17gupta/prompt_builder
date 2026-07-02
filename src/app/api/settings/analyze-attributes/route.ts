import { NextResponse } from 'next/server';
import dbConnect from '@/src/lib/dbConnect';
import { Settings } from '@/src/lib/models';
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { rawText } = await req.json();
    const settings = await Settings.findOne({ userId: 'default' });
    const geminiKey = settings?.geminiKey || process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({ error: "Gemini API key is required to analyze text." }, { status: 500 });
    }
    if (!rawText) {
      return NextResponse.json({ error: "No text provided." }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const prompt = `You are an expert entity extractor. Extract important company details, parameters, brand colors, contact info, rules, etc. from the following text and convert them into a flat JSON object.
Rules:
- The keys should be UPPERCASE with underscores (e.g., COMPANY_NAME, PRIMARY_COLOR, SUPPORT_EMAIL).
- The values should be concise strings.
- Only output valid JSON, without markdown formatting.

Text to analyze:
${rawText}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful assistant.",
      }
    });

    let resultText = response.text || "{}";
    // strip markdown
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch(e) {
      parsed = {};
    }

    return NextResponse.json({ attributes: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
