"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { brl, dataBR } from "@/lib/utils";
import { atualizarStatus, liberarAcessoManual, excluirCompra } from "./actions";

const PAGOS = ["paid", "approved", "pago", "aprovado", "completed"];

export type Compra = {
  id: string;
  email: string;
  livro_slug: string | null;
  payment_id: string | null;
  status: string;
  valor: number | null;
  metodo: string | null;
  criado_em: string;
};

export type LivroOpc = { slug: string; titulo: string };

export default function ComprasClient({
  compras,
  livros,
}: {
  compras: Compra[];
  livros: LivroOpc[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openGrant, setOpenGrant] = useState(false);
  const [grant, setGrant] = useState({ email: "", slug: "", valor: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return compras.filter((c) => {
      const matchQ = q ? c.email.toLowerCase().includes(q.toLowerCase()) : true;
      const matchS =
        statusFilter === "all"
          ? true
          : statusFilter === "paid"
          ? PAGOS.includes(c.status)
          : c.status === "pending";
      return matchQ && matchS;
    });
  }, [compras, q, statusFilter]);

  async function setStatus(id: string, status: string) {
    await atualizarStatus(id, status);
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!confirm("Excluir esta compra?")) return;
    await excluirCompra(id);
    router.refresh();
  }

  async function submitGrant() {
    setError(null);
    if (!grant.email.trim() || !grant.slug) {
      setError("Informe o e-mail e selecione o ebook.");
      return;
    }
    setBusy(true);
    const res = await liberarAcessoManual({
      email: grant.email,
      livro_slug: grant.slug,
      valor: parseFloat(grant.valor) || 0,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error || "Erro ao liberar acesso.");
      return;
    }
    setGrant({ email: "", slug: "", valor: "" });
    setOpenGrant(false);
    router.refresh();
  }

  return (
    <>
      <div className="spt-toolbar">
        <input
          className="spt-input"
          placeholder="Buscar por e-mail…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ minWidth: 240 }}
        />
        <select className="spt-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos os status</option>
          <option value="paid">Pagas</option>
          <option value="pending">Pendentes</option>
        </select>
        <div className="spt-spacer" />
        <button className="spt-btn primary" onClick={() => setOpenGrant((v) => !v)}>
          + Liberar acesso manual
        </button>
      </div>

      {openGrant && (
        <div className="spt-card" style={{ marginBottom: 22 }}>
          <h2>Liberar acesso manual</h2>
          <p className="spt-muted" style={{ marginTop: -8, marginBottom: 18 }}>
            Cria uma compra marcada como paga — útil quando um pagamento travou ou para cortesias.
          </p>
          {error && <div className="spt-error">{error}</div>}
          <div className="spt-row">
            <div className="spt-field">
              <label>E-mail do cliente</label>
              <input className="spt-input" type="email" value={grant.email} onChange={(e) => setGrant({ ...grant, email: e.target.value })} />
            </div>
            <div className="spt-field">
              <label>Ebook</label>
              <select className="spt-select" value={grant.slug} onChange={(e) => setGrant({ ...grant, slug: e.target.value })}>
                <option value="">Selecione…</option>
                {livros.map((l) => (
                  <option key={l.slug} value={l.slug}>{l.titulo}</option>
                ))}
              </select>
            </div>
            <div className="spt-field">
              <label>Valor (opcional)</label>
              <input className="spt-input" type="number" step="0.01" min="0" value={grant.valor} onChange={(e) => setGrant({ ...grant, valor: e.target.value })} placeholder="0,00" />
            </div>
          </div>
          <div className="spt-row" style={{ justifyContent: "flex-start" }}>
            <button className="spt-btn primary" onClick={submitGrant} disabled={busy} style={{ flex: "none" }}>
              {busy ? "Liberando…" : "Liberar acesso"}
            </button>
            <button className="spt-btn ghost" onClick={() => setOpenGrant(false)} style={{ flex: "none" }}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="spt-card">
        {filtered.length === 0 ? (
          <div className="spt-empty">Nenhuma compra encontrada.</div>
        ) : (
          <table className="spt-table">
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Ebook</th>
                <th>Valor</th>
                <th>Método</th>
                <th>Status</th>
                <th>Data</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const pago = PAGOS.includes(c.status);
                return (
                  <tr key={c.id}>
                    <td>{c.email}</td>
                    <td className="spt-muted">{c.livro_slug}</td>
                    <td className="spt-mono">{brl(Number(c.valor))}</td>
                    <td className="spt-muted">{c.metodo || "—"}</td>
                    <td><span className={`spt-badge ${pago ? "ok" : "warn"}`}>{c.status}</span></td>
                    <td className="spt-muted spt-mono">{dataBR(c.criado_em)}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {!pago ? (
                        <button className="spt-btn ghost small" onClick={() => setStatus(c.id, "paid")}>Marcar paga</button>
                      ) : (
                        <button className="spt-btn ghost small" onClick={() => setStatus(c.id, "pending")}>Tornar pendente</button>
                      )}{" "}
                      <button className="spt-btn danger small" onClick={() => onDelete(c.id)}>Excluir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
