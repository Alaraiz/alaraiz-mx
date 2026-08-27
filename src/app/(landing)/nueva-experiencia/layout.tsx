import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear una nueva experiencia",
  description:
    "Formulario para proponer una nueva experiencia de re·creo by Raíz en Ciudad de México.",
  alternates: { canonical: "/nueva-experiencia" },
  openGraph: {
    title: "Crear una nueva experiencia · Raíz",
    description:
      "Comparte tu idea, conexión con el territorio y detalles para crear una experiencia de re·creo.",
  },
};

export default function NuevaExperienciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
