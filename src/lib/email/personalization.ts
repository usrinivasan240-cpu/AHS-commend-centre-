export function resolveTemplate(template: string, data: Record<string, string>): { resolved: string; missing: string[] } {
  const missing: string[] = [];
  const resolved = template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const v = data[key] ?? data[key.toLowerCase()];
    if (v === undefined || v === null || String(v).trim() === "") {
      missing.push(key);
      return `{{${key}}}`;
    }
    return String(v);
  });
  return { resolved, missing };
}

export function buildLeadData(row: {
  lead_name: string;
  first_name?: string;
  last_name?: string;
  company: string;
  category?: string;
  email: string;
  country?: string;
  industry?: string;
  phone?: string;
  website?: string;
}): Record<string, string> {
  const parts = row.lead_name.trim().split(/\s+/);
  const first = row.first_name || parts[0] || "";
  const last = row.last_name || parts.slice(1).join(" ") || "";
  return {
    lead_name: row.lead_name,
    first_name: first,
    last_name: last,
    company: row.company,
    category: row.category || "",
    email: row.email,
    country: row.country || "",
    industry: row.industry || "",
    phone: row.phone || "",
    website: row.website || "",
  };
}

export function hasUnresolvedPlaceholders(content: string, data: Record<string, string>): string[] {
  const { missing } = resolveTemplate(content, data);
  return missing;
}
