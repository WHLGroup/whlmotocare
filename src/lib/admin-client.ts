"use client";

export class AdminRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(path, { ...options, credentials: "same-origin", cache: "no-store" }); }
  catch { throw new AdminRequestError("Couldn’t connect. Check your connection and try again.", 0); }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new AdminRequestError(data?.error ?? "We couldn’t save this change. Please try again.", response.status);
  if (!data) throw new AdminRequestError("The server returned an unexpected response. Please try again.", response.status);
  return data as T;
}

export const jsonRequest = (method: string, data: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
