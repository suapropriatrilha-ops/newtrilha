"use server";
import { createAdminClient, BUCKET_EBOOKS } from "@/lib/supabase-admin";
import { requireAuth } from "@/lib/auth";
import { sanitizeFilename, slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

type Result = { ok: boolean; error?: string };

// 1) Pede uma URL assinada pra o navegador enviar o PDF direto pro Storage.
// O nome do arquivo é higienizado aqui (sem acento/espaço) — fim do "File name is invalid".
export async function prepareUpload(originalName: string) {
  await requireAuth();
  const db = createAdminClient();
  const safe = sanitizeFilename(originalName);
  const path = `${Date.now()}-${safe}`;
  const { data, error } = await db.storage
    .from(BUCKET_EBOOKS)
    .createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: error?.message };
  return { ok: true, path: data.path, token: data.token };
}

export async function createEbook(payload: {
  titulo: string;
  slug?: string;
  descricao?: string;
  preco: number;
  ativo: boolean;
  arquivo_path?: string;
  capa_url?: string;
}): Promise<Result> {
  await requireAuth();
  const db = createAdminClient();
  const slug = slugify(payload.slug || payload.titulo);
  if (!payload.titulo.trim()) return { ok: false, error: "Título é obrigatório." };

  const { error } = await db.from("livros").insert({
    titulo: payload.titulo.trim(),
    slug,
    descricao: payload.descricao || null,
    preco: payload.preco || 0,
    ativo: payload.ativo,
    arquivo_path: payload.arquivo_path || null,
    capa_url: payload.capa_url || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/ebooks");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateEbook(
  id: string,
  payload: {
    titulo: string;
    slug: string;
    descricao?: string;
    preco: number;
    ativo: boolean;
    arquivo_path?: string;
    capa_url?: string;
  }
): Promise<Result> {
  await requireAuth();
  const db = createAdminClient();
  const update: Record<string, unknown> = {
    titulo: payload.titulo.trim(),
    slug: slugify(payload.slug || payload.titulo),
    descricao: payload.descricao || null,
    preco: payload.preco || 0,
    ativo: payload.ativo,
    capa_url: payload.capa_url || null,
  };
  if (payload.arquivo_path) update.arquivo_path = payload.arquivo_path;

  const { error } = await db.from("livros").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/ebooks");
  return { ok: true };
}

export async function toggleAtivo(id: string, ativo: boolean): Promise<Result> {
  await requireAuth();
  const db = createAdminClient();
  const { error } = await db.from("livros").update({ ativo }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/ebooks");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteEbook(id: string): Promise<Result> {
  await requireAuth();
  const db = createAdminClient();
  const { data: livro } = await db
    .from("livros")
    .select("arquivo_path")
    .eq("id", id)
    .single();
  if (livro?.arquivo_path) {
    await db.storage.from(BUCKET_EBOOKS).remove([livro.arquivo_path]);
  }
  const { error } = await db.from("livros").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/ebooks");
  revalidatePath("/admin");
  return { ok: true };
}

// Gera um link temporário (1h) pra você conferir o PDF.
export async function getDownloadUrl(arquivo_path: string) {
  await requireAuth();
  const db = createAdminClient();
  const { data, error } = await db.storage
    .from(BUCKET_EBOOKS)
    .createSignedUrl(arquivo_path, 60 * 60);
  if (error || !data) return { ok: false, error: error?.message };
  return { ok: true, url: data.signedUrl };
}
