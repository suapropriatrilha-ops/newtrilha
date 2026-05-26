import { createAdminClient } from "@/lib/supabase-admin";
import ComprasClient, { Compra, LivroOpc } from "./compras-client";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const db = createAdminClient();
  const [compras, livros] = await Promise.all([
    db
      .from("compras")
      .select("id, email, livro_slug, payment_id, status, valor, metodo, criado_em")
      .order("criado_em", { ascending: false })
      .limit(500),
    db.from("livros").select("slug, titulo").order("titulo"),
  ]);

  return (
    <>
      <div className="spt-pagehead">
        <h1>Compras</h1>
        <p>Acompanhe vendas, libere acessos e resolva pagamentos travados.</p>
      </div>
      <ComprasClient
        compras={(compras.data as Compra[]) || []}
        livros={(livros.data as LivroOpc[]) || []}
      />
    </>
  );
}
