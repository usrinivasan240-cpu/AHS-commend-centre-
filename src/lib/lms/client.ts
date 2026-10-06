// Client-side fetch helpers for LMS Admin SDK API routes.
// Every call carries actorEmail (resolved server-side to the users doc + role)
// via BOTH query/body (back-compat) and x-actor-email header (preferred).

function actorHeaders(actorEmail: string): Record<string, string> {
  return actorEmail ? { "x-actor-email": actorEmail } : {};
}

export async function lmsGet<T>(path: string, actorEmail: string, params: Record<string, string> = {}): Promise<T> {
  if (!actorEmail) throw new Error("Not authenticated — please sign in again");
  const qs = new URLSearchParams({ actorEmail, ...params });
  const res = await fetch(`${path}?${qs.toString()}`, { headers: { ...actorHeaders(actorEmail) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export async function lmsPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const actorEmail = typeof body.actorEmail === "string" ? body.actorEmail : "";
  if (!actorEmail) throw new Error("Not authenticated — please sign in again");
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...actorHeaders(actorEmail) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export const LMS_COURSE_ID = "AHS-AI-BOOTCAMP";
