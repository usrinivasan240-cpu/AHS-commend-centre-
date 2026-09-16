import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

// GET /api/users — list users (filtered by role if query param ?role=marketing)
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const roleFilter = req.nextUrl.searchParams.get("role"); // optional: "marketing", "super-admin"
    
    const snapshot = await db.collection("users").get();
    const users: any[] = [];
    
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email || "",
        name: data.name || "",
        role: data.role || "",
        ...data,
      });
    });

    // Filter by role if specified
    const filtered = roleFilter
      ? users.filter((u) => {
          const roles = roleFilter.split(",");
          return roles.includes(u.role);
        })
      : users;

    return NextResponse.json(filtered);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}
