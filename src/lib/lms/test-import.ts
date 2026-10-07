import type { LmsQuestionKind } from "./types";

/** One parsed row from an admin-uploaded daily-test file. */
export type ImportedQuestion = {
  rowIndex: number;
  kind: LmsQuestionKind;
  prompt: string;
  options: string[];
  answerKeys: string[];
  points: number;
  /** Issues found; auto-fixed where noted. Rows with blocking issues are still importable but flagged. */
  issues: string[];
  /** True when the parser auto-corrected something (case trim, letter/index answer, default points). */
  corrected: boolean;
};

export type ImportParseResult = {
  questions: ImportedQuestion[];
  skipped: number;
};

const KIND_ALIASES: { kind: LmsQuestionKind; match: string[] }[] = [
  { kind: "mcq", match: ["mcq", "multiple choice", "single choice", "single", "choose", "objective", "mcq-single"] },
  { kind: "msq", match: ["msq", "multiple select", "multi select", "multiple answers", "checkbox", "multi-select", "msq-multi"] },
  { kind: "short", match: ["short", "fill", "fill in the blank", "fill in the blanks", "blank", "blanks", "text", "one word", "subjective", "short answer"] },
  { kind: "code", match: ["code", "coding", "program", "programming", "code writing"] },
];

function norm(s: unknown): string {
  return String(s ?? "").trim();
}

function normKey(s: string): string {
  return s.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

export function detectKind(raw: string): LmsQuestionKind {
  const k = normKey(raw);
  if (!k) return "mcq";
  for (const { kind, match } of KIND_ALIASES) {
    if (match.some((m) => k === m || k.startsWith(m + " ") || k.startsWith(m + "("))) return kind;
  }
  return "mcq";
}

const HEADER_ALIASES: { key: "prompt" | "kind" | "options" | "answer" | "points"; match: string[] }[] = [
  { key: "prompt", match: ["question", "prompt", "q", "problem", "statement"] },
  { key: "kind", match: ["type", "kind", "format", "question type"] },
  { key: "options", match: ["options", "option", "choices", "choice", "opts", "alternatives"] },
  { key: "answer", match: ["answer", "answers", "correct", "correct answer", "correct answers", "key", "answer key", "solution"] },
  { key: "points", match: ["points", "point", "marks", "mark", "score", "weight"] },
];

export function mapHeaders(headers: string[]): Record<"prompt" | "kind" | "options" | "answer" | "points", number> {
  const map: Record<string, number> = { prompt: 0, kind: -1, options: -1, answer: -1, points: -1 };
  headers.forEach((h, i) => {
    const k = normKey(h);
    for (const { key, match } of HEADER_ALIASES) {
      if (match.includes(k) && map[key] === -1) map[key] = i;
    }
  });
  // Fallback to positions: question | type | options | answer | points
  if (map.kind === -1 && headers.length > 1) map.kind = 1;
  if (map.options === -1 && headers.length > 2) map.options = 2;
  if (map.answer === -1 && headers.length > 3) map.answer = 3;
  if (map.points === -1 && headers.length > 4) map.points = 4;
  return map as Record<"prompt" | "kind" | "options" | "answer" | "points", number>;
}

function splitList(s: string): string[] {
  if (!s) return [];
  // Primary separator is "|"; also accept newlines. Commas are NOT split (options may contain them).
  return s
    .split(/\r?\n|\|/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Resolve a written answer to an option: exact (case-insensitive) match, else letter (A-D) or 1-based index. */
function resolveOption(answer: string, options: string[]): { value: string; corrected: boolean; issue?: string } {
  const a = answer.trim();
  const exact = options.find((o) => o.toLowerCase() === a.toLowerCase());
  if (exact) return { value: exact, corrected: exact !== a };
  if (/^[a-z]$/i.test(a)) {
    const idx = a.toLowerCase().charCodeAt(0) - 97;
    if (options[idx]) return { value: options[idx], corrected: true };
  }
  if (/^\d+$/.test(a)) {
    const idx = Number(a) - 1;
    if (options[idx]) return { value: options[idx], corrected: true };
  }
  return { value: a, corrected: false, issue: `Answer "${a}" does not match any option — needs review` };
}

export function rowsToQuestions(rows: string[][]): ImportParseResult {
  const result: ImportParseResult = { questions: [], skipped: 0 };
  if (rows.length < 2) return result;
  const map = mapHeaders(rows[0].map(norm));
  const cell = (r: string[], i: number) => (i >= 0 && i < r.length ? norm(r[i]) : "");

  for (let ri = 1; ri < rows.length; ri++) {
    const r = rows[ri];
    if (r.every((c) => !norm(c))) continue; // blank row
    const prompt = cell(r, map.prompt);
    if (!prompt) {
      result.skipped++;
      continue;
    }
    const kind = detectKind(cell(r, map.kind));
    const options = splitList(cell(r, map.options));
    const rawAnswers = splitList(cell(r, map.answer));
    const issues: string[] = [];
    let corrected = false;
    let answerKeys: string[] = [];

    if (kind === "mcq" || kind === "msq") {
      if (options.length < 2) issues.push(`Only ${options.length} option(s) — needs at least 2`);
      const parts = kind === "mcq" ? rawAnswers.slice(0, 1) : rawAnswers;
      if (parts.length === 0) {
        issues.push("No answer given — needs review");
      } else {
        for (const p of parts) {
          const res = resolveOption(p, options);
          if (res.corrected) corrected = true;
          if (res.issue) issues.push(res.issue);
          answerKeys.push(res.value);
        }
        if (kind === "mcq" && rawAnswers.length > 1) {
          issues.push("Multiple answers given for single-choice — kept first only");
          corrected = true;
        }
      }
    } else if (kind === "short") {
      // Fill-in-the-blank: every listed answer is acceptable.
      answerKeys = rawAnswers;
      if (answerKeys.length === 0) issues.push("No answer given — needs review");
    } else {
      // code: keep reference answer for manual review.
      answerKeys = rawAnswers;
      if (answerKeys.length === 0) issues.push("No reference answer — will need manual review");
    }

    let points = Number(cell(r, map.points));
    if (!Number.isFinite(points) || points <= 0) {
      points = 5;
      corrected = true;
    }

    result.questions.push({
      rowIndex: ri + 1,
      kind,
      prompt,
      options,
      answerKeys,
      points,
      issues,
      corrected,
    });
  }
  return result;
}

/** Parse an uploaded .xlsx/.xls/.csv file into header + data rows. */
export async function parseTestFile(file: File): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: "array" } as never);
  let best: string[][] = [];
  for (const name of workbook.SheetNames) {
    const json = (XLSX.utils.sheet_to_json as (s: unknown, o: unknown) => string[][])(
      workbook.Sheets[name],
      { header: 1, defval: "" }
    );
    if (json.length > best.length) best = json;
  }
  return best.map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? "")) : []));
}
