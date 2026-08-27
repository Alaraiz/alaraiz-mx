"use client";

/**
 * Détente · Issue 02 — "Elige bien, pierde bien, canta mejor"
 * Editorial zine content: chapters, teams, founders, colophon.
 */
export default function DetenteIssue02() {
  return (
    <article className="detente-issue">
      {/* ── Masthead ── */}
      <header className="dt-masthead dt-reveal dt-revealed">
        <span className="dt-issue-label">Détente · Núm. 02</span>
        <h1 className="dt-title">
          <span className="lng-es">Elige bien<span className="seed">.</span></span>
          <span className="lng-en">Choose well<span className="seed">.</span></span>
        </h1>
        <p className="dt-subtitle">
          <span className="lng-es">Pierde bien, canta mejor.</span>
          <span className="lng-en">Lose well, sing louder.</span>
        </p>
        <div className="dt-meta">
          <span>CDMX 2026</span>
          <span>
            <span className="lng-es">Guía del hincha con criterio</span>
            <span className="lng-en">The discerning fan&apos;s guide</span>
          </span>
        </div>
      </header>

      {/* ── Chapter 1: El arte de elegir equipo ── */}
      <section className="dt-chapter dt-reveal">
        <span className="dt-chapter-kicker">
          <span className="lng-es">Capítulo I</span>
          <span className="lng-en">Chapter I</span>
        </span>
        <h2 className="dt-chapter-title">
          <span className="lng-es">El arte de elegir equipo</span>
          <span className="lng-en">The art of choosing a team</span>
        </h2>
        <div className="dt-prose">
          <p className="drop-cap">
            <span className="lng-es">
              No hace falta que tu equipo gane para que el viaje valga la pena. En un Mundial,
              las mejores historias las escriben los que llegan sin expectativa y se van con el
              corazón lleno. Este número de Détente es para los que eligen con criterio: no el
              equipo más fuerte, sino el que más tiene que contar.
            </span>
            <span className="lng-en">
              Your team doesn&apos;t need to win for the trip to be worth it. At a World Cup,
              the best stories are written by those who arrive with no expectations and leave
              with full hearts. This issue of Détente is for those who choose wisely: not the
              strongest team, but the one with the most to tell.
            </span>
          </p>
          <p>
            <span className="lng-es">
              Te presentamos selecciones que tal vez no conocías — equipos cuya historia merece
              ser contada, cuya hinchada transforma las gradas en un ritual, y cuya presencia
              en México será una fiesta que no querrás perderte.
            </span>
            <span className="lng-en">
              We introduce you to national teams you might not have known — teams whose stories
              deserve to be told, whose fans transform the stands into a ritual, and whose
              presence in Mexico will be a celebration you won&apos;t want to miss.
            </span>
          </p>
        </div>
        <blockquote className="dt-pull">
          <span className="lng-es">&ldquo;Perder un partido y ganar una ciudad entera — eso es viajar.&rdquo;</span>
          <span className="lng-en">&ldquo;Losing a match and winning an entire city — that&apos;s travel.&rdquo;</span>
        </blockquote>
      </section>

      {/* ── Chapter 2: Cantar mejor ── */}
      <section className="dt-chapter dt-reveal">
        <span className="dt-chapter-kicker">
          <span className="lng-es">Capítulo II</span>
          <span className="lng-en">Chapter II</span>
        </span>
        <h2 className="dt-chapter-title">
          <span className="lng-es">Cantar mejor</span>
          <span className="lng-en">Sing louder</span>
        </h2>
        <div className="dt-prose">
          <p>
            <span className="lng-es">
              En cada Mundial, la banda sonora la ponen los hinchas. Pero no todos cantan igual.
              Algunos equipos traen tambores, otros trompetas, otros sólo gargantas y corazón.
              Aquí celebramos las hinchadas que transforman un estadio en un carnaval — y las
              que hacen de la derrota una canción tan hermosa como la victoria.
            </span>
            <span className="lng-en">
              At every World Cup, the soundtrack is set by the fans. But not everyone sings the same.
              Some teams bring drums, others trumpets, others just throats and heart. Here we
              celebrate the fan bases that turn a stadium into a carnival — and those who make
              defeat a song as beautiful as victory.
            </span>
          </p>
          <p>
            <span className="lng-es">
              México sabe de esto. Un país donde el &ldquo;Cielito Lindo&rdquo; suena más fuerte
              cuando vas perdiendo. Donde la fiesta no depende del marcador sino de la compañía.
            </span>
            <span className="lng-en">
              Mexico knows about this. A country where &ldquo;Cielito Lindo&rdquo; sounds louder
              when you&apos;re losing. Where the party doesn&apos;t depend on the scoreboard
              but on the company.
            </span>
          </p>
        </div>
      </section>

      {/* ── Chapter 3: Equipos con alma ── */}
      <section className="dt-chapter dt-reveal">
        <span className="dt-chapter-kicker">
          <span className="lng-es">Capítulo III</span>
          <span className="lng-en">Chapter III</span>
        </span>
        <h2 className="dt-chapter-title">
          <span className="lng-es">Equipos con alma</span>
          <span className="lng-en">Teams with soul</span>
        </h2>
        <div className="dt-prose">
          <p>
            <span className="lng-es">
              Selecciones que llegan al Mundial con historias más grandes que el fútbol mismo.
              Equipos que representan pueblos resilientes, culturas milenarias, y sueños que
              desafían las probabilidades.
            </span>
            <span className="lng-en">
              National teams that arrive at the World Cup with stories bigger than football itself.
              Teams that represent resilient peoples, millennial cultures, and dreams that defy
              the odds.
            </span>
          </p>
        </div>
      </section>

      {/* ── Teams ── */}
      <section className="dt-team-section dt-reveal">
        <h2 className="dt-team-title">
          <span className="lng-es">Las selecciones de este número</span>
          <span className="lng-en">This issue&apos;s featured teams</span>
        </h2>
        <div className="dt-team-grid">
          <div className="dt-team-card">
            <span className="dt-card-country">Congo 🇨🇩</span>
            <h3 className="dt-card-name">Les Léopards</h3>
            <p className="dt-card-bio">
              <span className="lng-es">El corazón de África. Rumba, resistencia y un fútbol que es celebración pura.</span>
              <span className="lng-en">The heart of Africa. Rumba, resistance, and football that is pure celebration.</span>
            </p>
          </div>
          <div className="dt-team-card">
            <span className="dt-card-country">Uzbekistán 🇺🇿</span>
            <h3 className="dt-card-name">Oq Boʻrilar</h3>
            <p className="dt-card-bio">
              <span className="lng-es">La Ruta de la Seda llega al fútbol. Samarcanda en cada pase.</span>
              <span className="lng-en">The Silk Road meets football. Samarkand in every pass.</span>
            </p>
          </div>
          <div className="dt-team-card">
            <span className="dt-card-country">Irak 🇮🇶</span>
            <h3 className="dt-card-name">Usood Al-Rafidain</h3>
            <p className="dt-card-bio">
              <span className="lng-es">Los Leones de Mesopotamia. Un equipo forjado en la adversidad.</span>
              <span className="lng-en">The Lions of Mesopotamia. A team forged in adversity.</span>
            </p>
          </div>
          <div className="dt-team-card">
            <span className="dt-card-country">Panamá 🇵🇦</span>
            <h3 className="dt-card-name">Los Canaleros</h3>
            <p className="dt-card-bio">
              <span className="lng-es">Hermanos centroamericanos. Reggaetón en la tribuna y corazón en la cancha.</span>
              <span className="lng-en">Central American brothers. Reggaeton in the stands and heart on the pitch.</span>
            </p>
          </div>
          <div className="dt-team-card">
            <span className="dt-card-country">Nueva Zelanda 🇳🇿</span>
            <h3 className="dt-card-name">All Whites</h3>
            <p className="dt-card-bio">
              <span className="lng-es">El haka antes del partido. Oceanía en la fiesta más grande del mundo.</span>
              <span className="lng-en">The haka before the match. Oceania at the world&apos;s biggest party.</span>
            </p>
          </div>
          <div className="dt-team-card">
            <span className="dt-card-country">Camerún 🇨🇲</span>
            <h3 className="dt-card-name">Les Lions Indomptables</h3>
            <p className="dt-card-bio">
              <span className="lng-es">Leones Indomables. Makossa, tambores y un legado mundialista épico.</span>
              <span className="lng-en">Indomitable Lions. Makossa, drums, and an epic World Cup legacy.</span>
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
              Détente es un proyecto editorial de Raíz. Creemos en el viaje que empieza por detenerse.
            </span>
            <span className="lng-en">
              Détente is an editorial project by Raíz. We believe in travel that starts by pausing.
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
        <span className="dt-footer-copy">© Raíz · Détente Nº 02 · 2026</span>
        <nav className="dt-footer-links">
          <a href="/">Raíz</a>
          <a href="/detente/01">Nº 01</a>
          <a href="https://instagram.com/detentebyraiz" target="_blank" rel="noopener noreferrer">@detentebyraiz</a>
        </nav>
      </footer>
    </article>
  );
}
