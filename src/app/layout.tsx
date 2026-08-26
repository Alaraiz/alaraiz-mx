import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Raíz · La ciudad debajo de la ciudad",
    template: "Raíz · %s",
  },
  description:
    "Una versión de la Ciudad de México contada por quienes la viven. Experiencias de un día en grupos pequeños, narradas por sus guías, cocineros y vecinos.",
  keywords: [
    "Ciudad de México",
    "experiencias",
    "Raíz",
    "turismo comunitario",
    "CDMX",
    "Esporas",
    "Détente",
    "viaje lento",
    "slow travel",
    "World Cup 2026",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://alaraiz.mx"
  ),
  openGraph: {
    type: "website",
    siteName: "Raíz",
    title: "Raíz · La ciudad debajo de la ciudad",
    description:
      "Experiencias de un día en la Ciudad de México, contadas por quienes la viven. Grupos pequeños, guías locales, valor que se queda en la comunidad.",
    images: ["/assets/roots-hero.jpg"],
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "Raíz · La ciudad debajo de la ciudad",
    description:
      "Experiencias de un día en la Ciudad de México, contadas por quienes la viven.",
    images: ["/assets/roots-hero.jpg"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": ["Organization", "TravelAgency", "LocalBusiness"],
    name: "Raíz",
    url: "https://alaraiz.mx",
    logo: "https://alaraiz.mx/assets/favicon.svg",
    areaServed: "Ciudad de México",
    priceRange: "$$",
    sameAs: [
      "https://instagram.com/a.la.ra.iz",
      "https://instagram.com/recreobyraiz",
      "https://instagram.com/detentebyraiz",
    ],
    description:
      "Experiencias de un día en la Ciudad de México, contadas por quienes la viven.",
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Raíz",
    url: "https://alaraiz.mx",
    inLanguage: ["es-MX", "en-US"],
    potentialAction: {
      "@type": "SearchAction",
      target: "https://alaraiz.mx/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Experiencias de un día en Ciudad de México",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Recreo",
        url: "https://alaraiz.mx/#recreo",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Détente",
        url: "https://alaraiz.mx/detente/02",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Nueva experiencia",
        url: "https://alaraiz.mx/nueva-experiencia",
      },
    ],
  };

  return (
    <html lang="es" data-theme="dark" data-acc="on" data-voice="lit">
      <head>
        <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Hanken+Grotesk:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              organizationJsonLd,
              websiteJsonLd,
              itemListJsonLd,
            ]),
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
