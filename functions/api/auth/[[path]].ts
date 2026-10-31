import { createAuth, type Env } from "../../../server/auth";
import { isSameOrigin, json, limitedBody } from "../../../server/http";

const allowed = new Map([
  ["/api/auth/sign-up/email", "POST"],
  ["/api/auth/sign-in/email", "POST"],
  ["/api/auth/sign-out", "POST"],
  ["/api/auth/get-session", "GET"],
]);

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const expectedMethod = allowed.get(new URL(request.url).pathname);
    if (!expectedMethod) return json({ error: "Not found" }, 404);
    if (request.method !== expectedMethod) return json({ error: "Method not allowed" }, 405, { Allow: expectedMethod });
    const auth = createAuth(env);
    if (request.method === "POST") {
      if (!isSameOrigin(request, env)) return json({ error: "Invalid request origin" }, 403);
      if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
        return json({ error: "Expected JSON" }, 415);
      }
      let body: string;
      try {
        body = await limitedBody(request, 16_384);
        JSON.parse(body);
      } catch {
        return json({ error: "Invalid or oversized request" }, 400);
      }
      request = new Request(request.url, { method: request.method, headers: request.headers, body });
    }
    const response = await auth.handler(request);
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return json({ error: "Account service is unavailable. Please try again later." }, 503);
  }
};
