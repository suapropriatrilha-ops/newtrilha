"use server";
import { signIn } from "@/lib/auth";

export async function loginAction(password: string) {
  const ok = await signIn(password);
  return ok ? { ok: true } : { ok: false, error: "Senha incorreta." };
}
