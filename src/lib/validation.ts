export class ValidationError extends Error {}

export function text(value: unknown, name: string, max = 150, required = true): string {
  if (typeof value !== "string") {
    if (!required && (value === undefined || value === null)) return "";
    throw new ValidationError(`Please enter ${name}.`);
  }
  const result = value.trim();
  if (required && !result) throw new ValidationError(`Please enter ${name}.`);
  if (result.length > max) throw new ValidationError(`${name} must be ${max} characters or fewer.`);
  return result;
}

export function phone(value: unknown): string {
  const result = text(value, "a valid phone number", 25);
  const digits = result.replace(/\D/g, "");
  if (!/^\+?[\d\s()-]+$/.test(result) || digits.length < 9 || digits.length > 15) {
    throw new ValidationError("Please enter a valid phone number, for example 0884 985 461.");
  }
  return digits.startsWith("265") && digits.length === 12 ? `0${digits.slice(3)}` : digits;
}

export function email(value: unknown): string {
  const result = text(value, "email address", 200, false);
  if (result && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new ValidationError("Please enter a valid email address.");
  return result;
}

export function choice(value: unknown, options: string[], name: string): string {
  if (typeof value !== "string" || !options.includes(value)) throw new ValidationError(`Please select ${name}.`);
  return value;
}

export function date(value: unknown): string {
  const result = text(value, "a preferred date", 10);
  const parsed = new Date(`${result}T12:00:00Z`);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Blantyre", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result || result < today) {
    throw new ValidationError("Please choose today or a future date.");
  }
  const lastDay = new Date();
  lastDay.setMonth(lastDay.getMonth() + 6);
  if (parsed > lastDay) throw new ValidationError("Please choose a date within the next six months.");
  return result;
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  const bodyText = await request.text();
  if (bodyText.length > 20000) throw new ValidationError("Your request is too large.");
  try {
    const data: unknown = JSON.parse(bodyText);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
    return data as Record<string, unknown>;
  } catch {
    throw new ValidationError("Please send a valid request.");
  }
}

export function apiError(error: unknown): Response {
  if (error instanceof ValidationError) return Response.json({ error: error.message }, { status: 400 });
  console.error("Store request failed:", error);
  return Response.json({ error: "We couldn’t save your request. Please try again or call 0884 985 461." }, { status: 500 });
}
