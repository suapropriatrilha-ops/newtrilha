"use server";
import { createAdminClient } from "@/lib/supabase-admin";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type Result = { ok: boolean; error?: string };

export async function atualizarStatus(id: string, status: string): Promise<Result> {
  await requireAuth();
  const db = createAdminClient();
  const { error } = await db.from("compras").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/compras");
  revalidatePath("/admin");
  return { ok: true };
}

// Cria uma compra "paga" manualmente — libera o acesso de um e-mail a um ebook.
export async function liberarAcessoManual(payload: {
  email: string;
  livro_slug: string;
  valor?: number;
}): Promise<Result> {
  await requireAuth();
  const email = payload.email.trim().toLowerCase();
  if (!email || !payload.livro_slug) {
    return { ok: false, error: "Informe o e-mail e o ebook." };
  }
  const db = createAdminClient();
  const { error } = await db.from("compras").insert({
    email,
    livro_slug: payload.livro_slug,
    status: "paid",
    metodo: "manual",
    valor: payload.valor ?? 0,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/compras");
  revalidatePath("/admin");
  return { ok: true };
}

export async function excluirCompra(id: string): Promise<Result> {
  await requireAuth();
  const db = createAdminClient();
  const { error } = await db.from("compras").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/compras");
  revalidatePath("/admin");
  return { ok: true };
}
