import { notFound } from "next/navigation";
import { db, ensureMigrated } from "@/lib/db";

interface Experience {
  id: string;
  slug: string;
  title: string;
  tag: string | null;
  description: string | null;
  duration: string | null;
  price: number | null;
  capacity: number;
  cover_image_url: string | null;
  collection: string | null;
  pace: string | null;
  zone: string | null;
  language: string | null;
  includes: string | null;
  facilitator_id: string | null;
}

interface Facilitator {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  photo_url: string | null;
  collection: string | null;
  reclaims: string | null;
}

async function getExperience(slug: string): Promise<{ experience: Experience; facilitator: Facilitator | null } | null> {
  await ensureMigrated();

  const result = await db.execute({
    sql: `SELECT id, slug, title, tag, description, duration, price, capacity,
                 cover_image_url, collection, pace, zone, language, includes, facilitator_id
          FROM experiences
          WHERE slug = ? AND is_published = 1
          LIMIT 1`,
    args: [slug],
  });

  if (result.rows.length === 0) return null;

  const experience = result.rows[0] as unknown as Experience;

  let facilitator: Facilitator | null = null;
  if (experience.facilitator_id) {
    const facResult = await db.execute({
      sql: `SELECT id, name, role, bio, photo_url, collection, reclaims
            FROM facilitators WHERE id = ?`,
      args: [experience.facilitator_id],
    });
    if (facResult.rows.length > 0) {
      facilitator = facResult.rows[0] as unknown as Facilitator;
    }
  }

  return { experience, facilitator };
}

export default async function DetentePage({ params }: { params: { slug: string } }) {
  const data = await getExperience(params.slug);

  if (!data) notFound();

  const { experience, facilitator } = data;

  return (
    <main className="pad wrap" style={{ maxWidth: "72ch", margin: "0 auto", paddingTop: "clamp(40px, 8vh, 80px)", paddingBottom: "clamp(40px, 8vh, 80px)" }}>
      {/* Cover */}
      {experience.cover_image_url && (
        <div className="frame" style={{ borderRadius: 14, overflow: "hidden", marginBottom: "clamp(24px, 4vh, 40px)" }}>
          <img
            src={experience.cover_image_url}
            alt={experience.title}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      )}

      {/* Header */}
      {experience.collection && (
        <span className="kicker" style={{ marginBottom: ".4rem", display: "block" }}>{experience.collection}</span>
      )}
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 500, lineHeight: 1.05, marginBottom: ".5rem" }}>
        {experience.title}
      </h1>
      {experience.tag && (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faint)" }}>
          {experience.tag}
        </span>
      )}

      {/* Description */}
      {experience.description && (
        <p className="lede" style={{ marginTop: "clamp(16px, 3vh, 28px)", maxWidth: "58ch" }}>
          {experience.description}
        </p>
      )}

      {/* Specs */}
      <div className="rec-spec" style={{ marginTop: "clamp(20px, 3vh, 32px)", maxWidth: "420px" }}>
        {experience.duration && (
          <div className="rs">
            <span className="rsk">Duración</span>
            <span className="rsv">{experience.duration}</span>
          </div>
        )}
        {experience.pace && (
          <div className="rs">
            <span className="rsk">Ritmo</span>
            <span className="rsv">{experience.pace}</span>
          </div>
        )}
        {experience.zone && (
          <div className="rs">
            <span className="rsk">Zona</span>
            <span className="rsv">{experience.zone}</span>
          </div>
        )}
        {experience.language && (
          <div className="rs">
            <span className="rsk">Idioma</span>
            <span className="rsv">{experience.language}</span>
          </div>
        )}
        {experience.includes && (
          <div className="rs">
            <span className="rsk">Incluye</span>
            <span className="rsv">{experience.includes}</span>
          </div>
        )}
        {experience.price != null && (
          <div className="rs">
            <span className="rsk">Precio</span>
            <span className="rsv">${experience.price} MXN</span>
          </div>
        )}
      </div>

      {/* Facilitator */}
      {facilitator && (
        <div style={{ marginTop: "clamp(28px, 4vh, 44px)", padding: "clamp(16px, 2vw, 24px)", background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: 12 }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: ".6rem" }}>
            {facilitator.photo_url ? (
              <img src={facilitator.photo_url} alt={facilitator.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <span className="lead-avatar" style={{ width: 56, height: 56, fontSize: "1rem" }}>
                {facilitator.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </span>
            )}
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 500, lineHeight: 1.1 }}>{facilitator.name}</h3>
              {facilitator.role && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-faint)" }}>{facilitator.role}</span>
              )}
            </div>
          </div>
          {facilitator.bio && (
            <p style={{ fontSize: "0.86rem", color: "var(--ink-dim)", lineHeight: 1.5 }}>{facilitator.bio}</p>
          )}
          {facilitator.reclaims && (
            <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "0.92rem", marginTop: ".6rem", borderLeft: "2px solid var(--accent)", paddingLeft: ".7rem" }}>
              {facilitator.reclaims}
            </p>
          )}
        </div>
      )}

      {/* CTA */}
      <div style={{ marginTop: "clamp(28px, 4vh, 44px)" }}>
        <a href={`/reservar/${experience.slug}`} className="btn btn-solid">
          Solicitar lugar →
        </a>
      </div>
    </main>
  );
}
