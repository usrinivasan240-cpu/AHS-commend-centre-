import { NextRequest, NextResponse } from "next/server";
import { lmsErrorStatus } from "@/lib/lms/server";
import { requireActor } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

type ReviewQuestion = {
  prompt: string;
  kind: string;
  options?: string[];
  answerKeys?: string[];
};

/**
 * POST /api/ai/review — AI-check draft test questions before publishing (super-admin/trainer only).
 * Body: { actorEmail, questions: ReviewQuestion[] }
 * Requires GEMINI_API_KEY. Without it returns 503 with setup instructions.
 * Returns: { corrections: [{ index, ok, fixedAnswerKeys?, fixedKind?, note }] }
 */
export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json();
    await requireActor(req, db, ["super-admin", "trainer"], body);

    const questions = Array.isArray(body.questions) ? (body.questions as ReviewQuestion[]) : [];
    if (questions.length === 0) {
      return NextResponse.json({ error: "questions required (non-empty array)" }, { status: 400 });
    }
    // Caps are env-tunable so limits can change without a redeploy of logic.
    const maxQuestions = Math.max(1, Number(process.env.AI_REVIEW_MAX_QUESTIONS) || 50);
    if (questions.length > maxQuestions) {
      return NextResponse.json({ error: `max ${maxQuestions} questions per review` }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "AI_REVIEW_NOT_CONFIGURED: set GEMINI_API_KEY (Google AI Studio, free tier) in Vercel env vars, then redeploy.",
        },
        { status: 503 }
      );
    }

    const items = questions.map((q, i) => ({
      index: i,
      kind: String(q.kind || "mcq"),
      prompt: String(q.prompt || "").slice(0, 2000),
      options: Array.isArray(q.options) ? q.options.map(String).slice(0, 8) : [],
      proposedAnswers: Array.isArray(q.answerKeys) ? q.answerKeys.map(String).slice(0, 6) : [],
    }));

    const systemPrompt = `You are a strict exam reviewer for a coding bootcamp. For each draft question, check: (1) the proposed answer is actually correct, (2) for mcq/msq every proposed answer matches one of the options exactly, (3) there are no duplicate or ambiguous options, (4) the kind fits (fill-in-the-blank style prompts should be "short"). Reply ONLY with a JSON array, one object per question in order: {"index": n, "ok": true|false, "fixedAnswerKeys": ["..."] (only if you change or fill a missing answer; must match options exactly for mcq/msq), "fixedKind": "mcq|msq|short|code" (only if the kind is wrong), "note": "one short sentence"}. No markdown, no code fences, just the JSON array.`;

    // Model + tuning come from env so the backend can switch models without code changes.
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const temperature = Number(process.env.AI_REVIEW_TEMPERATURE ?? 0.1);
    const maxOutputTokens = Number(process.env.AI_REVIEW_MAX_TOKENS) || 4096;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: JSON.stringify(items) }] }],
          generationConfig: { responseMimeType: "application/json", temperature, maxOutputTokens },
        }),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ error: `AI provider error (${res.status}): ${text.slice(0, 300)}` }, { status: 502 });
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "[]";
    let corrections: unknown;
    try {
      corrections = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "AI returned unparseable output — try again" }, { status: 502 });
    }
    if (!Array.isArray(corrections)) {
      return NextResponse.json({ error: "AI returned unexpected shape — try again" }, { status: 502 });
    }
    // Sanitize: keep only known indexes and string fields.
    const clean = (corrections as Record<string, unknown>[])
      .filter((c) => c && typeof c === "object" && Number.isInteger((c as { index?: unknown }).index))
      .map((c) => {
        const c0 = c as { index: number; ok?: unknown; fixedAnswerKeys?: unknown; fixedKind?: unknown; note?: unknown };
        const out: Record<string, unknown> = { index: c0.index, ok: c0.ok === true };
        if (Array.isArray(c0.fixedAnswerKeys)) out.fixedAnswerKeys = c0.fixedAnswerKeys.map(String).slice(0, 8);
        if (["mcq", "msq", "short", "code"].includes(String(c0.fixedKind))) out.fixedKind = String(c0.fixedKind);
        if (c0.note !== undefined) out.note = String(c0.note).slice(0, 300);
        return out;
      });
    return NextResponse.json({ corrections: clean });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI review failed";
    return NextResponse.json({ error: msg }, { status: lmsErrorStatus(msg) });
  }
}
