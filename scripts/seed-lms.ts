import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, "../web token .json"), "utf-8")
);

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

const now = () => new Date().toISOString();
const COURSE_ID = "ai-app-dev-bootcamp";

const modules: { id: string; title: string; order: number; description: string }[] = [
  { id: "m01", title: "Foundations: Python + AI Landscape", order: 1, description: "Python essentials for AI work and the modern AI stack: tokens, embeddings, LLMs." },
  { id: "m02", title: "Prompt Engineering", order: 2, description: "System prompts, few-shot, structured output, and prompt debugging." },
  { id: "m03", title: "LLM APIs + App Patterns", order: 3, description: "Chat, streaming, function calling, and common AI app shapes." },
  { id: "m04", title: "RAG: Retrieval-Augmented Generation", order: 4, description: "Chunking, embeddings, vector search, and grounded answers with citations." },
  { id: "m05", title: "AI Agents", order: 5, description: "Tools, planning loops, memory, and multi-step agent workflows." },
  { id: "m06", title: "Frontend for AI Apps (Next.js)", order: 6, description: "Streaming UIs, chat interfaces, and state handling in Next.js + React." },
  { id: "m07", title: "Backend + Data (APIs, Postgres)", order: 7, description: "API routes, auth, Postgres/pgvector, jobs, and file handling." },
  { id: "m08", title: "Evals + Guardrails", order: 8, description: "Quality evals, red-teaming basics, PII handling, and output validation." },
  { id: "m09", title: "Deploy + MLOps Basics", order: 9, description: "Environments, secrets, observability, cost/latency budgets, CI deploys." },
  { id: "m10", title: "Capstone: Ship an AI Application", order: 10, description: "Design, build, evaluate, and demo a complete AI application." },
];

const lessonTopics: Record<string, { title: string; body: string; minutes: number }[]> = {
  m01: [
    { title: "Python for AI: the 20% that matters", body: "# Python for AI\n\nFunctions, list/dict comprehensions, virtual envs, `pip`, JSON handling, and calling HTTP APIs with `requests`/`fetch`. Keep scripts small and typed where it counts.", minutes: 25 },
    { title: "How LLMs work (practically)", body: "# LLMs, practically\n\nTokens, context windows, temperature, system vs user messages, and why grounding beats memorisation. Cost and latency implications of model choice.", minutes: 20 },
  ],
  m02: [
    { title: "Anatomy of a good prompt", body: "# Anatomy of a good prompt\n\nRole + context + task + constraints + output format. Prefer explicit schemas over prose when a machine consumes the output.", minutes: 20 },
    { title: "Few-shot, CoT, and structured output", body: "# Techniques\n\nFew-shot examples, chain-of-thought for reasoning tasks, JSON mode / function calling for reliable parsing. Debug prompts by diffing outputs, not vibes.", minutes: 25 },
  ],
  m03: [
    { title: "Chat + streaming APIs", body: "# Chat + streaming\n\nMessage roles, streaming tokens to the UI, handling partial JSON, retries with backoff. Never expose server keys to the browser.", minutes: 25 },
    { title: "Function calling / tool use", body: "# Function calling\n\nDefine tools with JSON schemas, let the model request calls, execute server-side, and feed results back. Validate everything the model returns.", minutes: 30 },
  ],
  m04: [
    { title: "Chunking + embeddings", body: "# Chunking + embeddings\n\nChunk by semantic unit (~300-800 tokens with overlap), embed once, store vectors with metadata. Tune chunk size per corpus; measure recall.", minutes: 25 },
    { title: "Grounded answering with citations", body: "# Grounded answers\n\nRetrieve top-k, rerank if needed, answer only from context, cite sources, and say 'not found' when evidence is missing.", minutes: 25 },
  ],
  m05: [
    { title: "Agent loops: plan, act, observe", body: "# Agent loops\n\nGoal -> plan -> tool calls -> observations -> repeat. Cap iterations, log every step, and require approval for irreversible actions.", minutes: 25 },
    { title: "Tools + memory", body: "# Tools + memory\n\nSmall, well-described tools beat mega-tools. Short-term memory in context; long-term facts in a store. Idempotency keys for side effects.", minutes: 25 },
  ],
  m06: [
    { title: "Streaming chat UI in Next.js", body: "# Streaming chat UI\n\nServer-sent events / ReadableStream to the client, optimistic message list, abort handling, and markdown rendering with code blocks.", minutes: 30 },
    { title: "State, auth, and file uploads", body: "# App shell\n\nAuth-gated routes, upload to API routes (never direct DB writes from the client), progress states for long generations.", minutes: 25 },
  ],
  m07: [
    { title: "API routes + Postgres/pgvector", body: "# Backend\n\nRoute handlers validate input, resolve the actor server-side, and use the Admin SDK. pgvector for embeddings; indexes for filters.", minutes: 30 },
    { title: "Jobs, webhooks, and files", body: "# Async work\n\nLong tasks go to job queues with status polling. Verify webhook signatures. Store files in object storage, metadata in the DB.", minutes: 25 },
  ],
  m08: [
    { title: "Evals: grading your AI", body: "# Evals\n\nGolden datasets, LLM-as-judge with rubrics, regression checks in CI. Track pass rate per prompt version.", minutes: 25 },
    { title: "Guardrails: PII, injection, output checks", body: "# Guardrails\n\nStrip PII before logging, defend against prompt injection in retrieved content, validate output schema before acting on it.", minutes: 25 },
  ],
  m09: [
    { title: "Environments + secrets + observability", body: "# Ops\n\nDev/staging/prod parity, secret managers (never commit keys), structured logs, traces per request, cost/latency dashboards.", minutes: 25 },
    { title: "Shipping: CI, previews, rollbacks", body: "# Shipping\n\nPreview deploys per PR, migration-safe DB changes, feature flags for risky model swaps, one-command rollback.", minutes: 20 },
  ],
  m10: [
    { title: "Capstone brief + milestone plan", body: "# Capstone\n\nPick a real user problem. Milestones: proposal -> prototype -> evals -> hardened demo. Document trade-offs and costs.", minutes: 20 },
    { title: "Demo day: presenting AI work", body: "# Demo day\n\nLive demo with a backup recording, metrics (quality, latency, cost), and an honest limitations slide.", minutes: 20 },
  ],
};

const practicePrompts: Record<string, string> = {
  m01: "Write a Python function that chunks a text into ~500-character pieces with 50-character overlap, and returns a list of dicts with {index, text}.",
  m02: "Rewrite this vague prompt into role+context+task+constraints+format: 'Summarize this doc for my boss.' Include a JSON output schema.",
  m03: "Design the tool schema (name, description, JSON parameters) for a `searchDocs(query, topK)` tool an LLM agent could call.",
  m04: "Given 3 retrieved passages (one irrelevant), write a grounded answer with [1][2] citations and state what is NOT covered.",
  m05: "Break 'book me a dentist appointment' into an agent plan: steps, tools needed, approvals required, and failure fallbacks.",
  m06: "Sketch the React state shape for a streaming chat (messages, pending token buffer, abort) and the SSE parsing loop.",
  m07: "Design the API route POST /api/ask: request schema, auth check, RAG steps, response schema, and error cases.",
  m08: "Write a 5-row golden eval set (input, expected behaviour, rubric 0-2) for a support-answer bot.",
  m09: "List the env vars, secrets, dashboards, and alerts needed before launching an AI feature to 1000 users.",
  m10: "Write your capstone one-pager: problem, users, success metric, architecture sketch, and eval plan.",
};

const handsonBriefs: Record<string, { title: string; brief: string; checklist: string[] }> = {
  m01: { title: "Hands-on: chunk + embed a doc", brief: "Take a 5-page PDF, chunk it, embed the chunks, and store them with metadata.", checklist: ["Chunks have overlap and metadata (page, index)", "Embeddings stored with the text they represent", "Print top-2 chunks for a test query"] },
  m02: { title: "Hands-on: prompt versioning", brief: "Create v1/v2/v3 of a summariser prompt and compare outputs on 3 fixed inputs.", checklist: ["Same 3 inputs used for all versions", "Outputs scored against a rubric", "Winner documented with reasons"] },
  m03: { title: "Hands-on: streaming chat endpoint", brief: "Build a chat API route that streams tokens and a minimal client that renders them.", checklist: ["Tokens render incrementally", "Abort button cancels the stream", "Server key never reaches the browser"] },
  m04: { title: "Hands-on: mini RAG", brief: "Build retrieval over your chunks and answer questions with citations.", checklist: ["Top-k retrieval with scores logged", "Answers cite chunk ids", "'Not found' path demonstrated"] },
  m05: { title: "Hands-on: two-tool agent", brief: "Build an agent with search + calculator tools that solves a 3-step task.", checklist: ["Step log shows plan/act/observe", "Iteration cap enforced", "Final answer references tool outputs"] },
  m06: { title: "Hands-on: chat UI polish", brief: "Add markdown rendering, code copy buttons, and retry-on-error to your chat UI.", checklist: ["Code blocks render with copy button", "Errors show retry affordance", "Works on mobile viewport"] },
  m07: { title: "Hands-on: ask API with auth", brief: "Ship POST /api/ask with actor auth, validation, and RAG wiring.", checklist: ["Unauthenticated requests rejected", "Invalid input returns 400 with details", "Latency logged per request"] },
  m08: { title: "Hands-on: eval harness", brief: "Run your golden set against two prompt versions and report pass rates.", checklist: ["Golden set stored as JSON", "Both versions scored identically", "Regression noted for the loser"] },
  m09: { title: "Hands-on: launch checklist", brief: "Produce the launch runbook: envs, dashboards, alerts, rollback steps.", checklist: ["Secrets listed without values", "Dashboard screenshots or links", "Rollback tested on staging"] },
  m10: { title: "Capstone build", brief: "Ship your AI application end-to-end with evals and a demo.", checklist: ["Live demo URL works", "Evals + metrics documented", "Limitations + costs disclosed"] },
};

function testForModule(mid: string, order: number) {
  const isCapstone = mid === "m10";
  return {
    id: `${mid}-t1`,
    courseId: COURSE_ID,
    moduleId: mid,
    title: isCapstone ? "Capstone exam" : `Module ${order} check`,
    mode: isCapstone ? "exam" : "practice",
    timeLimitMinutes: isCapstone ? 90 : 20,
    passPercent: isCapstone ? 70 : 60,
    order: 1,
    status: "published",
    questions: [
      {
        id: `${mid}-q1`,
        kind: "mcq",
        prompt: `Core concept check for ${mid}: which statement is most accurate?`,
        options: ["Ground outputs in retrieved evidence", "Always maximise temperature", "Ship prompts without evals", "Expose server keys to the client"],
        answerKeys: ["Ground outputs in retrieved evidence"],
        points: 10,
      },
      {
        id: `${mid}-q2`,
        kind: "short",
        prompt: `In one or two sentences, state the key trade-off practised in ${mid}.`,
        answerKeys: ["trade-off"],
        points: 10,
      },
      {
        id: `${mid}-q3`,
        kind: "code",
        prompt: `Implement the ${mid} hands-on task as a function. Partial credit for structure and comments.`,
        points: 10,
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  };
}

async function main() {
  console.log("Seeding LMS...\n");
  const batch = db.batch();
  const put = (collection: string, id: string, data: Record<string, unknown>) => {
    batch.set(db.collection(collection).doc(id), data);
  };

  put("lms_courses", COURSE_ID, {
    id: COURSE_ID,
    title: "AI Application Development Bootcamp",
    slug: COURSE_ID,
    description: "48-part bootcamp: from Python and prompts to RAG, agents, full-stack AI apps, evals, deployment, and a capstone.",
    track: "ai",
    order: 1,
    status: "published",
    createdBy: "seed",
    createdAt: now(),
    updatedAt: now(),
  });

  for (const m of modules) {
    put("lms_modules", m.id, { ...m, courseId: COURSE_ID, status: "published", createdAt: now(), updatedAt: now() });

    const lessons = lessonTopics[m.id] ?? [];
    lessons.forEach((l, i) => {
      const lid = `${m.id}-l${i + 1}`;
      put("lms_lessons", lid, {
        id: lid, courseId: COURSE_ID, moduleId: m.id, title: l.title, order: i + 1,
        body: l.body, estimatedMinutes: l.minutes, status: "published",
        createdAt: now(), updatedAt: now(),
      });
    });

    put("lms_practices", `${m.id}-p1`, {
      id: `${m.id}-p1`, courseId: COURSE_ID, moduleId: m.id,
      title: `Practice: ${m.title}`, prompt: practicePrompts[m.id] ?? "Complete the module exercise.",
      language: m.id === "m06" || m.id === "m07" ? "typescript" : "python",
      order: 1, status: "published", createdAt: now(), updatedAt: now(),
    });

    const h = handsonBriefs[m.id];
    if (h) {
      put("lms_handsons", `${m.id}-h1`, {
        id: `${m.id}-h1`, courseId: COURSE_ID, moduleId: m.id,
        title: h.title, brief: h.brief, checklist: h.checklist,
        order: 1, status: "published", createdAt: now(), updatedAt: now(),
      });
    }

    const t = testForModule(m.id, m.order);
    put("lms_tests", t.id, t);
  }

  await batch.commit();
  console.log("LMS seed complete: 1 course, 10 modules, 20 lessons, 10 practices, 10 hands-on, 10 tests.");
  process.exit(0);
}

main().catch((error) => {
  console.error("LMS seeding failed:", error);
  process.exit(1);
});
