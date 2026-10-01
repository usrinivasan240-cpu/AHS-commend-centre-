import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

// GET /api/users — list users (filtered by role if query param ?role=marketing)
// Requires x-actor-email of super-admin / core-admin / team-lead / trainer.
// Password fields are never returned.
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const { requireActor, actorErrorResponse } = await import("@/lib/server-auth");
    try {
      await requireActor(req, db, ["super-admin", "core-admin", "team-lead", "trainer", "marketing"]);
    } catch (authErr: unknown) {
      const { msg, status } = actorErrorResponse(authErr);
      return NextResponse.json({ error: msg }, { status });
    }
    const roleFilter = req.nextUrl.searchParams.get("role"); // optional: "marketing", "super-admin"

    const snapshot = await db.collection("users").get();
    const users: unknown[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data() as Record<string, unknown>;
      // Strip secrets — never leak password hashes / tokens to the client.
      const { password: _pw, passwordHash: _ph, ...safe } = data;
      users.push({
        id: doc.id,
        email: (data.email as string) || "",
        name: (data.name as string) || "",
        role: (data.role as string) || "",
        ...safe,
      });
    });

    // Filter by role if specified
    const filtered = roleFilter
      ? (users as Array<{ role: string }>).filter((u) => {
          const roles = roleFilter.split(",");
          return roles.includes(u.role);
        })
      : users;

    return NextResponse.json(filtered);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch users";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
