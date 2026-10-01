import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Health check: GET /api/crm/import -> { ok:true } proves route is deployed
export async function GET() {
  return NextResponse.json({ ok: true, route: "crm/import" });
}

type ImportItem = {
  lead: Record<string, unknown>;
  task: Record<string, unknown>;
  mergeKey: { name: string; phone: string; email: string };
  rowLabel: string;
};

const norm = (s: unknown) => String(s || "").trim().toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let db;
    try {
      const { getAdminDb } = await import("@/lib/firebase/admin");
      db = getAdminDb();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        { added: 0, merged: 0, skipped: 0, tasksCreated: 0, errors: [`Admin SDK not configured: ${msg}.`] },
        { status: 500 }
      );
    }
    const { requireActor, actorErrorResponse } = await import("@/lib/server-auth");
    try {
      await requireActor(req, db, ["super-admin", "core-admin", "marketing"], body);
    } catch (authErr: unknown) {
      const { msg, status } = actorErrorResponse(authErr);
      return NextResponse.json(
        { added: 0, merged: 0, skipped: 0, tasksCreated: 0, errors: [msg] },
        { status }
      );
    }

    const items: ImportItem[] = body?.items || [];
    const assignedTo: string | undefined = body?.assignedTo || undefined;
    const assignedByName: string | undefined = body?.assignedByName || undefined;
    const assignedAt = assignedTo ? new Date().toISOString() : undefined;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ added: 0, merged: 0, skipped: 0, tasksCreated: 0, errors: ["No rows to import"] }, { status: 400 });
    }
    if (items.length > 500) {
      return NextResponse.json({ added: 0, merged: 0, skipped: 0, tasksCreated: 0, errors: ["Too many rows (max 500 per batch)"] }, { status: 400 });
    }

    // Load existing leads once for dedup against the ENTIRE dataset (cap 2000 for speed).
    const existingSnap = await db.collection(COLLECTIONS.LEADS).limit(2000).get();
    const existing = existingSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

    let added = 0, skipped = 0, tasksCreated = 0;
    const errors: string[] = [];
    const skippedRows: string[] = [];

    for (const item of items) {
      try {
        const { lead, task, mergeKey } = item;
        if (!lead || typeof lead !== "object") {
          errors.push(`${item.rowLabel || "row"}: missing lead object`);
          continue;
        }
        // Basic row validation — never import rows without a name/company or with bad email.
        const leadRec = lead as Record<string, unknown>;
        if (!leadRec.name && !leadRec.company) {
          errors.push(`${item.rowLabel || "row"}: lead.name or lead.company required`);
          continue;
        }
        if (leadRec.email && !EMAIL_RE.test(String(leadRec.email))) {
          errors.push(`${item.rowLabel || "row"}: invalid email '${leadRec.email}'`);
          continue;
        }
        // Strip any client-supplied secret / privilege fields.
        const { password: _pw, passwordHash: _ph, role: _role, ...safeLead } = leadRec;
        const found = existing.find((l: Record<string, unknown>) => {
          if (mergeKey?.name && norm(l.name) === norm(mergeKey.name)) return true;
          if (mergeKey?.phone && String(l.phone || "").trim() === String(mergeKey.phone || "").trim() && mergeKey.phone) return true;
          if (mergeKey?.email && norm(l.email) === norm(mergeKey.email)) return true;
          return false;
        });

        if (found) {
          skipped++;
          if (skippedRows.length < 10) skippedRows.push(item.rowLabel || String(safeLead.name || "row"));
          continue;
        }

        let leadId: string | null = null;
        const assignmentFields: Record<string, unknown> = {};
        if (assignedTo) {
          assignmentFields.assignedTo = assignedTo;
          assignmentFields.assignedAt = assignedAt;
          if (assignedByName) assignmentFields.assignedByName = assignedByName;
        }
        const ref = await db.collection(COLLECTIONS.LEADS).add({
          ...safeLead,
          ...assignmentFields,
          createdAt: (safeLead.createdAt as string) || new Date().toISOString().split("T")[0],
          updatedAt: new Date().toISOString(),
        });
        leadId = ref.id;
        existing.push({ id: ref.id, ...safeLead });
        added++;

        try {
          const taskRec = (task || {}) as Record<string, unknown>;
          await db.collection(COLLECTIONS.TASKS).add({
            ...taskRec,
            ...(assignedTo ? { assigneeId: assignedTo } : {}),
            description: `${String(taskRec.description || "")}${leadId ? ` | LeadID:${leadId}` : ""}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          tasksCreated++;
        } catch (taskErr: unknown) {
          const msg = taskErr instanceof Error ? taskErr.message : String(taskErr);
          errors.push(`${item.rowLabel} task: ${msg}`);
        }
      } catch (rowErr: unknown) {
        const msg = rowErr instanceof Error ? rowErr.message : "write failed";
        errors.push(`${item.rowLabel}: ${msg}`);
      }
    }

    if (skippedRows.length > 0) {
      errors.push(`${skipped} duplicate row${skipped === 1 ? "" : "s"} skipped (already in dataset): ${skippedRows.join("; ")}${skipped > skippedRows.length ? ` +${skipped - skippedRows.length} more` : ""}`);
    }
    return NextResponse.json({ added, merged: 0, skipped, tasksCreated, total: added, errors });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ added: 0, merged: 0, skipped: 0, tasksCreated: 0, errors: [`Import API failed: ${msg}`] }, { status: 500 });
  }
}
