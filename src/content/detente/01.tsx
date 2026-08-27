"use client";

/**
 * Détente · Issue 01 — "Make the Most of Your World Cup in Mexico"
 * Editorial zine content: chapters, teams, founders, colophon.
 */
export default function DetenteIssue01() {
  return (
    <article className="detente-issue">
      {/* ── Masthead ── */}
      <header className="dt-masthead dt-reveal dt-revealed">
        <span className="dt-issue-label">Détente · Núm. 01</span>
        <h1 className="dt-title">
          D<span className="seed">é</span>tente<span className="seed">.</span>
        </h1>
        <p className="dt-subtitle">
          <span className="lng-es">Make the Most of Your World Cup in Mexico</span>
          <span className="lng-en">Make the Most of Your World Cup in Mexico</span>
        </p>
        <div className="dt-meta">
          <span>CDMX 2026</span>
          <span>
            <span className="lng-es">Guía cultural para el viajero del Mundial</span>
            <span className="lng-en">A cultural guide for the World Cup traveler</span>
          </span>
        </div>
      </header>

      {/* ── Chapter 1: La ciudad te espera ── */}
      <section className="dt-chapter dt-reveal">
        <span className="dt-chapter-kicker">
          <span className="lng-es">Capítulo I</span>
          <span className="lng-en">Chapter I</span>
        </span>
        <h2 className="dt-chapter-title">
          <span className="lng-es">La ciudad te espera</span>
          <span className="lng-en">The city awaits you</span>
        </h2>
        <div className="dt-prose">
          <p className="drop-cap">
            <span className="lng-es">
              La Ciudad de México es mucho más que un estadio. Es una metrópolis de capas: prehispánica,
              colonial, revolucionaria, contemporánea. Cada colonia tiene su propia historia, su mercado,
              su ritmo. El Mundial 2026 te trae hasta aquí; nosotros te mostramos lo que hay debajo del
              asfalto, entre los callejones y detrás de las puertas que no tienen letrero.
            </span>
            <span className="lng-en">
              Mexico City is much more than a stadium. It&apos;s a layered metropolis: pre-Hispanic,
              colonial, revolutionary, contemporary. Every neighborhood has its own history, its market,
              its rhythm. The 2026 World Cup brings you here; we show you what lies beneath the asphalt,
              between the alleyways, and behind doors that have no sign.
            </span>
          </p>
          <p>
            <span className="lng-es">
              Détente es una publicación de Raíz — una invitación a pausar, mirar con atención,
              y dejarte guiar por quienes viven esta ciudad todos los días. No es una guía turística;
              es un manifiesto de viaje lento.
            </span>
            <span className="lng-en">
              Détente is a publication by Raíz — an invitation to pause, look closely, and let yourself
              be guided by those who live this city every day. It&apos;s not a tourist guide; it&apos;s
              a slow travel manifesto.
            </span>
          </p>
        </div>
        <blockquote className="dt-pull">
          <span className="lng-es">&ldquo;El mejor souvenir no cabe en la maleta — es una conversación que te cambió.&rdquo;</span>
          <span className="lng-en">&ldquo;The best souvenir doesn&apos;t fit in your suitcase — it&apos;s a conversation that changed you.&rdquo;</span>
        </blockquote>
      </section>

      {/* ── Chapter 2: Cómo vivir el Mundial ── */}
      <section className="dt-chapter dt-reveal">
        <span className="dt-chapter-kicker">
          <span className="lng-es">Capítulo II</span>
          <span className="lng-en">Chapter II</span>
        </span>
        <h2 className="dt-chapter-title">
          <span className="lng-es">Cómo vivir el Mundial desde adentro</span>
          <span className="lng-en">How to live the World Cup from the inside</span>
        </h2>
        <div className="dt-prose">
          <p>
            <span className="lng-es">
              El fútbol en México no se vive solo en el estadio. Se vive en las plazas, en las azoteas,
              en las cantinas de barrio donde el gol se siente en el piso. Aquí te contamos dónde ir,
              qué comer y con quién hablar para que tu experiencia del Mundial sea algo que no olvidarás.
            </span>
            <span className="lng-en">
              Football in Mexico isn&apos;t just lived in stadiums. It&apos;s lived in the plazas,
              on rooftops, in neighborhood cantinas where the goal reverberates through the floor.
              Here we tell you where to go, what to eat, and who to talk to so your World Cup
              experience becomes something you&apos;ll never forget.
            </span>
          </p>
          <p>
            <span className="lng-es">
              Te llevamos a los talleres de los artesanos que hacen las banderas a mano,
              a la cocina de la señora que prepara pozole para el barrio entero en cada partido,
              y a la cancha de tierra donde los niños juegan con la misma pasión que los profesionales.
            </span>
            <span className="lng-en">
              We take you to the workshops of artisans who make flags by hand, to the kitchen of the
              woman who prepares pozole for the entire neighborhood every match day, and to the dirt
              pitch where kids play with the same passion as the professionals.
            </span>
          </p>
        </div>
      </section>

      {/* ── Chapter 3: Los equipos que vienen ── */}
      <section className="dt-chapter dt-reveal">
        <span className="dt-chapter-kicker">
          <span className="lng-es">Capítulo III</span>
          <span className="lng-en">Chapter III</span>
        </span>
        <h2 className="dt-chapter-title">
          <span className="lng-es">Los equipos que vienen</span>
          <span className="lng-en">The teams arriving</span>
        </h2>
        <div className="dt-prose">
          <p>
            <span className="lng-es">
              Conoce a las selecciones que jugarán en la CDMX. No solo su fútbol — sus historias,
              sus ritmos, sus tradiciones culinarias. Porque cada equipo trae un mundo consigo.
            </span>
            <span className="lng-en">
              Meet the national teams playing in CDMX. Not just their football — their stories,
              their rhythms, their culinary traditions. Because each team brings a world with them.
            </span>
          </p>
        </div>
      </section>

      {/* ── Teams ── */}
      <section className="dt-team-section dt-reveal">
        <h2 className="dt-team-title">
          <span className="lng-es">Selecciones en la CDMX</span>
          <span className="lng-en">Teams in CDMX</span>
        </h2>
        <div className="dt-team-grid">
          <div className="dt-team-card">
            <span className="dt-card-country">México 🇲🇽</span>
            <h3 className="dt-card-name">El Tri</h3>
            <p className="dt-card-bio">
              <span className="lng-es">La selección anfitriona, con todo un país detrás.</span>
              <span className="lng-en">The host nation, with an entire country behind them.</span>
            </p>
          </div>
          <div className="dt-team-card">
            <span className="dt-card-country">Argentina 🇦🇷</span>
            <h3 className="dt-card-name">La Albiceleste</h3>
            <p className="dt-card-bio">
              <span className="lng-es">Campeones vigentes. Fútbol como poesía.</span>
              <span className="lng-en">Reigning champions. Football as poetry.</span>
            </p>
          </div>
          <div className="dt-team-card">
            <span className="dt-card-country">Japón 🇯🇵</span>
            <h3 className="dt-card-name">Samurai Blue</h3>
            <p className="dt-card-bio">
              <span className="lng-es">Disciplina, respeto y una afición que limpia el estadio al salir.</span>
              <span className="lng-en">Discipline, respect, and fans who clean the stadium as they leave.</span>
            </p>
          </div>
          <div className="dt-team-card">
            <span className="dt-card-country">Senegal 🇸🇳</span>
            <h3 className="dt-card-name">Teranga Lions</h3>
            <p className="dt-card-bio">
              <span className="lng-es">El ritmo de África occidental en cada jugada.</span>
              <span className="lng-en">The rhythm of West Africa in every play.</span>
            </p>
          </div>
          <div className="dt-team-card">
            <span className="dt-card-country">Colombia 🇨🇴</span>
            <h3 className="dt-card-name">Los Cafeteros</h3>
            <p className="dt-card-bio">
              <span className="lng-es">Cumbia, café y un fútbol que hace bailar.</span>
              <span className="lng-en">Cumbia, coffee, and football that makes you dance.</span>
            </p>
          </div>
          <div className="dt-team-card">
            <span className="dt-card-country">Alemania 🇩🇪</span>
            <h3 className="dt-card-name">Die Mannschaft</h3>
            <p className="dt-card-bio">
              <span className="lng-es">Precisión y eficiencia. Cuatro veces campeones del mundo.</span>
              <span className="lng-en">Precision and efficiency. Four-time world champions.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Founders ── */}
      <section className="dt-founders dt-reveal">
        <h2 className="dt-chapter-title">
          <span className="lng-es">Quiénes hacemos Détente</span>
          <span className="lng-en">Who makes Détente</span>
        </h2>
        <div className="dt-prose" style={{ marginBottom: "1.6rem" }}>
          <p>
            <span className="lng-es">
              Détente es un proyecto editorial de Raíz. Creemos que viajar bien empieza por detenerse —
              y que las mejores historias las cuentan quienes las viven.
            </span>
            <span className="lng-en">
              Détente is an editorial project by Raíz. We believe good travel starts by pausing —
              and the best stories are told by those who live them.
            </span>
          </p>
        </div>
        <div className="dt-founder-card">
          <span className="dt-founder-avatar">DR</span>
          <div className="dt-founder-info">
            <span className="dt-founder-name">David Reyes</span>
            <span className="dt-founder-role">
              <span className="lng-es">Director creativo · Raíz</span>
              <span className="lng-en">Creative Director · Raíz</span>
            </span>
          </div>
        </div>
        <div className="dt-founder-card">
          <span className="dt-founder-avatar">CR</span>
          <div className="dt-founder-info">
            <span className="dt-founder-name">Cristina Ruiz</span>
            <span className="dt-founder-role">
              <span className="lng-es">Editora en jefe · Détente</span>
              <span className="lng-en">Editor in Chief · Détente</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── Colophon ── */}
      <section className="dt-colophon dt-reveal">
        <div className="dt-colophon-brand">
          D<span className="seed">é</span>tente<span className="seed">.</span>
        </div>
        <p className="dt-colophon-tagline">
          <span className="lng-es">Una publicación de Raíz · CDMX · 2026</span>
          <span className="lng-en">A publication by Raíz · CDMX · 2026</span>
        </p>
      </section>

      {/* ── Footer ── */}
      <footer className="dt-footer">
        <span className="dt-footer-copy">© Raíz · Détente Nº 01 · 2026</span>
        <nav className="dt-footer-links">
          <a href="/">Raíz</a>
          <a href="/detente/02">Nº 02</a>
          <a href="https://instagram.com/detentebyraiz" target="_blank" rel="noopener noreferrer">@detentebyraiz</a>
        </nav>
      </footer>
    </article>
  );
}
