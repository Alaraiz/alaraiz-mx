import { notFound } from "next/navigation";

/**
 * Détente issues — these are self-contained bundled pages.
 * For now we serve them via public/ static files and redirect there,
 * or we can render them as iframes. We'll refine during the design phase.
 */
const VALID_SLUGS = ["01", "02"];

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }));
}

export default function DetentePage({ params }: { params: { slug: string } }) {
  if (!VALID_SLUGS.includes(params.slug)) notFound();

  return (
    <main className="pad wrap">
      <h1>Détente · Núm. {params.slug}</h1>
      <p className="lede">
        Esta edición se cargará como contenido estático en la siguiente fase.
      </p>
    </main>
  );
}
