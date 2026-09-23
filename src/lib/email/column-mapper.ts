export type ColumnKey =
  | "lead_name"
  | "first_name"
  | "last_name"
  | "company"
  | "category"
  | "email"
  | "email_content"
  | "subject"
  | "country"
  | "industry"
  | "phone"
  | "website"
  | "source"
  | "generated_date";

const VARIATIONS: Record<ColumnKey, string[]> = {
  lead_name: ["lead name", "lead_name", "leadname", "name", "contact name", "contact_name", "full name", "fullname", "lead"],
  first_name: ["first name", "first_name", "firstname", "fname", "given name"],
  last_name: ["last name", "last_name", "lastname", "lname", "surname", "family name"],
  company: ["company", "company name", "company_name", "organisation", "organization", "org", "firm", "business"],
  category: ["category", "cat", "segment", "vertical", "type"],
  email: ["email", "email address", "email_address", "e-mail", "e-mail address", "mail", "contact email"],
  email_content: ["generated email content", "email content", "email_content", "content", "body", "email body", "email_body", "message", "generated content", "email text"],
  subject: ["subject", "email subject", "subject line", "subject_line", "title"],
  country: ["country", "nation", "location country"],
  industry: ["industry", "sector", "domain"],
  phone: ["phone", "phone number", "phone_number", "mobile", "contact", "tel", "telephone"],
  website: ["website", "web site", "url", "site", "domain", "web"],
  source: ["source", "lead source", "lead_source", "origin"],
  generated_date: ["generated date", "generated_date", "generation date", "date", "created date", "gen date"],
};

function normalize(h: string): string {
  return h.toLowerCase().trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function detectColumnMapping(headers: string[]): Record<ColumnKey, string | null> {
  const normalizedHeaders = headers.map((h) => ({ original: h, norm: normalize(h) }));
  const result = {} as Record<ColumnKey, string | null>;
  const usedHeaders = new Set<string>();
  (Object.keys(VARIATIONS) as ColumnKey[]).forEach((key) => {
    const vars = VARIATIONS[key].map(normalize);
    let best: string | null = null;
    let bestScore = -1;
    for (const { original, norm } of normalizedHeaders) {
      if (usedHeaders.has(original)) continue;
      let score = -1;
      if (vars.includes(norm)) score = 100;
      else if (vars.some((v) => norm === v)) score = 90;
      else if (vars.some((v) => norm.includes(v) || v.includes(norm))) score = 50;
      if (score > bestScore) {
        bestScore = score;
        best = original;
      }
    }
    if (bestScore >= 50 && best) {
      result[key] = best;
      usedHeaders.add(best);
    } else {
      result[key] = null;
    }
  });
  return result;
}

export function confidenceForMapping(mapping: Record<ColumnKey, string | null>): "high" | "medium" | "low" {
  const required: ColumnKey[] = ["email", "lead_name", "company", "email_content"];
  const mappedRequired = required.filter((k) => mapping[k] !== null).length;
  if (mappedRequired === 4) return "high";
  if (mappedRequired >= 3) return "medium";
  return "low";
}

export function headerVariationsFor(key: ColumnKey): string[] {
  return VARIATIONS[key];
}
