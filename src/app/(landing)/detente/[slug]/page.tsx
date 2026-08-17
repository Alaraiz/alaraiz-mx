import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "./detente-page.css";

/* ── Static issue registry ── */
const ISSUES: Record<string, { title: string; description: string; date: string }> = {
  "01": {
    title: "Détente · Núm. 01 · Make the Most of Your World Cup in Mexico",
    description:
      "Guía cultural para el viajero del Mundial 2026 en la Ciudad de México. Una publicación editorial de Raíz.",
    date: "2026-01-15",
  },
  "02": {
    title: "Détente · Núm. 02 · Elige bien, pierde bien, canta mejor",
    description:
      "La guía del hincha con criterio: selecciones con alma, hinchadas que cantan, y un Mundial que se vive desde adentro.",
    date: "2026-03-01",
  },
};

/* ── generateStaticParams ── */
export function generateStaticParams() {
  return [{ slug: "01" }, { slug: "02" }];
}

/* ── generateMetadata (SEO per issue) ── */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const issue = ISSUES[params.slug];
  if (!issue) return {};

  return {
    title: issue.title,
    description: issue.description,
    keywords: [
      "Détente",
      "Raíz",
      "CDMX",
      "Ciudad de México",
      "World Cup 2026",
      "Mundial",
      "viaje lento",
      "slow travel",
      "zine",
    ],
    openGraph: {
      type: "article",
      title: issue.title,
      description: issue.description,
      locale: "es_MX",
      siteName: "Raíz",
      publishedTime: issue.date,
      images: ["/assets/poster.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: issue.title,
      description: issue.description,
    },
    alternates: {
      canonical: `/detente/${params.slug}`,
      languages: {
        "es-MX": `/detente/${params.slug}`,
        "en-US": `/detente/${params.slug}`,
      },
    },
  };
}

/* ── Page component ── */
export default async function DetentePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  if (slug !== "01" && slug !== "02") {
    notFound();
  }

  const issue = ISSUES[slug];

  // JSON-LD Article structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: issue.title,
    description: issue.description,
    datePublished: issue.date,
    inLanguage: "es-MX",
    availableLanguage: ["es-MX", "en-US"],
    author: {
      "@type": "Organization",
      name: "Raíz",
      url: "https://alaraiz.mx",
    },
    publisher: {
      "@type": "Organization",
      name: "Raíz",
      url: "https://alaraiz.mx",
      logo: {
        "@type": "ImageObject",
        url: "https://alaraiz.mx/assets/favicon.svg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://alaraiz.mx/detente/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DetenteClientPage slug={slug} />
    </>
  );
}

/* ── Client wrapper for reveal + lang toggle ── */
import DetenteClientPage from "./client";
