import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  // STEP 1 — Verify Environment Variables
  console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "FOUND" : "MISSING");

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY is missing from environment variables." }, { status: 500 });
    }

    // STEP 2 & 5 — Verify Gemini SDK & Model Name
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    // STEP 3 — Create Simple Test Route
    const result = await model.generateContent("Say hello");
    const text = result.response.text();

    return NextResponse.json({
      success: true,
      text: text
    });
  } catch (error: any) {
    // STEP 4 — Log Real Gemini Errors
    console.error("GEMINI ERROR:", error);
    return NextResponse.json({
      success: false,
      error: error.message || String(error)
    }, { status: 500 });
  }
}
