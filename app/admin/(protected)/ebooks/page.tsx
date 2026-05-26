import { createAdminClient } from "@/lib/supabase-admin";
import EbooksClient, { Livro } from "./ebooks-client";

export const dynamic = "force-dynamic";

export default async function EbooksPage() {
  const db = createAdminClient();
  const { data } = await db
    .from("livros")
    .select("id, slug, titulo, descricao, preco, ativo, arquivo_path")
    .order("criado_em", { ascending: false });

  return (
    <>
      <div className="spt-pagehead">
        <h1>Ebooks</h1>
        <p>Cadastre, publique e gerencie o catálogo da trilha.</p>
      </div>
      <EbooksClient livros={(data as Livro[]) || []} />
    </>
  );
}
