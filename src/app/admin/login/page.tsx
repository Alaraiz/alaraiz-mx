"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await r.json();
    if (!r.ok) setError(data.error || "No se pudo iniciar sesión");
    else router.replace("/admin");
    setLoading(false);
  }

  return (
    <main className="admin-auth">
      <div className="admin-auth-card">
        <div className="admin-mark">
          RAÍZ<span>ADMIN</span>
        </div>
        <p className="admin-kicker">Panel de gestión</p>
        <h1>Bienvenida</h1>
        <p className="admin-muted">
          Administra experiencias, facilitadores y reservas desde un solo lugar.
        </p>
        <form onSubmit={submit}>
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="admin-error">{error}</p>}
          <button className="admin-primary" disabled={loading}>
            {loading ? "Entrando…" : "Entrar al panel ↗"}
          </button>
        </form>
        <a className="admin-back" href="/">
          ← Volver a Raíz
        </a>
      </div>
    </main>
  );
}
