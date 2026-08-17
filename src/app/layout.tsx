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
    languages: {
      "es-MX": "/",
      "en-US": "/",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Raíz",
    url: "https://alaraiz.mx",
    logo: "https://alaraiz.mx/assets/favicon.svg",
    sameAs: [
      "https://instagram.com/a.la.ra.iz",
      "https://instagram.com/recreobyraiz",
      "https://instagram.com/detentebyraiz",
    ],
    description:
      "Experiencias de un día en la Ciudad de México, contadas por quienes la viven.",
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
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
