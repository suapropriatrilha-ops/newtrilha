"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";
import "../admin.css";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await loginAction(password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error || "Erro ao entrar.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="spt">
      <div className="spt-login">
        <div className="spt-login-card">
          <h1>Sua Própria Trilha</h1>
          <small>Painel administrativo</small>
          {error && <div className="spt-error">{error}</div>}
          <div className="spt-field">
            <label htmlFor="password">Senha de acesso</label>
            <input
              id="password"
              type="password"
              className="spt-input"
              value={password}
              autoFocus
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <button
            className="spt-btn primary"
            onClick={submit}
            disabled={busy}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
