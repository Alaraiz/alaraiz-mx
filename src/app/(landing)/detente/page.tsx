import type { Metadata } from "next";
import { getDetenteIssues } from "@/lib/arena";
import "./detente.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Détente · Esporas Editorial",
  description:
    "Publicaciones editoriales de Raíz, vistas desde Are.na en un lector embebido.",
  alternates: {
    canonical: "/detente",
  },
};

export default async function DetenteIndexPage() {
  const { issues, needsToken, error } = await getDetenteIssues();
  const active = issues[0] || null;

  return (
    <main className="detente-reader-page">
      <header className="detente-reader-head">
        <a href="/" className="detente-reader-back">
          Volver a Raíz
        </a>
        <p className="dt-issue-label">Esporas editorial</p>
        <h1>
          D<span>é</span>tente
        </h1>
        <p>
          Guías, despachos y publicaciones de campo del equipo de Raíz. Los números se cargan desde Are.na para que el equipo editorial pueda subir nuevos PDFs sin tocar el código.
        </p>
      </header>

      {needsToken ? (
        <section className="detente-reader-state">
          <p className="dt-issue-label">Configuración pendiente</p>
          <h2>Falta conectar Are.na.</h2>
          <p>
            Para mostrar los PDFs aquí, configura `ARENA_PAT` en Vercel con un token personal de Are.na que tenga acceso al canal `revista-detente`.
          </p>
        </section>
      ) : error ? (
        <section className="detente-reader-state">
          <p className="dt-issue-label">Are.na</p>
          <h2>No pudimos cargar las publicaciones.</h2>
          <p>{error}</p>
        </section>
      ) : !active ? (
        <section className="detente-reader-state">
          <p className="dt-issue-label">Sin PDFs</p>
          <h2>El canal todavía no tiene publicaciones visibles.</h2>
          <p>Cuando suban PDFs al canal de Are.na, aparecerán automáticamente en este lector.</p>
        </section>
      ) : (
        <section className="detente-reader-shell">
          <aside className="detente-reader-list" aria-label="Números de Détente">
            {issues.map((issue, index) => (
              <a key={issue.id} href={`#detente-${issue.id}`} className="detente-reader-item">
                {issue.coverUrl ? (
                  <img src={issue.coverUrl} alt="" />
                ) : (
                  <span className="detente-reader-fallback">D{index + 1}</span>
                )}
                <span>
                  <strong>{issue.title}</strong>
                  <small>{issue.description}</small>
                </span>
              </a>
            ))}
          </aside>

          <div className="detente-reader-stack">
            {issues.map((issue) => (
              <article key={issue.id} id={`detente-${issue.id}`} className="detente-reader-frame">
                <div className="detente-reader-frame-head">
                  <div>
                    <p className="dt-issue-label">PDF · Are.na</p>
                    <h2>{issue.title}</h2>
                    {issue.description && <p>{issue.description}</p>}
                  </div>
                  <a href={issue.pdfUrl} target="_blank" rel="noopener noreferrer">
                    Abrir PDF ↗
                  </a>
                </div>
                <iframe src={issue.pdfUrl} title={issue.title} loading="lazy" />
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
