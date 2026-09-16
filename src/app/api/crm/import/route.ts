import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/types";

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
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ added: 0, merged: 0, tasksCreated: 0, errors: ["No rows to import"] }, { status: 400 });
    }
    if (items.length > 500) {
      return NextResponse.json({ added: 0, merged: 0, tasksCreated: 0, errors: ["Too many rows (max 500 per batch)"] }, { status: 400 });
    }

    let db;
    try {
      db = getAdminDb();
    } catch (e: any) {
      return NextResponse.json(
        { added: 0, merged: 0, tasksCreated: 0, errors: [`Admin SDK not configured: ${e?.message || e}. Set FIREBASE_ADMIN_PRIVATE_KEY / FIREBASE_ADMIN_CLIENT_EMAIL in Vercel, or keep service JSON at app root.`] },
        { status: 500 }
      );
    }

    // Load existing leads once for dedup (cap 2000 for speed)
    const existingSnap = await db.collection(COLLECTIONS.LEADS).limit(2000).get();
    const existing = existingSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    let added = 0, merged = 0, tasksCreated = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        const { lead, task, mergeKey } = item;
        const found = existing.find((l: any) => {
          if (mergeKey.name && norm(l.name) === mergeKey.name) return true;
          if (mergeKey.phone && String(l.phone || "").trim() === mergeKey.phone) return true;
          if (mergeKey.email && norm(l.email) === mergeKey.email) return true;
          return false;
        });

        let leadId: string | null = null;
        if (found) {
          const mergedData = { ...(found.rawData || {}), ...(lead.rawData || {}) };
          const updateFields: Record<string, any> = { rawData: mergedData, updatedAt: new Date().toISOString() };
          if (lead.phone && !found.phone) updateFields.phone = lead.phone;
          if (lead.email && !found.email) updateFields.email = lead.email;
          if (lead.category && (!found.category || found.category === "Uncategorized")) updateFields.category = lead.category;
          if (lead.value && (lead.value as number) > (found.value || 0)) updateFields.value = lead.value;
          await db.collection(COLLECTIONS.LEADS).doc(found.id).update(updateFields);
          leadId = found.id;
          Object.assign(found, updateFields);
          merged++;
        } else {
          const ref = await db.collection(COLLECTIONS.LEADS).add({
            ...lead,
            createdAt: lead.createdAt || new Date().toISOString().split("T")[0],
            updatedAt: new Date().toISOString(),
          });
          leadId = ref.id;
          existing.push({ id: ref.id, ...lead });
          added++;
        }

        try {
          await db.collection(COLLECTIONS.TASKS).add({
            ...task,
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

    return NextResponse.json({ added, merged, tasksCreated, total: added + merged, errors });
  } catch (e: any) {
    return NextResponse.json({ added: 0, merged: 0, tasksCreated: 0, errors: [`Import API failed: ${e?.message || String(e)}`] }, { status: 500 });
  }
}
