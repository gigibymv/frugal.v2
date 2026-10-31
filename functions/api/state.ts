import { createAuth, type Env } from "../../server/auth";
import { isSameOrigin, json, limitedBody } from "../../server/http";
import { saveStateSchema, snapshotSchema } from "../../shared/snapshot";

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== "GET" && request.method !== "PUT") {
    return json({ error: "Method not allowed" }, 405, { Allow: "GET, PUT" });
  }
  try {
    const auth = createAuth(env);
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return json({ error: "Please sign in again" }, 401);
    if (request.method === "GET") {
      const ownerId = new URL(request.url).searchParams.get("ownerId");
      if (ownerId !== session.user.id) return json({ error: "Account changed. Please sign in again." }, 403);
      const row = await env.DB.prepare("SELECT revision, data FROM budget_state WHERE user_id = ?")
        .bind(session.user.id).first<{ revision: number; data: string }>();
      if (!row) return json({ revision: 0, data: null });
      const data = snapshotSchema.safeParse(JSON.parse(row.data));
      if (!data.success) return json({ error: "Saved data could not be loaded" }, 500);
      return json({ revision: row.revision, data: data.data });
    }
    if (!isSameOrigin(request, env)) return json({ error: "Invalid request origin" }, 403);
    if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
      return json({ error: "Expected JSON" }, 415);
    }
    let input: ReturnType<typeof saveStateSchema.parse>;
    try {
      input = saveStateSchema.parse(JSON.parse(await limitedBody(request, 2_000_000)));
    } catch {
      return json({ error: "Invalid or oversized budget data" }, 400);
    }
    if (input.ownerId !== session.user.id) return json({ error: "Account changed. Please sign in again." }, 403);
    const payload = JSON.stringify(input.data);
    // Each mutation is one atomic statement; a stale revision never overwrites a newer save.
    const row = input.revision === 0
      ? await env.DB.prepare("INSERT INTO budget_state (user_id, revision, data, updated_at, last_mutation_id) VALUES (?, 1, ?, ?, ?) ON CONFLICT (user_id) DO NOTHING RETURNING revision")
          .bind(session.user.id, payload, new Date().toISOString(), input.mutationId).first<{ revision: number }>()
      : await env.DB.prepare("UPDATE budget_state SET revision = revision + 1, data = ?, updated_at = ?, last_mutation_id = ? WHERE user_id = ? AND revision = ? AND last_mutation_id <> ? RETURNING revision")
          .bind(payload, new Date().toISOString(), input.mutationId, session.user.id, input.revision, input.mutationId).first<{ revision: number }>();
    if (!row) {
      // A lost response can be retried with the same mutation ID and original revision.
      // Only acknowledge an exact replay; a reused ID with a new payload is a conflict.
      const saved = await env.DB.prepare("SELECT revision, data, last_mutation_id FROM budget_state WHERE user_id = ?")
        .bind(session.user.id).first<{ revision: number; data: string; last_mutation_id: string }>();
      if (saved?.last_mutation_id === input.mutationId && saved.revision === input.revision + 1 && saved.data === payload) {
        return json({ revision: saved.revision });
      }
      return json({ error: "This budget changed on another device. Your changes have not been saved." }, 409);
    }
    return json({ revision: row.revision });
  } catch {
    return json({ error: "Budget service is unavailable. Please try again later." }, 503);
  }
};
