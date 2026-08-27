import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Encuesta de salida",
  description:
    "Encuesta posterior a una experiencia de Raíz para mejorar cuidado, operación y diseño.",
  alternates: { canonical: "/encuesta-salida" },
  robots: { index: false, follow: true },
};

export default function EncuestaSalidaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
