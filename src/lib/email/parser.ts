import * as XLSX from "xlsx";
import { detectColumnMapping } from "./column-mapper";
import type { ColumnKey } from "./column-mapper";

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  mapping: Record<ColumnKey, string | null>;
  confidence: "high" | "medium" | "low";
}

export async function parseFile(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: "array" } as any);
  let sheetName = workbook.SheetNames[0];
  let chosenSheet = workbook.Sheets[sheetName];
  for (const name of workbook.SheetNames) {
    const s = workbook.Sheets[name];
    const json = (XLSX.utils.sheet_to_json as any)(s, { header: 1, defval: "" }) as unknown as string[][];
    if (json.length > 1) {
      sheetName = name;
      chosenSheet = s;
      break;
    }
  }
  const json = (XLSX.utils.sheet_to_json as any)(chosenSheet, { defval: "" }) as Record<string, string>[];
  if (json.length === 0) return { headers: [], rows: [], mapping: detectColumnMapping([]), confidence: "low" };
  const headers = Object.keys(json[0] as object).map((h) => String(h).trim());
  const rows = (json as Record<string, unknown>[]).map((r) => {
    const rec: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) rec[k] = v == null ? "" : String(v).trim();
    return rec;
  });
  const mapping = detectColumnMapping(headers);
  const { confidenceForMapping } = await import("./column-mapper");
  const confidence = confidenceForMapping(mapping);
  return { headers, rows, mapping, confidence };
}
