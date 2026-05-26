"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { brl, slugify } from "@/lib/utils";
import {
  prepareUpload,
  createEbook,
  updateEbook,
  deleteEbook,
  toggleAtivo,
  getDownloadUrl,
} from "./actions";

export type Livro = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  preco: number;
  ativo: boolean;
  arquivo_path: string | null;
};

const emptyForm = {
  titulo: "",
  slug: "",
  descricao: "",
  preco: "",
  ativo: true,
};

export default function EbooksClient({ livros }: { livros: Livro[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  function startCreate() {
    setForm({ ...emptyForm });
    setFile(null);
    setEditingId(null);
    setError(null);
    setOpen(true);
  }

  function startEdit(l: Livro) {
    setForm({
      titulo: l.titulo,
      slug: l.slug,
      descricao: l.descricao || "",
      preco: String(l.preco ?? ""),
      ativo: l.ativo,
    });
    setFile(null);
    setEditingId(l.id);
    setError(null);
    setOpen(true);
  }

  async function submit() {
    setError(null);
    if (!form.titulo.trim()) {
      setError("O título é obrigatório.");
      return;
    }
    if (!editingId && !file) {
      setError("Selecione o arquivo PDF do ebook.");
      return;
    }
    setBusy(true);
    try {
      let arquivo_path: string | undefined;

      if (file) {
        setProgress("Preparando envio…");
        const prep = await prepareUpload(file.name);
        if (!prep.ok || !prep.path || !prep.token) {
          throw new Error(prep.error || "Falha ao preparar o upload.");
        }
        setProgress("Enviando arquivo…");
        const up = await supabaseBrowser.storage
          .from("ebooks")
          .uploadToSignedUrl(prep.path, prep.token, file);
        if (up.error) throw new Error(up.error.message);
        arquivo_path = prep.path;
      }

      setProgress("Salvando…");
      const payload = {
        titulo: form.titulo,
        slug: form.slug,
        descricao: form.descricao,
        preco: parseFloat(form.preco) || 0,
        ativo: form.ativo,
        arquivo_path,
      };
      const res = editingId
        ? await updateEbook(editingId, { ...payload, slug: form.slug || form.titulo })
        : await createEbook(payload);
      if (!res.ok) throw new Error(res.error || "Erro ao salvar.");

      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  async function preview(path: string | null) {
    if (!path) return;
    const res = await getDownloadUrl(path);
    if (res.ok && res.url) window.open(res.url, "_blank");
  }

  async function onToggle(l: Livro) {
    await toggleAtivo(l.id, !l.ativo);
    router.refresh();
  }

  async function onDelete(l: Livro) {
    if (!confirm(`Excluir "${l.titulo}"? O arquivo também será removido.`)) return;
    await deleteEbook(l.id);
    router.refresh();
  }

  return (
    <>
      <div className="spt-toolbar">
        <div className="spt-spacer" />
        <button className="spt-btn primary" onClick={startCreate}>+ Adicionar ebook</button>
      </div>

      {open && (
        <div className="spt-card" style={{ marginBottom: 22 }}>
          <h2>{editingId ? "Editar ebook" : "Novo ebook"}</h2>
          {error && <div className="spt-error">{error}</div>}

          <div className="spt-field">
            <label>Título</label>
            <input
              className="spt-input"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex.: O Peso Invisível da Bagagem"
            />
          </div>

          <div className="spt-row">
            <div className="spt-field">
              <label>Slug (URL)</label>
              <input
                className="spt-input"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder={form.titulo ? slugify(form.titulo) : "gerado-automaticamente"}
              />
              <span className="hint">Deixe vazio para gerar a partir do título.</span>
            </div>
            <div className="spt-field">
              <label>Preço (R$)</label>
              <input
                className="spt-input"
                type="number"
                step="0.01"
                min="0"
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: e.target.value })}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="spt-field">
            <label>Descrição</label>
            <textarea
              className="spt-textarea"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>

          <div className="spt-field">
            <label>Arquivo PDF {editingId && <span className="hint">(opcional — só se for substituir)</span>}</label>
            <input
              className="spt-input"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <label className="spt-check" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            />
            Publicado (visível na loja)
          </label>

          <div className="spt-row" style={{ justifyContent: "flex-start" }}>
            <button className="spt-btn primary" onClick={submit} disabled={busy} style={{ flex: "none" }}>
              {busy ? progress || "Salvando…" : "Salvar ebook"}
            </button>
            <button className="spt-btn ghost" onClick={() => setOpen(false)} disabled={busy} style={{ flex: "none" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="spt-card">
        {livros.length === 0 ? (
          <div className="spt-empty">Nenhum ebook cadastrado ainda.</div>
        ) : (
          <table className="spt-table">
            <thead>
              <tr>
                <th>Ebook</th>
                <th>Preço</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {livros.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{l.titulo}</div>
                    <div className="spt-muted" style={{ fontSize: 13 }}>/{l.slug}</div>
                  </td>
                  <td className="spt-mono">{brl(l.preco)}</td>
                  <td>
                    <span className={`spt-badge ${l.ativo ? "ok" : "off"}`}>
                      {l.ativo ? "Publicado" : "Rascunho"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="spt-btn ghost small" onClick={() => preview(l.arquivo_path)} disabled={!l.arquivo_path}>Ver PDF</button>{" "}
                    <button className="spt-btn ghost small" onClick={() => onToggle(l)}>{l.ativo ? "Despublicar" : "Publicar"}</button>{" "}
                    <button className="spt-btn ghost small" onClick={() => startEdit(l)}>Editar</button>{" "}
                    <button className="spt-btn danger small" onClick={() => onDelete(l)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
