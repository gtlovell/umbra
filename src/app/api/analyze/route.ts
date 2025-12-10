import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: Request) {
  try {
    // Accept either imageBase64 OR textContent
    const { imageBase64, mimeType, textContent } = await req.json();

    if (!imageBase64 && !textContent) {
      return NextResponse.json(
        { error: "No input data found" },
        { status: 400 }
      );
    }

    let transcription = "";
    let aiInputText = "";

    // SCENARIO A: IMAGE UPLOAD
    if (imageBase64) {
      const visionModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-001",
      });
      const prompt = `
          Analyze this handwritten note.
          Return a VALID JSON object (no markdown) with:
          1. "title": A punchy, 3-word max title.
          2. "transcription": Verbatim text.
          3. "summary": Concise 2-sentence summary.
          4. "tags": Array of 3-5 topic keywords.
        `;

      const result = await visionModel.generateContent([
        prompt,
        {
          inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" },
        },
      ]);

      const rawText = result.response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const jsonResponse = JSON.parse(rawText);

      // Return early if image logic handles everything
      // But we need embeddings, so we flow down...
      transcription = jsonResponse.transcription;

      // We reconstruct the JSON to pass to the embedding logic below
      aiInputText = JSON.stringify(jsonResponse);
    }

    // SCENARIO B: DIRECT TEXT ENTRY
    else {
      transcription = textContent;

      // We need to generate Title/Summary/Tags for this raw text
      const textModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
      const prompt = `
          Analyze the following note content.
          Return a VALID JSON object (no markdown) with:
          1. "title": A punchy, 3-word max title.
          2. "summary": Concise 2-sentence summary.
          3. "tags": Array of 3-5 topic keywords.

          CONTENT:
          "${textContent}"
        `;

      const result = await textModel.generateContent(prompt);
      const rawText = result.response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      aiInputText = rawText; // This contains title, summary, tags
    }

    // PARSE AI RESULTS
    const jsonResponse = JSON.parse(aiInputText);

    // GENERATE EMBEDDINGS (Context: Title + Summary + Content)
    const embeddingModel = genAI.getGenerativeModel({
      model: "gemini-embedding-001",
    });
    const textToEmbed = `Title: ${jsonResponse.title}\nSummary: ${jsonResponse.summary}\nContent: ${transcription}`;

    const embeddingResult = await embeddingModel.embedContent(textToEmbed);
    const embedding = embeddingResult.embedding.values;

    return NextResponse.json({
      title: jsonResponse.title,
      transcription: transcription, // The raw text (either OCR'd or Typed)
      summary: jsonResponse.summary,
      tags: jsonResponse.tags,
      embedding: embedding,
    });
  } catch (error: any) {
    console.error("AI Error Details:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze note",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
