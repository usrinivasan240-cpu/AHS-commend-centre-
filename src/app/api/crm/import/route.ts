import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Health check: GET /api/crm/import -> { ok:true } proves route is deployed
export async function GET() {
  return NextResponse.json({ ok: true, route: "crm/import" });
}

type ImportItem = {
  lead: Record<string, any>;
  task: Record<string, any>;
  mergeKey: { name: string; phone: string; email: string };
  rowLabel: string;
};

const norm = (s: any) => String(s || "").trim().toLowerCase();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    let db;
    try {
      const { getAdminDb } = await import("@/lib/firebase/admin");
      db = getAdminDb();
    } catch (e: any) {
      return NextResponse.json(
        { added: 0, merged: 0, skipped: 0, tasksCreated: 0, errors: [`Admin SDK not configured: ${e?.message || e}. Set FIREBASE_ADMIN_PRIVATE_KEY / FIREBASE_ADMIN_CLIENT_EMAIL in Vercel, or keep service JSON at app root.`] },
        { status: 500 }
      );
    }

    // Load existing leads once for dedup against the ENTIRE dataset (cap 2000 for speed).
    // Duplicates are skipped entirely — never re-added, never merged, no task created.
    const existingSnap = await db.collection(COLLECTIONS.LEADS).limit(2000).get();
    const existing = existingSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    let added = 0, skipped = 0, tasksCreated = 0;
    const errors: string[] = [];
    const skippedRows: string[] = [];

    for (const item of items) {
      try {
        const { lead, task, mergeKey } = item;
        const found = existing.find((l: any) => {
          if (mergeKey.name && norm(l.name) === mergeKey.name) return true;
          if (mergeKey.phone && String(l.phone || "").trim() === mergeKey.phone) return true;
          if (mergeKey.email && norm(l.email) === mergeKey.email) return true;
          return false;
        });

        // Global duplicate: already exists anywhere in the dataset — skip it fully
        if (found) {
          skipped++;
          if (skippedRows.length < 10) skippedRows.push(item.rowLabel || lead.name || "row");
          continue;
        }

        let leadId: string | null = null;
        const assignmentFields: Record<string, any> = {};
        if (assignedTo) {
          assignmentFields.assignedTo = assignedTo;
          assignmentFields.assignedAt = assignedAt;
          if (assignedByName) assignmentFields.assignedByName = assignedByName;
        }
        const ref = await db.collection(COLLECTIONS.LEADS).add({
          ...lead,
          ...assignmentFields,
          createdAt: lead.createdAt || new Date().toISOString().split("T")[0],
          updatedAt: new Date().toISOString(),
        });
        leadId = ref.id;
        existing.push({ id: ref.id, ...lead });
        added++;

        try {
          await db.collection(COLLECTIONS.TASKS).add({
            ...task,
            ...(assignedTo ? { assigneeId: assignedTo } : {}),
            description: `${task.description || ""}${leadId ? ` | LeadID:${leadId}` : ""}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          tasksCreated++;
        } catch (taskErr: any) {
          errors.push(`${item.rowLabel} task: ${taskErr?.message || String(taskErr)}`);
        }
      } catch (rowErr: any) {
        errors.push(`${item.rowLabel}: ${rowErr?.message || "write failed"}`);
      }
    }

    if (skippedRows.length > 0) {
      errors.push(`${skipped} duplicate row${skipped === 1 ? "" : "s"} skipped (already in dataset): ${skippedRows.join("; ")}${skipped > skippedRows.length ? ` +${skipped - skippedRows.length} more` : ""}`);
    }
    return NextResponse.json({ added, merged: 0, skipped, tasksCreated, total: added, errors });
  } catch (e: any) {
    return NextResponse.json({ added: 0, merged: 0, skipped: 0, tasksCreated: 0, errors: [`Import API failed: ${e?.message || String(e)}`] }, { status: 500 });
  }
}
