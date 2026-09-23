import type { ParsedLeadRow, ValidationSummary } from "@/types/email-campaign";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function validateRows(
  rows: ParsedLeadRow[],
  suppressionSet: Set<string>
): { rows: ParsedLeadRow[]; summary: ValidationSummary } {
  const emailCounts = new Map<string, number>();
  rows.forEach((r) => {
    const e = r.mapped.email?.toLowerCase().trim();
    if (e) emailCounts.set(e, (emailCounts.get(e) || 0) + 1);
  });

  const seenForDuplicate = new Set<string>();
  let suppressed = 0;

  const validated = rows.map((r) => {
    const errors: string[] = [];
    const email = r.mapped.email?.trim() ?? "";
    const lower = email.toLowerCase();

    if (!email) {
      errors.push("Missing email");
    } else if (!isValidEmail(email)) {
      errors.push("Invalid email");
    }

    if (!r.mapped.lead_name?.trim()) errors.push("Missing lead name");
    if (!r.mapped.company?.trim()) errors.push("Missing company");
    if (!r.mapped.email_content?.trim()) errors.push("Missing email content");

    const isDuplicate = email ? (emailCounts.get(lower) ?? 0) > 1 && seenForDuplicate.has(lower) : false;
    // mark first occurrence not duplicate, subsequent are duplicate
    let duplicateFlag = false;
    if (email && (emailCounts.get(lower) ?? 0) > 1) {
      if (seenForDuplicate.has(lower)) {
        errors.push("Duplicate email in file");
        duplicateFlag = true;
      } else {
        seenForDuplicate.add(lower);
      }
    }

    const isSuppressed = email ? suppressionSet.has(lower) : false;
    if (isSuppressed) {
      errors.push("Suppressed (do-not-contact)");
      suppressed++;
    }

    const isValid = errors.length === 0;

    return {
      ...r,
      errors,
      isValid,
      isDuplicate: duplicateFlag,
      isSuppressed,
    };
  });

  const summary: ValidationSummary = {
    totalRows: rows.length,
    valid: validated.filter((r) => r.isValid).length,
    invalidEmails: validated.filter((r) => r.errors.includes("Invalid email")).length,
    missingEmails: validated.filter((r) => r.errors.includes("Missing email")).length,
    duplicateEmails: validated.filter((r) => r.isDuplicate).length,
    missingContent: validated.filter((r) => r.errors.includes("Missing email content")).length,
    missingLeadNames: validated.filter((r) => r.errors.includes("Missing lead name")).length,
    missingCompanies: validated.filter((r) => r.errors.includes("Missing company")).length,
    suppressed,
  };

  return { rows: validated, summary };
}
