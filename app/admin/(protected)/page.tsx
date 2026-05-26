import { createAdminClient } from "@/lib/supabase-admin";
import { brl, dataBR } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGOS = ["paid", "approved", "pago", "aprovado", "completed"];

export default async function DashboardPage() {
  const db = createAdminClient();

  const [livros, comprasCount, pagas, pendentes, receitaRows, recentes] =
    await Promise.all([
      db.from("livros").select("id, ativo"),
      db.from("compras").select("id", { count: "exact", head: true }),
      db.from("compras").select("id", { count: "exact", head: true }).in("status", PAGOS),
      db.from("compras").select("id", { count: "exact", head: true }).eq("status", "pending"),
      db.from("compras").select("valor").in("status", PAGOS),
      db.from("compras").select("email, livro_slug, valor, status, criado_em").order("criado_em", { ascending: false }).limit(8),
    ]);

  const totalLivros = livros.data?.length ?? 0;
  const ativos = livros.data?.filter((l) => l.ativo).length ?? 0;
  const receita = (receitaRows.data ?? []).reduce((s, r) => s + Number(r.valor || 0), 0);

  return (
    <>
      <div className="spt-pagehead">
        <h1>Visão geral</h1>
        <p>O panorama da Sua Própria Trilha em tempo real.</p>
      </div>

      <div className="spt-grid spt-metrics" style={{ marginBottom: 28 }}>
        <div className="spt-metric">
          <div className="label">Receita</div>
          <div className="value spt-mono">{brl(receita)}</div>
          <div className="sub">de vendas aprovadas</div>
        </div>
        <div className="spt-metric">
          <div className="label">Vendas pagas</div>
          <div className="value spt-mono">{pagas.count ?? 0}</div>
          <div className="sub">{pendentes.count ?? 0} pendentes</div>
        </div>
        <div className="spt-metric">
          <div className="label">Compras (total)</div>
          <div className="value spt-mono">{comprasCount.count ?? 0}</div>
          <div className="sub">todos os status</div>
        </div>
        <div className="spt-metric">
          <div className="label">Ebooks</div>
          <div className="value spt-mono">{ativos}</div>
          <div className="sub">{totalLivros} no catálogo</div>
        </div>
      </div>

      <div className="spt-card">
        <h2>Compras recentes</h2>
        {recentes.data && recentes.data.length > 0 ? (
          <table className="spt-table">
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Ebook</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {recentes.data.map((c, i) => (
                <tr key={i}>
                  <td>{c.email}</td>
                  <td className="spt-muted">{c.livro_slug}</td>
                  <td className="spt-mono">{brl(Number(c.valor))}</td>
                  <td>
                    <span className={`spt-badge ${PAGOS.includes(c.status) ? "ok" : "warn"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="spt-muted spt-mono">{dataBR(c.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="spt-empty">Nenhuma compra ainda. <Link href="/admin/ebooks" style={{ color: "var(--clay)" }}>Cadastre seus ebooks</Link> pra começar.</div>
        )}
      </div>
    </>
  );
}
