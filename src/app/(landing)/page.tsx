"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ── Scroll-reveal hook (IntersectionObserver) ── */
function useReveal() {
  const init = useCallback(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
        el.classList.add("revealed");
      });
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);
}

/* ── Mobile carousel highlight (scroll-based) ── */
function useCarousel() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    if (!mq.matches) return;

    function highlightCenter(container: HTMLElement) {
      const cards = Array.from(container.children) as HTMLElement[];
      if (cards.length === 0) return;
      const containerRect = container.getBoundingClientRect();
      const center = containerRect.left + containerRect.width / 2;
      let closest: HTMLElement | null = null;
      let minDist = Infinity;
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const dist = Math.abs(cardCenter - center);
        if (dist < minDist) {
          minDist = dist;
          closest = card;
        }
      });
      cards.forEach((card) => {
        card.classList.toggle("carousel-active", card === closest);
      });
    }

    function setup() {
      const rails = document.querySelectorAll<HTMLElement>(".rec-rail, .leads-grid");
      const cleanups: Array<() => void> = [];
      rails.forEach((rail) => {
        const handler = () => highlightCenter(rail);
        rail.addEventListener("scroll", handler, { passive: true });
        cleanups.push(() => rail.removeEventListener("scroll", handler));
        highlightCenter(rail);
      });
      return cleanups;
    }

    let cleanups = setup();

    // Re-setup when DOM children change (data loads async)
    const mo = new MutationObserver(() => {
      cleanups.forEach((fn) => fn());
      cleanups = setup();
    });
    const recRail = document.querySelector(".rec-rail");
    const leadsGrid = document.querySelector(".leads-grid");
    if (recRail) mo.observe(recRail, { childList: true });
    if (leadsGrid) mo.observe(leadsGrid, { childList: true });

    return () => {
      cleanups.forEach((fn) => fn());
      mo.disconnect();
    };
  }, []);
}

/* ── Types for CMS data ── */
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
  title_en: string | null;
  tag_en: string | null;
  description_en: string | null;
  includes_en: string | null;
  facilitator_id: string | null;
  facilitator_name: string | null;
  facilitator_role: string | null;
  facilitator_photo_url: string | null;
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

/** Derive color theme from collection name */
function collectionColor(collection: string | null): string {
  if (!collection) return "clay";
  const lower = collection.toLowerCase();
  if (lower.includes("mesa") || lower.includes("poner")) return "moss";
  if (lower.includes("bajotierra") || lower.includes("agua")) return "slate";
  return "clay";
}

/** Get initials for the avatar */
function getInitials(name: string | null): string {
  if (!name) return "??";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Map pace string to dot count (1-3) */
function paceDots(pace: string | null): number {
  if (!pace) return 1;
  const lower = pace.toLowerCase();
  if (lower.includes("tranquilo") || lower.includes("easy") || lower.includes("lento")) return 1;
  if (lower.includes("pausa") || lower.includes("moderate") || lower.includes("medio")) return 2;
  return 3;
}

/** Pace label */
function paceLabel(pace: string | null): { es: string; en: string } {
  if (!pace) return { es: "Tranquilo", en: "Easy" };
  const lower = pace.toLowerCase();
  if (lower.includes("tranquilo") || lower.includes("easy")) return { es: "Tranquilo", en: "Easy" };
  if (lower.includes("pausa") || lower.includes("moderate")) return { es: "Con pausas", en: "With breaks" };
  return { es: pace, en: pace };
}

/** Convert number to roman numeral */
function toRoman(num: number): string {
  const map: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let result = "";
  for (const [value, numeral] of map) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

/**
 * Landing page — full conversion from index.html.
 * Hero with hover-reveal preserved, followed by all original sections.
 */
export default function HomePage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [experiences, setExperiences] = useState<Experience[] | null>(null);
  const [facilitators, setFacilitators] = useState<Facilitator[] | null>(null);
  const [heroMounted, setHeroMounted] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [menuOpen, setMenuOpen] = useState(false);

  useReveal();
  useCarousel();

  useEffect(() => { setHeroMounted(true); }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;
    const play = () => video.play().catch(() => {});
    const stop = () => {
      video.pause();
      video.currentTime = 0;
    };
    wrap.addEventListener("mouseenter", play);
    wrap.addEventListener("mouseleave", stop);
    wrap.addEventListener("touchstart", play, { passive: true });
    return () => {
      wrap.removeEventListener("mouseenter", play);
      wrap.removeEventListener("mouseleave", stop);
      wrap.removeEventListener("touchstart", play);
    };
  }, []);

  useEffect(() => {
    fetch("/api/public/experiences")
      .then((r) => r.json())
      .then((data) => setExperiences(data.experiences ?? []))
      .catch(() => setExperiences([]));
  }, []);

  useEffect(() => {
    fetch("/api/public/facilitators")
      .then((r) => r.json())
      .then((data) => setFacilitators(data.facilitators ?? []))
      .catch(() => setFacilitators([]));
  }, []);

  return (
    <main data-lang={lang}>
      {/* ============ HERO ============ */}
      <section className="hero section-screen" id="top">
        {/* ── Top nav: lang toggle + hamburger ── */}
        <div className="top-nav">
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            aria-label="Toggle language"
          >
            <span className={lang === "es" ? "lang-active" : ""}>ES</span>
            {" / "}
            <span className={lang === "en" ? "lang-active" : ""}>EN</span>
          </button>
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            <span className={`hamburger-icon${menuOpen ? " open" : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          {/* ── Dropdown menu ── */}
          <nav className={`hamburger-menu${menuOpen ? " hamburger-menu--open" : ""}`} aria-hidden={!menuOpen}>
            <a href="#recreo" onClick={() => setMenuOpen(false)}>
              <span className="lng-es">Experiencias</span>
              <span className="lng-en">Experiences</span>
            </a>
            <a href="#especialistas" onClick={() => setMenuOpen(false)}>
              <span className="lng-es">Especialistas</span>
              <span className="lng-en">Specialists</span>
            </a>
            <a href="/detente/02" onClick={() => setMenuOpen(false)}>
              Détente
            </a>
            <a href="#descubre" onClick={() => setMenuOpen(false)}>
              <span className="lng-es">Más</span>
              <span className="lng-en">More</span>
            </a>
            <a href="#rsvp" className="hamburger-menu__cta" onClick={() => setMenuOpen(false)}>
              <span className="lng-es">Reserva tu lugar</span>
              <span className="lng-en">Reserve your spot</span>
            </a>
          </nav>
        </div>
        <div className="reveal-hero" ref={wrapRef}>
          <img
            className="reveal-poster"
            src="/assets/poster.jpg"
            alt="Raíces antiguas entrelazadas bajo la luz del bosque"
            width={672}
            height={448}
          />
          <video
            ref={videoRef}
            className="reveal-video"
            muted
            loop
            playsInline
            preload="none"
            poster="/assets/poster.jpg"
          >
            <source src="/assets/alaraiz-reveal.webm" type="video/webm" />
            <source src="/assets/alaraiz-reveal.mp4" type="video/mp4" />
          </video>
          {/* Hero text overlay inside the reveal container */}
          <div className={`reveal-overlay${heroMounted ? " hero-entered" : ""}`}>
            <span className="hero-eyebrow hero-stagger s1">
              <span className="lng-es">Ciudad de México · Experiencias de un día</span>
              <span className="lng-en">Mexico City · One-day experiences</span>
            </span>
            <h1 className="hero-stagger s2">
              <span className="lng-es">La ciudad<br /><em>debajo</em> de la ciudad.</span>
              <span className="lng-en">The city<br /><em>beneath</em> the city.</span>
            </h1>
            <p className="hero-dek hero-stagger s3">
              <span className="lng-es">Existe una versión de la Ciudad de México que no aparece en ninguna plataforma. Raíz te lleva ahí —con quienes la habitan, no quienes la venden.</span>
              <span className="lng-en">There&apos;s a version of Mexico City that lives on no platform. Raíz takes you there —with the people who inhabit it, not the ones who sell it.</span>
            </p>
            <div className="hero-actions hero-stagger s4">
              <a href="#recreo" className="btn btn-solid">
                <span className="lng-es">Ver las experiencias</span>
                <span className="lng-en">See the experiences</span>
              </a>
              <a href="#manifiesto" className="btn btn-ghost">
                <span className="lng-es">Lee el manifiesto</span>
                <span className="lng-en">Read the manifesto</span>
              </a>
            </div>
          </div>
          <span className="reveal-hint">pasa el cursor</span>
        </div>
        <div className="hero-ticker">
          <div><span className="tk"><span className="lng-es">Cómo viajamos</span><span className="lng-en">How we travel</span></span><span className="tv"><span className="lng-es">En grupos pequeños</span><span className="lng-en">In small groups</span></span></div>
          <div><span className="tk"><span className="lng-es">Quién narra</span><span className="lng-en">Who tells it</span></span><span className="tv"><span className="lng-es">La gente de la ciudad</span><span className="lng-en">The city&apos;s own people</span></span></div>
          <div><span className="tk"><span className="lng-es">A dónde va el valor</span><span className="lng-en">Where the value goes</span></span><span className="tv"><span className="lng-es">A la comunidad</span><span className="lng-en">To the community</span></span></div>
          <div><span className="tk"><span className="lng-es">Qué te llevas</span><span className="lng-en">What you leave with</span></span><span className="tv"><span className="lng-es">Una relación, no una foto</span><span className="lng-en">A relationship, not a photo</span></span></div>
        </div>
      </section>

      {/* ============ RECREO / EXPERIENCES ============ */}
      <section id="recreo" className="recreo section-screen rule-top">
        <div className="wrap">
          <div className="masthead reveal-on-scroll">
            <div className="mh-l">
              <span className="kicker"><span className="lng-es">Recreo · Experiencias de un día</span><span className="lng-en">Recreo · One-day experiences</span></span>
              <h2><span className="lng-es">Tres <em>experiencias</em>,<br />cada una un mundo.</span><span className="lng-en">Three <em>experiences</em>,<br />each its own world.</span></h2>
            </div>
            <span className="folio"><span className="lng-es">Desliza para recorrerlas</span><span className="lng-en">Swipe to explore</span></span>
          </div>

          <div className="rec-rail" id="recRail">
          {/* Dynamic experience cards from CMS */}
          {experiences === null ? (
            /* Loading skeleton */
            <>
              {[1, 2, 3].map((i) => (
                <article key={i} className="rec-card rec-soon" data-c="clay">
                  <div className="rec-media rec-media-soon">
                    <span className="soon-badge">Cargando…</span>
                  </div>
                  <div className="rec-body">
                    <span className="rec-tags">&nbsp;</span>
                    <h3 className="rec-name">&nbsp;</h3>
                  </div>
                </article>
              ))}
            </>
          ) : (
            <>
              {experiences.map((exp, idx) => {
                const color = collectionColor(exp.collection);
                const dots = paceDots(exp.pace);
                const pace = paceLabel(exp.pace);
                const initials = getInitials(exp.facilitator_name);
                return (
                  <article key={exp.id} className="rec-card" data-c={color}>
                    <div className="rec-media">
                      {exp.cover_image_url && (
                        <img src={exp.cover_image_url} alt={exp.title} />
                      )}
                      <span className="rec-roman">{toRoman(idx + 1)}</span>
                      {exp.collection && (
                        <span className="rec-col"><span className="pill"></span> {exp.collection}</span>
                      )}
                    </div>
                    <div className="rec-body">
                      {exp.tag && <span className="rec-tags"><span className="lng-es">{exp.tag}</span>{exp.tag_en && <span className="lng-en">{exp.tag_en}</span>}</span>}
                      <h3 className="rec-name"><span className="lng-es">{exp.title}</span>{exp.title_en && <span className="lng-en">{exp.title_en}</span>}</h3>
                      {exp.description && (
                        <p className="rec-product"><span className="lng-es">{exp.description}</span>{exp.description_en && <span className="lng-en">{exp.description_en}</span>}</p>
                      )}
                      <div className="rec-spec">
                        {exp.duration && (
                          <div className="rs"><span className="rsk"><span className="lng-es">Duración</span><span className="lng-en">Length</span></span><span className="rsv">{exp.duration}</span></div>
                        )}
                        <div className="rs"><span className="rsk"><span className="lng-es">Ritmo</span><span className="lng-en">Pace</span></span><span className="rsv meter"><span className="dots">{[1, 2, 3].map((d) => <i key={d} className={d <= dots ? "on" : ""}></i>)}</span><span className="ml"><span className="lng-es">{pace.es}</span><span className="lng-en">{pace.en}</span></span></span></div>
                        {exp.zone && (
                          <div className="rs"><span className="rsk"><span className="lng-es">Zona</span><span className="lng-en">Area</span></span><span className="rsv">{exp.zone}</span></div>
                        )}
                        {exp.language && (
                          <div className="rs"><span className="rsk"><span className="lng-es">Idioma</span><span className="lng-en">Language</span></span><span className="rsv">{exp.language}</span></div>
                        )}
                      </div>
                      <div className="rec-foot">
                        <div className="rec-lead"><span className="lead-avatar">{initials}</span><span className="lead-meta"><span className="lbl"><span className="lng-es">Anfitrión</span><span className="lng-en">Host</span></span><span className="nm">{exp.facilitator_name || "Por anunciar"}</span></span></div>
                        <a href={`/reservar/${exp.slug}`} className="rec-cta"><span className="lng-es">Solicitar →</span><span className="lng-en">Apply →</span></a>
                      </div>
                    </div>
                  </article>
                );
              })}
              {/* Placeholder card if fewer than 3 */}
              {experiences.length < 3 && (
                <article className="rec-card rec-soon" data-c="clay">
                  <div className="rec-media rec-media-soon">
                    <span className="rec-roman">{toRoman(experiences.length + 1)}</span>
                    <span className="soon-badge"><span className="lng-es">Próximamente</span><span className="lng-en">Coming soon</span></span>
                    <span className="rec-col"><span className="pill"></span> <span className="lng-es">Nueva colección · 2026</span><span className="lng-en">New collection · 2026</span></span>
                  </div>
                  <div className="rec-body">
                    <span className="rec-tags"><span className="lng-es">En el laboratorio</span><span className="lng-en">In the lab</span></span>
                    <h3 className="rec-name"><span className="lng-es">Muy pronto</span><span className="lng-en">Coming soon</span></h3>
                    <p className="rec-product"><span className="lng-es">Estamos destilando una nueva experiencia. Déjanos tu correo y serás de los primeros en conocerla cuando abra.</span><span className="lng-en">We&apos;re distilling a new experience. Leave us your email and be among the first to know when it opens.</span></p>
                    <div className="rec-foot rec-foot-soon">
                      <a href="#rsvp" className="rec-cta"><span className="lng-es">Avísame →</span><span className="lng-en">Notify me →</span></a>
                    </div>
                  </div>
                </article>
              )}
            </>
          )}
          </div>
        </div>
      </section>

      {/* ============ ESPECIALISTAS ============ */}
      <section id="especialistas" className="section-screen rule-top">
        <div className="wrap">
          <div className="masthead reveal-on-scroll">
            <div className="mh-l">
              <span className="kicker"><span className="lng-es">Quién te recibe</span><span className="lng-en">Who receives you</span></span>
              <h2><span className="lng-es">Especialistas que <em>viven</em> lo que narran.</span><span className="lng-en">Specialists who <em>live</em> what they tell.</span></h2>
            </div>
            <span className="folio"><span className="lng-es">Anfitriones de línea</span><span className="lng-en">Line hosts</span></span>
          </div>
          <p className="lede reveal-on-scroll" style={{ maxWidth: "62ch", marginBottom: "clamp(34px,5vh,52px)" }}><span className="lng-es">Cada experiencia la lleva quien la conoce desde adentro: su oficio es su credencial, y la ciudad que te muestran es, antes que nada, la suya.</span><span className="lng-en">Each experience is led by someone who knows it from the inside: their craft is their credential, and the city they show you is, above all, their own.</span></p>

          <div className="leads-grid">
            {facilitators === null ? (
              /* Loading */
              <>
                {[1, 2, 3].map((i) => (
                  <article key={i} className="lead-card lead-soon" data-c="clay">
                    <div className="frame portrait portrait-soon"><span className="soon-badge">Cargando…</span></div>
                    <div className="lc-body">
                      <h3 className="lc-name">&nbsp;</h3>
                    </div>
                  </article>
                ))}
              </>
            ) : (
              <>
                {facilitators.map((fac) => {
                  const color = collectionColor(fac.collection);
                  return (
                    <article key={fac.id} className="lead-card" data-c={color}>
                      <div className="frame portrait">
                        {fac.photo_url ? (
                          <img src={fac.photo_url} alt={fac.name} />
                        ) : (
                          <span className="soon-badge">{getInitials(fac.name)}</span>
                        )}
                      </div>
                      <div className="lc-body">
                        {fac.collection && (
                          <div className="lc-collection"><span className="pill" style={{ width: 8, height: 8, borderRadius: "50%", background: `var(--${color})`, display: "inline-block" }}></span> {fac.collection}</div>
                        )}
                        <h3 className="lc-name">{fac.name}</h3>
                        {fac.role && <div className="lc-role">{fac.role}</div>}
                        {fac.bio && <p className="lc-bio">{fac.bio}</p>}
                        {fac.reclaims && (
                          <div className="lc-reclaims">
                            <div className="rk"><span className="lng-es">Lo que reivindica</span><span className="lng-en">What they reclaim</span></div>
                            <div className="rv">{fac.reclaims}</div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
                {/* Placeholder if fewer than 3 */}
                {facilitators.length < 3 && (
                  <article className="lead-card lead-soon" data-c="clay">
                    <div className="frame portrait portrait-soon"><span className="soon-badge"><span className="lng-es">Próximamente</span><span className="lng-en">Coming soon</span></span></div>
                    <div className="lc-body">
                      <div className="lc-collection"><span className="pill" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--clay)", display: "inline-block" }}></span> <span className="lng-es">Nueva colección · 2026</span><span className="lng-en">New collection · 2026</span></div>
                      <h3 className="lc-name"><span className="lng-es">Anfitrión por anunciar</span><span className="lng-en">Host to be announced</span></h3>
                      <div className="lc-role"><span className="lng-es">Una nueva línea en preparación</span><span className="lng-en">A new line in the making</span></div>
                      <p className="lc-bio"><span className="lng-es">Estamos sumando a la persona indicada para llevar nuestra próxima colección. Como siempre: alguien que vive lo que narra.</span><span className="lng-en">We&apos;re bringing in the right person to lead our next collection. As always: someone who lives what they tell.</span></p>
                      <div className="lc-reclaims"><div className="rk"><span className="lng-es">Muy pronto</span><span className="lng-en">Coming soon</span></div><div className="rv"><span className="lng-es">«La ciudad tiene más de una historia por contar.»</span><span className="lng-en">&ldquo;The city has more than one story left to tell.&rdquo;</span></div></div>
                    </div>
                  </article>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ============ RSVP ============ */}
      <section id="rsvp" className="section-screen rule-top">
        <div className="wrap">
          <div className="rsvp-grid">
            <div className="rsvp-left reveal-on-scroll">
              <span className="kicker"><span className="lng-es">El lanzamiento público</span><span className="lng-en">The public launch</span></span>
              <h2><span className="lng-es">Tres líneas.<br />Un <em>lanzamiento</em>.</span><span className="lng-en">Three lines.<br />One <em>launch</em>.</span></h2>
              <p className="lede"><span className="lng-es">Después de seis meses de incubación y cuatro intensas semanas de laboratorio con el equipo, las tres experiencias se abren al público por primera vez. Solicita tu lugar; te diremos honestamente si es para ti.</span><span className="lng-en">After six months of incubation and four intense weeks of lab with the team, the three experiences open to the public for the first time. Request your spot; we&apos;ll honestly tell you if it&apos;s for you.</span></p>
              <div className="launch-card">
                <div className="launch-row"><span className="lk"><span className="lng-es">Fecha</span><span className="lng-en">Date</span></span><span className="lv">29 Jun – 4 Jul<small><span className="lng-es">Semana de lanzamiento · 2026</span><span className="lng-en">Launch week · 2026</span></small></span></div>
                <div className="launch-row"><span className="lk"><span className="lng-es">Lugar</span><span className="lng-en">Place</span></span><span className="lv"><span className="lng-es">Ciudad de México</span><span className="lng-en">Mexico City</span><small>San Rafael · Chapultepec</small></span></div>
                <div className="launch-row"><span className="lk"><span className="lng-es">Cupos</span><span className="lng-en">Spots</span></span><span className="lv"><span className="lng-es">Limitados</span><span className="lng-en">Limited</span><small><span className="lng-es">Grupos pequeños · precio público real</span><span className="lng-en">Small groups · real public price</span></small></span></div>
              </div>
            </div>

            <div className="form-card reveal-on-scroll">
              <form id="rsvpForm" noValidate>
                <h3><span className="lng-es">Solicita tu lugar</span><span className="lng-en">Request your spot</span></h3>
                <p className="fsub"><span className="lng-es">Una solicitud, no una compra. Te respondemos personalmente.</span><span className="lng-en">A request, not a purchase. We reply personally.</span></p>
                <div className="field row2">
                  <div><label htmlFor="nombre"><span className="lng-es">Nombre</span><span className="lng-en">Name</span></label><input id="nombre" name="nombre" type="text" placeholder="Tu nombre" autoComplete="name" /></div>
                  <div><label htmlFor="email"><span className="lng-es">Correo</span><span className="lng-en">Email</span></label><input id="email" name="email" type="email" placeholder="tú@correo.com" autoComplete="email" /></div>
                </div>
                <div className="field">
                  <label><span className="lng-es">¿Qué experiencia te llama?</span><span className="lng-en">Which experience calls you?</span></label>
                  <div className="chips" id="chips">
                    <span className="chip" data-v="Próximamente" role="button" tabIndex={0} aria-pressed="false"><span className="lng-es">Avísame de la nueva</span><span className="lng-en">Notify me · new line</span></span>
                    {experiences && experiences.map((exp) => (
                      <span key={exp.id} className="chip" data-v={exp.title} role="button" tabIndex={0} aria-pressed="false">{exp.title}</span>
                    ))}
                    <span className="chip" data-v="Sorpréndeme" role="button" tabIndex={0} aria-pressed="false"><span className="lng-es">Sorpréndeme</span><span className="lng-en">Surprise me</span></span>
                  </div>
                </div>
                <div className="field row2">
                  <div><label htmlFor="personas"><span className="lng-es">Personas</span><span className="lng-en">People</span></label>
                    <select id="personas" name="personas">
                      <option value="1">1 · solo/a</option>
                      <option value="2">2 · pareja</option>
                      <option value="3-4">3–4</option>
                      <option value="5+">5+</option>
                    </select>
                  </div>
                  <div><label htmlFor="acceso"><span className="lng-es">¿Algo de accesibilidad?</span><span className="lng-en">Any accessibility needs?</span></label>
                    <select id="acceso" name="acceso">
                      <option value="no">Sin requerimientos</option>
                      <option value="mov">Movilidad reducida</option>
                      <option value="ritmo">Prefiero ritmo lento</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="mensaje"><span className="lng-es">¿Algo que debamos saber? <span style={{ textTransform: "none", letterSpacing: 0 }}>(opcional)</span></span><span className="lng-en">Anything we should know? <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></span></label>
                  <textarea id="mensaje" name="mensaje" rows={2} placeholder="Idioma, fechas, intereses, necesidades de acceso…"></textarea>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-solid"><span className="lng-es">Enviar solicitud</span><span className="lng-en">Send request</span></button>
                  <span className="form-note"><span className="lng-es">Respondemos personalmente, no con un robot.</span><span className="lng-en">We reply personally, not with a robot.</span></span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ============ DESCUBRE / DISCLOSURES ============ */}
      <section id="descubre" className="section-screen rule-top">
        <div className="wrap">
          <div className="masthead reveal-on-scroll">
            <div className="mh-l">
              <span className="kicker"><span className="lng-es">Descubre más</span><span className="lng-en">Discover more</span></span>
              <h2><span className="lng-es">Todo lo demás,<br />a un <em>clic</em>.</span><span className="lng-en">Everything else,<br />one <em>click</em> away.</span></h2>
            </div>
            <span className="folio"><span className="lng-es">FAQ · Comunidad · Manifiesto · Servicios · Esporas · Fundadores · Studio</span><span className="lng-en">FAQ · Community · Manifesto · Services · Esporas · Founders · Studio</span></span>
          </div>

          <DiscoverPanel />
        </div>

        {/* Footer inside descubre, distributed full-width */}
        <footer id="footer">
          <div className="wrap foot-wide">
            <p className="foot-manifesto"><span className="lng-es">Esto no es un tour.<br />Es una <em>introducción</em>.</span><span className="lng-en">This isn&apos;t a tour.<br />It&apos;s an <em>introduction</em>.</span></p>
            <div className="foot-bottom">
              <div className="foot-cols">
                <div className="col"><span className="mono"><span className="lng-es">Navega</span><span className="lng-en">Navigate</span></span><a href="#recreo">Recreo</a><a href="#especialistas"><span className="lng-es">Acompañantes</span><span className="lng-en">Hosts</span></a><a href="#rsvp"><span className="lng-es">Reserva</span><span className="lng-en">Book</span></a></div>
                <div className="col"><span className="mono">Esporas</span><a href="/detente/02">Détente · Nº 02</a><a href="/detente/01">Détente · Nº 01</a></div>
                <div className="col"><span className="mono"><span className="lng-es">Contacto</span><span className="lng-en">Contact</span></span><a href="mailto:recreobyraiz@pm.me">recreobyraiz@pm.me</a><a href="mailto:alaraiz@pm.me">alaraiz@pm.me</a><a href="https://alaraiz.mx">alaraiz.mx</a></div>
                <div className="col"><span className="mono"><span className="lng-es">Síguenos</span><span className="lng-en">Follow</span></span><a href="https://instagram.com/a.la.ra.iz" target="_blank" rel="noopener noreferrer">@a.la.ra.iz</a><a href="https://instagram.com/recreobyraiz" target="_blank" rel="noopener noreferrer">@recreobyraiz</a><a href="https://instagram.com/detentebyraiz" target="_blank" rel="noopener noreferrer">@detentebyraiz</a></div>
              </div>
              <a href="#top" className="brand">Raíz<span className="dot"></span></a>
            </div>
            <div className="colophon">
              <span>© Raíz · CDMX · 2026</span>
              <span><span className="lng-es">Contada por quienes la viven</span><span className="lng-en">Told by the people who live it</span></span>
              <span><a href="https://www.taak-studio.cc" target="_blank" rel="noopener noreferrer">Taak Studio</a></span>
            </div>
          </div>
        </footer>
      </section>

      <SectionNav />
    </main>
  );
}


const FAQ_DATA = [
  { n: "01", q: ["¿Esto es un tour?", "Is this a tour?"], a: ["No. Un tour te lleva a ver cosas; Recreo te invita a hacer y a conversar. No hay banderita ni grupo de cuarenta. Si buscas una lista de monumentos para tachar, no somos para ti —y está bien.", "No. A tour takes you to see things; Recreo invites you to do and to talk. No little flag, no group of forty. If you want a checklist of monuments to tick off, we're not for you —and that's fine."] },
  { n: "02", q: ["¿A dónde va mi dinero?", "Where does my money go?"], a: ["A la gente que te recibe: guías, cocineros, productores y los espacios que abren sus puertas. Trabajamos sin intermediarios que se queden con la mayor parte.", "To the people who receive you: guides, cooks, producers and the places that open their doors. We work without middlemen who keep the bulk of it."] },
  { n: "03", q: ["¿Necesito hablar español?", "Do I need to speak Spanish?"], a: ["No. Operamos en español e inglés, y varias experiencias son bilingües. Dinos tu idioma al reservar y lo resolvemos.", "No. We operate in Spanish and English, and several experiences are bilingual. Tell us your language when you book and we'll sort it out."] },
  { n: "04", q: ["¿Qué tan exigente es físicamente?", "How physically demanding is it?"], a: ["Depende de la experiencia. Cada una indica su ritmo y accesibilidad con detalle —desde recorridos planos y pausados hasta jornadas activas a pie. Si tienes dudas sobre movilidad, escríbenos antes y te decimos la verdad.", "It depends on the experience. Each one states its pace and accessibility in detail —from flat, unhurried walks to active days on foot. If you have any doubt about mobility, write to us first and we'll tell you the truth."] },
  { n: "05", q: ["¿Puedo ir si tengo movilidad reducida?", "Can I come with reduced mobility?"], a: ["Algunas sí, otras no, y preferimos ser honestos en cada caso. «Cocinando Resistencia» es mayormente plana y apta; «¡Aguas!» incluye una caminata tranquila con un picnic. Cuéntanos tus necesidades y te orientamos sin rodeos.", "Some yes, some no, and we'd rather be honest case by case. \u201CCocinando Resistencia\u201D is mostly flat and accessible; \u201C¡Aguas!\u201D includes an easy walk with a picnic. Tell us your needs and we'll guide you straight."] },
  { n: "06", q: ["¿Es seguro?", "Is it safe?"], a: ["Sí, y lo tomamos en serio. Grupos pequeños, anfitriones que conocen cada zona, y rutas pensadas con criterio local. La seguridad no está peleada con lo real.", "Yes, and we take it seriously. Small groups, hosts who know each area, and routes planned with local judgment. Safety isn't at odds with the real thing."] },
  { n: "07", q: ["¿Cuándo puedo reservar?", "When can I book?"], a: ["El lanzamiento público es la semana del 29 de junio al 4 de julio de 2026. Los cupos son limitados y revisamos cada solicitud personalmente.", "The public launch is the week of June 29 – July 4, 2026. Spots are limited and we review every request personally."] },
];

function DiscoverPanel() {
  const [active, setActive] = useState<string>("faq");

  const sections = [
    { id: "faq", n: "01", label: ["Preguntas honestas", "Honest questions"], meta: ["Lo que necesitas saber antes de reservar.", "What to know before you book."] },
    { id: "comunidad", n: "02", label: ["No viajas solo", "You don\u2019t travel alone"], meta: ["Grupos pequeños de 6 a 8. Cómo funciona.", "Small groups of 6\u20138. How it works."] },
    { id: "manifiesto", n: "03", label: ["El manifiesto", "The manifesto"], meta: ["Por qué la ciudad se cuenta desde adentro.", "Why the city is told from the inside."] },
    { id: "servicios", n: "04", label: ["Una raíz, tres expresiones", "One root, three expressions"], meta: ["Recreo, Esporas y Raíz Studio.", "Recreo, Esporas and Raíz Studio."] },
    { id: "esporas", n: "05", label: ["Esporas & Détente", "Esporas & Détente"], meta: ["El brazo editorial y la revista — Nº 01 y Nº 02.", "The editorial arm and the magazine — issues No. 01 & 02."] },
    { id: "fundadores", n: "06", label: ["Quiénes fundaron Raíz", "Who founded Raíz"], meta: ["Fernanda Resendiz y Cesar Jeronimo Esquinca.", "Fernanda Resendiz and Cesar Jeronimo Esquinca."] },
    { id: "studio", n: "07", label: ["Raíz Studio · Asesoría", "Raíz Studio · Advisory"], meta: ["Formación y consultoría para operadores.", "Training and consulting for operators."] },
  ];

  return (
    <div className="discover-grid">
      {/* Column A — section navigation */}
      <div className="discover-nav">
        {sections.map((sec) => (
          <button
            key={sec.id}
            className={`discover-btn${active === sec.id ? " active" : ""}`}
            onClick={() => setActive(sec.id)}
            aria-expanded={active === sec.id}
          >
            <span className="disc-ix">{sec.n}</span>
            <div className="discover-btn-text">
              <span className="disc-tt">
                <span className="lng-es">{sec.label[0]}</span>
                <span className="lng-en">{sec.label[1]}</span>
              </span>
              <span className="disc-meta">
                <span className="lng-es">{sec.meta[0]}</span>
                <span className="lng-en">{sec.meta[1]}</span>
              </span>
            </div>
            <span className="disc-plus" aria-hidden="true"></span>
          </button>
        ))}
      </div>

      {/* Column B — content panel */}
      <div className="discover-panel">
        {active === "faq" && (
          <div className="discover-panel-inner">
            {FAQ_DATA.map((item) => (
              <div key={item.n} className="faq-item-block">
                <div className="faq-item-q">
                  <span className="qn">{item.n}</span>
                  <span className="qtxt"><span className="lng-es">{item.q[0]}</span><span className="lng-en">{item.q[1]}</span></span>
                </div>
                <div className="faq-item-a">
                  <p><span className="lng-es">{item.a[0]}</span><span className="lng-en">{item.a[1]}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}

        {active === "comunidad" && (
          <div className="discover-panel-inner disc-content">
            <span className="kicker"><span className="lng-es">La compañía</span><span className="lng-en">The company</span></span>
            <h3><span className="lng-es">No viajas solo.<br />Viajas con los <em>tuyos</em>.</span><span className="lng-en">You don&apos;t travel alone.<br />You travel with <em>your people</em>.</span></h3>
            <p className="lede"><span className="lng-es">Recreo se vive en grupos pequeños de desconocidos que rara vez siguen siéndolo.</span><span className="lng-en">Recreo happens in small groups of strangers who rarely stay strangers.</span></p>
            <div className="comm-stats">
              <div><div className="cn">6–8</div><div className="ck"><span className="lng-es">Personas por grupo</span><span className="lng-en">People per group</span></div></div>
              <div><div className="cn">1</div><div className="ck"><span className="lng-es">Anfitrión</span><span className="lng-en">Host</span></div></div>
              <div><div className="cn"><span className="lng-es">Día 1</span><span className="lng-en">Day 1</span></div><div className="ck"><span className="lng-es">Ya no son desconocidos</span><span className="lng-en">No longer strangers</span></div></div>
            </div>
          </div>
        )}

        {active === "manifiesto" && (
          <div className="discover-panel-inner disc-content" id="manifiesto">
            <span className="kicker">Editorial · Núm. 01</span>
            <h3><span className="lng-es">No se trata <em>sobre</em> nosotros.<br />La contamos <em>nosotros</em>.</span><span className="lng-en">It&apos;s not <em>about</em> us.<br />We tell it <em>ourselves</em>.</span></h3>
            <p className="lng-es">Durante años, alguien más contó esta ciudad. La empacó en rutas, la tradujo a una sola versión y se llevó el valor a otra parte. Raíz nace de una incomodidad simple: la Ciudad de México merece narrarse desde adentro.</p>
            <p className="lng-en">For years, someone else told this city to you. They packed it into routes, translated it into a single version, and took the value somewhere else. Raíz starts from a simple discomfort: Mexico City deserves to be told from the inside.</p>
            <p className="lng-es">No somos una agencia. Somos guías, cocineros, productores, fixers y vecinos que decidimos dejar de ser el telón de fondo de la experiencia de alguien más.</p>
            <p className="lng-en">We&apos;re not an agency. We&apos;re guides, cooks, producers, fixers and neighbors who decided to stop being the backdrop to someone else&apos;s experience.</p>
            <ul className="manifesto-principles">
              <li><span className="pn">01</span><span><span className="lng-es"><b>Contada en primera persona.</b> Quien te guía vive lo que narra.</span><span className="lng-en"><b>Told in the first person.</b> Whoever guides you lives what they tell.</span></span></li>
              <li><span className="pn">02</span><span><span className="lng-es"><b>El valor se queda.</b> Pagas a la comunidad, no a un intermediario.</span><span className="lng-en"><b>The value stays.</b> You pay the community, not a middleman.</span></span></li>
              <li><span className="pn">03</span><span><span className="lng-es"><b>Real antes que auténtico.</b> Mostramos la ciudad con sus tensiones.</span><span className="lng-en"><b>Real before authentic.</b> We show the city with its tensions.</span></span></li>
              <li><span className="pn">04</span><span><span className="lng-es"><b>Grupos pequeños.</b> Una conversación, no una multitud.</span><span className="lng-en"><b>Small groups.</b> A conversation, not a crowd.</span></span></li>
            </ul>
            <p className="manifesto-sign"><span className="lng-es">—El colectivo Raíz</span><span className="lng-en">—The Raíz collective</span><span>Ciudad de México · 2026</span></p>
          </div>
        )}

        {active === "servicios" && (
          <div className="discover-panel-inner disc-content">
            <span className="kicker"><span className="lng-es">El índice</span><span className="lng-en">The index</span></span>
            <h3><span className="lng-es">Una raíz, <em>tres</em> expresiones.</span><span className="lng-en">One root, <em>three</em> expressions.</span></h3>
            <div className="svc-grid">
              <a href="#recreo" className="svc" data-c="clay">
                <span className="svc-idx"><b>01</b> — <span className="lng-es">Experiencias</span><span className="lng-en">Experiences</span></span>
                <h4 className="svc-name">Recreo</h4>
                <span className="svc-tag">By Raíz · Experiences</span>
                <p className="svc-desc"><span className="lng-es">Experiencias de un día, hechas a la medida. Tres colecciones, cada una un mundo. Conexión, juego y curiosidad por encima del consumo.</span><span className="lng-en">One-day experiences, tailored by hand. Three collections, each its own world. Connection, play and curiosity over consumption.</span></p>
                <div className="svc-keys"><span><span className="lng-es">Conexión</span><span className="lng-en">Connection</span></span><span><span className="lng-es">Juego</span><span className="lng-en">Play</span></span><span><span className="lng-es">Curiosidad</span><span className="lng-en">Curiosity</span></span></div>
              </a>
              <a href="#esporas" className="svc" data-c="moss">
                <span className="svc-idx"><b>02</b> — Editorial</span>
                <h4 className="svc-name">Esporas</h4>
                <span className="svc-tag">By Raíz · Editorial</span>
                <p className="svc-desc"><span className="lng-es">El brazo editorial de Raíz. Despachos, cuadernos y handbooks —y la revista Détente, una guía de campo bilingüe a la ciudad en temporada.</span><span className="lng-en">Raíz&apos;s editorial arm. Dispatches, notebooks and handbooks —and the magazine Détente, a bilingual field guide to the city in season.</span></p>
                <div className="svc-keys"><span>Détente</span><span><span className="lng-es">Despachos</span><span className="lng-en">Dispatches</span></span><span>Handbooks</span></div>
              </a>
              <a href="#studio" className="svc" data-c="slate">
                <span className="svc-idx"><b>03</b> — <span className="lng-es">Consultoría</span><span className="lng-en">Consulting</span></span>
                <h4 className="svc-name">Raíz Studio</h4>
                <span className="svc-tag">Training &amp; Consulting</span>
                <p className="svc-desc"><span className="lng-es">Formación de equipos, gestión de crisis y diseño de viaje a la medida para operadores y servicios de concierge.</span><span className="lng-en">Team training, crisis management and bespoke travel design for operators and concierge services.</span></p>
                <div className="svc-keys"><span>Training</span><span>Consulting</span><span>Travel design</span></div>
              </a>
            </div>
          </div>
        )}

        {active === "esporas" && (
          <div className="discover-panel-inner disc-content">
            <span className="kicker"><span className="lng-es">Esporas · El brazo editorial</span><span className="lng-en">Esporas · The editorial arm</span></span>
            <h3><span className="lng-es">Lo que aprendemos, <em>impreso</em>.</span><span className="lng-en">What we learn, <em>in print</em>.</span></h3>
            <p className="lede"><span className="lng-es">Esporas es la editorial de Raíz: despachos, cuadernos y handbooks que llevan la voz de la ciudad a la página. Su primer título mayor es <b>Détente</b> —una guía de campo bilingüe a la Ciudad de México en temporada.</span><span className="lng-en">Esporas is Raíz&apos;s publishing house: dispatches, notebooks and handbooks that carry the city&apos;s voice to the page. Its first major title is <b>Détente</b> —a bilingual field guide to Mexico City in season.</span></p>

            <article className="detente">
              <div className="detente-cover">
                <div className="dc-top">
                  <span className="dc-mark">By Raíz</span>
                  <span><span className="lng-es">Número 02 · Último</span><span className="lng-en">Issue 02 · Latest</span></span>
                </div>
                <div>
                  <div className="dc-title">D<span className="seed">é</span>tente</div>
                  <div className="dc-sub"><span className="lng-es">Field Guide · Afición y equipo</span><span className="lng-en">Field Guide · Fandom &amp; team</span></div>
                </div>
                <div className="dc-top"><span>Esporas Editorial</span><span>ES / EN</span></div>
              </div>
              <div className="detente-body">
                <span className="db-kicker"><span className="lng-es">La revista de Esporas · Nº 02 · Último número</span><span className="lng-en">The Esporas magazine · No. 02 · Latest issue</span></span>
                <h4><span className="lng-es">Elige bien, pierde bien, canta mejor.</span><span className="lng-en">Choose well, lose well, sing better.</span></h4>
                <p><span className="lng-es">Sobre armar la banda, conocer a los tuyos y querer al desfavorito. Apoya a tu equipo, pierde con clase y ponte otra camiseta sin cambiar de alma.</span><span className="lng-en">On getting the band together, knowing your people, and rooting for the underdog. Back your team, lose with class, then put on another shirt without changing your soul.</span></p>
                <div className="db-meta"><span><span className="lng-es">Bilingüe ES/EN</span><span className="lng-en">Bilingual ES/EN</span></span><span><span className="lng-es">Afición</span><span className="lng-en">Fandom</span></span><span><span className="lng-es">Temporada · 2026</span><span className="lng-en">In season · 2026</span></span></div>
                <div style={{ display: "flex", gap: "1.2rem", alignItems: "center", flexWrap: "wrap" }}>
                  <a href="/detente/02" className="db-cta"><span className="lng-es">Lee Détente Nº 02 →</span><span className="lng-en">Read Détente No. 02 →</span></a>
                </div>
              </div>
            </article>

            <article className="detente">
              <div className="detente-cover">
                <div className="dc-top">
                  <span className="dc-mark">By Raíz</span>
                  <span><span className="lng-es">Número 01</span><span className="lng-en">Issue 01</span></span>
                </div>
                <div>
                  <div className="dc-title">D<span className="seed">é</span>tente</div>
                  <div className="dc-sub"><span className="lng-es">Field Guide · CDMX en temporada</span><span className="lng-en">Field Guide · CDMX in season</span></div>
                </div>
                <div className="dc-top"><span>Esporas Editorial</span><span>ES / EN</span></div>
              </div>
              <div className="detente-body">
                <span className="db-kicker"><span className="lng-es">La revista de Esporas · Nº 01 · Número anterior</span><span className="lng-en">The Esporas magazine · No. 01 · Previous issue</span></span>
                <h4><span className="lng-es">El Mundial, leído desde la ciudad.</span><span className="lng-en">The World Cup, read from the city.</span></h4>
                <p><span className="lng-es">Una guía de campo para vivir la Copa 2026 sin perder la ciudad real: dónde comer, cómo moverse, qué no creer y a quién escuchar.</span><span className="lng-en">A field guide for living the 2026 World Cup without losing the real city: where to eat, how to move, what not to believe, and who to listen to.</span></p>
                <div className="db-meta"><span><span className="lng-es">Bilingüe ES/EN</span><span className="lng-en">Bilingual ES/EN</span></span><span><span className="lng-es">Guía de campo</span><span className="lng-en">Field guide</span></span><span><span className="lng-es">Temporada · 2026</span><span className="lng-en">In season · 2026</span></span></div>
                <div style={{ display: "flex", gap: "1.2rem", alignItems: "center", flexWrap: "wrap" }}>
                  <a href="/detente/01" className="db-cta"><span className="lng-es">Lee Détente Nº 01 →</span><span className="lng-en">Read Détente No. 01 →</span></a>
                </div>
              </div>
            </article>
          </div>
        )}

        {active === "fundadores" && (
          <div className="discover-panel-inner disc-content">
            <p className="lede" style={{ maxWidth: "62ch", marginBottom: "clamp(12px, 2vh, 20px)" }}><span className="lng-es">No contratamos narradores. Raíz la sostienen dos raíces —estrategia de viaje de clase mundial y oficio de territorio— y un equipo de especialistas que conoce cada línea desde adentro.</span><span className="lng-en">We don&apos;t hire narrators. Raíz is held up by two roots —world-class travel strategy and the craft of the territory— and a team of specialists who know each line from the inside.</span></p>
            <div className="founders">
              <article className="founder-card" data-c="slate">
                <div className="fc-top">
                  <span className="fc-avatar"><img src="/assets/team-fernanda.jpg" alt="Fernanda Resendiz" /></span>
                  <div className="fc-id">
                    <span className="fc-role"><span className="lng-es">Co-fundadora · Strategy</span><span className="lng-en">Co-founder · Strategy</span></span>
                    <h3 className="fc-name">Fernanda Resendiz</h3>
                    <span className="fc-disc">Travel &amp; Experience Design</span>
                  </div>
                </div>
                <p className="fc-bio"><span className="lng-es">Una década en el corazón de la aerolínea más grande de México: customer journeys, estrategia con el C-suite y planeación de red. Las mejores experiencias de viaje no son accidentales —se diseñan.</span><span className="lng-en">A decade at the heart of Mexico&apos;s largest airline: customer journeys, C-suite strategy and network planning. The best travel experiences aren&apos;t accidental —they&apos;re designed.</span></p>
                <ul className="fc-cred">
                  <li><span>01</span> Aeroméxico — Chief of Staff to CEO</li>
                  <li><span>02</span> Customer Experience · Network Planning</li>
                  <li><span>03</span> <span className="lng-es">ITAM — Relaciones Internacionales</span><span className="lng-en">ITAM — International Relations</span></li>
                </ul>
              </article>
              <article className="founder-card" data-c="clay">
                <div className="fc-top">
                  <span className="fc-avatar"><img src="/assets/team-cesar.jpg" alt="Cesar Jeronimo Esquinca" /></span>
                  <div className="fc-id">
                    <span className="fc-role"><span className="lng-es">Co-fundador · Cultura</span><span className="lng-en">Co-founder · Culture</span></span>
                    <h3 className="fc-name">Cesar Jeronimo Esquinca</h3>
                    <span className="fc-disc"><span className="lng-es">Facilitador · Cocinero de raíz</span><span className="lng-en">Facilitator · Roots cook</span></span>
                  </div>
                </div>
                <p className="fc-bio"><span className="lng-es">Más de quince años en la intersección entre territorio, gastronomía y comunidad. Ha cocinado en Italia, Inglaterra y Francia, posicionado mezcal artesanal y coordinado respuesta de emergencia en tres continentes.</span><span className="lng-en">Over fifteen years at the intersection of territory, gastronomy and community. He has cooked in Italy, England and France, positioned artisanal mezcal, and coordinated emergency response across three continents.</span></p>
                <ul className="fc-cred">
                  <li><span>01</span> <span className="lng-es">Bonito Mezcal — Estratega de valor</span><span className="lng-en">Bonito Mezcal — Value strategist</span></li>
                  <li><span>02</span> <span className="lng-es">Médicos Sin Fronteras — Respuesta de emergencia</span><span className="lng-en">Doctors Without Borders — Emergency response</span></li>
                  <li><span>03</span> <span className="lng-es">Institut Paul Bocuse — Cocina de mercado</span><span className="lng-en">Institut Paul Bocuse — Market cooking</span></li>
                </ul>
              </article>
            </div>
          </div>
        )}

        {active === "studio" && (
          <div className="discover-panel-inner disc-content">
            <span className="kicker">Raíz Studio · Bespoke</span>
            <h3><span className="lng-es">Asesoría y <em>formación</em> con sensibilidad cultural.</span><span className="lng-en">Advisory and <em>training</em> with cultural sensibility.</span></h3>
            <p className="lede"><span className="lng-es">Más allá de la experiencia: ayudamos a operadores, hoteles y servicios de concierge a diseñar viaje y a recibir mejor —travel design privado, consultoría y formación de equipos con la misma sensibilidad cultural que define a Raíz.</span><span className="lng-en">Beyond the experience: we help operators, hotels and concierge services design travel and host better —private travel design, consulting and team training with the same cultural sensibility that defines Raíz.</span></p>
            <div className="studio-grid">
              <article className="studio-card" data-c="clay">
                <span className="sc-idx"><b>01</b> — Training</span>
                <h4 className="sc-name">Staff Training</h4>
                <p className="sc-line"><span className="lng-es">Experiencia del huésped intercultural.</span><span className="lng-en">The intercultural guest experience.</span></p>
                <p className="sc-desc"><span className="lng-es">Formamos equipos de contacto para leer y servir a huéspedes de culturas distintas —del primer saludo a la despedida— sin perder lo propio.</span><span className="lng-en">We train front-line teams to read and serve guests from different cultures —from the first hello to the goodbye— without losing who they are.</span></p>
              </article>
              <article className="studio-card" data-c="moss">
                <span className="sc-idx"><b>02</b> — Advisory</span>
                <h4 className="sc-name">Crisis &amp; Safety</h4>
                <p className="sc-line"><span className="lng-es">Gestión de riesgo en alto contacto.</span><span className="lng-en">High-contact risk management.</span></p>
                <p className="sc-desc"><span className="lng-es">Protocolos y acompañamiento para operar con seguridad en entornos complejos, con experiencia real de respuesta de emergencia en tres continentes.</span><span className="lng-en">Protocols and support to operate safely in complex environments, with real emergency-response experience across three continents.</span></p>
              </article>
              <article className="studio-card" data-c="slate">
                <span className="sc-idx"><b>03</b> — Design</span>
                <h4 className="sc-name">Travel Design</h4>
                <p className="sc-line"><span className="lng-es">Itinerarios bespoke para operadores.</span><span className="lng-en">Bespoke itineraries for operators.</span></p>
                <p className="sc-desc"><span className="lng-es">Diseño de viaje privado y a la medida —la misma metodología de Recreo, puesta al servicio de tu marca y tus huéspedes.</span><span className="lng-en">Private, made-to-measure travel design —the same Recreo methodology, put to work for your brand and your guests.</span></p>
              </article>
            </div>
            <div className="studio-foot">
              <p className="mono"><span className="lng-es">Para operadores, hoteles y concierge · CDMX y a distancia</span><span className="lng-en">For operators, hotels and concierge · CDMX &amp; remote</span></p>
              <a href="mailto:alaraiz@pm.me?subject=Ra%C3%ADz%20Studio%20%C2%B7%20Advisory%20%26%20Training" className="btn btn-solid"><span className="lng-es">Hablemos de tu equipo</span><span className="lng-en">Let&apos;s talk about your team</span></a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SECTION_IDS = ["top", "recreo", "especialistas", "rsvp", "descubre", "footer"];

function SectionNav() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sections.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveIdx(idx);
          }
        });
      },
      { root: main, threshold: 0.5 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="section-nav" aria-label="Section indicator">
      {SECTION_IDS.map((id, i) => (
        <a
          key={id}
          href={`#${id}`}
          className={`section-dot${i === activeIdx ? " active" : ""}`}
          aria-label={id}
        />
      ))}
    </nav>
  );
}
