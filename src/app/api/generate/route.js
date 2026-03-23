import { NextResponse } from "next/server";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "google/gemma-3n-e4b-it:free";
const SYSTEM_CONTEXT = "Contexte : tu écris pour Novel-Index, un site qui indexe les web novels, light novels, mangas et webtoons traduits en français. Tu écris en français, de façon naturelle, engageante et concise. Pas de formules creuses. Pas d'emojis. Tu parles aux lecteurs passionnés.\n\n";

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "user", content: SYSTEM_CONTEXT + prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("OpenRouter error:", err);
      return NextResponse.json(
        { error: "Erreur OpenRouter", details: err },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Generate API error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
