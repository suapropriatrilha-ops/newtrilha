import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "spt_admin";

function expectedToken(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "troque-este-segredo";
  return createHmac("sha256", secret).update("sua-propria-trilha-admin").digest("hex");
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  if (!value) return false;
  const exp = expectedToken();
  try {
    const a = Buffer.from(value);
    const b = Buffer.from(exp);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Use no topo de cada layout/action protegido.
export async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
}

export async function signIn(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) return false;
  const store = await cookies();
  store.set(COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return true;
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
