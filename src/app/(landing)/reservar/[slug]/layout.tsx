import type { Metadata } from "next";
import { db, ensureMigrated } from "@/lib/db";

type Props = {
  children: React.ReactNode;
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    await ensureMigrated();
    const result = await db.execute({
      sql: `SELECT title, description, cover_image_url
            FROM experiences
            WHERE slug = ? AND is_published = 1
            LIMIT 1`,
      args: [params.slug],
    });
    const experience = result.rows[0];
    if (!experience) {
      return {
        title: "Reservar experiencia",
        robots: { index: false, follow: true },
      };
    }

    const title = `Reservar ${String(experience.title)}`;
    const description =
      String(experience.description || "").slice(0, 155) ||
      "Reserva una experiencia de Raíz en Ciudad de México.";
    const image = String(experience.cover_image_url || "/assets/roots-hero.jpg");

    return {
      title,
      description,
      alternates: { canonical: `/reservar/${params.slug}` },
      openGraph: {
        title,
        description,
        images: [image],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Reservar experiencia",
      description: "Reserva una experiencia de Raíz en Ciudad de México.",
    };
  }
}

export default function ReservationSlugLayout({ children }: Props) {
  return <>{children}</>;
}
