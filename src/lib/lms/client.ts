// Client-side fetch helpers for LMS Admin SDK API routes.
// Every call carries actorEmail (resolved server-side to the users doc + role).

export async function lmsGet<T>(path: string, actorEmail: string, params: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ actorEmail, ...params });
  const res = await fetch(`${path}?${qs.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export async function lmsPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export const LMS_COURSE_ID = "AHS-AI-BOOTCAMP";
