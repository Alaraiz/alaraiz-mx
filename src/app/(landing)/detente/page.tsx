import type { Metadata } from "next";
import { getDetenteIssues } from "@/lib/arena";
import "./detente.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Détente · Esporas Editorial",
  description:
    "Détente es una publicación de Raíz: una invitación a pausar, mirar con atención y entrar a la ciudad con criterio.",
  alternates: {
    canonical: "/detente",
  },
};

export default async function DetenteIndexPage() {
  const { issues, needsToken, error } = await getDetenteIssues();
  const active = issues[0] || null;
  const unavailable = needsToken || error;

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
          Détente es una publicación de Raíz: una invitación a pausar, mirar con atención y entrar a la ciudad con criterio. No es una guía turística; es un manifiesto de viaje lento.
        </p>
      </header>

      {unavailable ? (
        <section className="detente-reader-state">
          <p className="dt-issue-label">Détente</p>
          <h2>La lectura está por abrir.</h2>
          <p>Estamos preparando el próximo número para que puedas leerlo completo aquí muy pronto.</p>
        </section>
      ) : !active ? (
        <section className="detente-reader-state">
          <p className="dt-issue-label">Détente</p>
          <h2>La lectura está por abrir.</h2>
          <p>Estamos preparando el próximo número para que puedas leerlo completo aquí muy pronto.</p>
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
                    <p className="dt-issue-label">Détente</p>
                    <h2>{issue.title}</h2>
                    {issue.description && <p>{issue.description}</p>}
                  </div>
                  <a href={issue.pdfUrl} target="_blank" rel="noopener noreferrer">
                    Abrir publicación ↗
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
