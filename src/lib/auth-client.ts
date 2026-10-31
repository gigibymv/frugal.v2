export interface AccountUser { id: string; email: string; name: string }

export async function authRequest<T>(path: string, body?: object): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`/api/auth/${path}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin", cache: "no-store", signal: controller.signal,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 429) throw new Error("Too many attempts. Please try again in a minute.");
      if (response.status === 503) throw new Error("Account service is temporarily unavailable. Please try again.");
      throw new Error(result?.message || "Could not complete this request. Please try again.");
    }
    return result as T;
  } finally { clearTimeout(timeout); }
}
