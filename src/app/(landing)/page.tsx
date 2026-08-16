"use client";

import { useEffect, useRef, useState } from "react";
import ProximasFechas from "./proximas-fechas";

/**
 * Landing page — full conversion from index.html.
 * Hero with hover-reveal preserved, followed by all original sections.
 */
export default function HomePage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  return (
    <main>
      {/* ============ HERO ============ */}
      <section className="hero section-screen" id="top">
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
          <div className="reveal-overlay">
            <span className="hero-eyebrow">
              <span className="lng-es">Ciudad de México · Experiencias de un día</span>
              <span className="lng-en">Mexico City · One-day experiences</span>
            </span>
            <h1>
              <span className="lng-es">La ciudad<br /><em>debajo</em> de la ciudad.</span>
              <span className="lng-en">The city<br /><em>beneath</em> the city.</span>
            </h1>
            <p className="hero-dek">
              <span className="lng-es">Existe una versión de la Ciudad de México que no aparece en ninguna plataforma. Raíz te lleva ahí —con quienes la habitan, no quienes la venden.</span>
              <span className="lng-en">There&apos;s a version of Mexico City that lives on no platform. Raíz takes you there —with the people who inhabit it, not the ones who sell it.</span>
            </p>
            <div className="hero-actions">
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
          <div className="masthead">
            <div className="mh-l">
              <span className="kicker"><span className="lng-es">Recreo · Experiencias de un día</span><span className="lng-en">Recreo · One-day experiences</span></span>
              <h2><span className="lng-es">Tres <em>experiencias</em>,<br />cada una un mundo.</span><span className="lng-en">Three <em>experiences</em>,<br />each its own world.</span></h2>
            </div>
            <span className="folio"><span className="lng-es">Desliza para recorrerlas</span><span className="lng-en">Swipe to explore</span></span>
          </div>

          <div className="rec-rail" id="recRail">
          {/* Card I – Cocinando Resistencia */}
          <article className="rec-card" data-c="moss">
            <div className="rec-media">
              <img src="/assets/exp-mesa.jpg" alt="Mesa con jícaras, molcajetes y masa — cocina de raíz" />
              <span className="rec-roman">II</span>
              <span className="rec-col"><span className="pill"></span> Poner la Mesa · Colección II</span>
            </div>
            <div className="rec-body">
              <span className="rec-tags">Craft · Comunidad · Resistencia</span>
              <h3 className="rec-name">Cocinando Resistencia</h3>
              <p className="rec-product"><span className="lng-es">La mesa como territorio político. Una ruta a pie por panadería cooperativa, kombucha de barrio, pulque centenario y cocina queer de resistencia.</span><span className="lng-en">The table as political territory. A walking route through a cooperative bakery, neighborhood kombucha, century-old pulque and queer kitchens of resistance.</span></p>
              <p className="rec-pull"><span className="lng-es">«Quién cocina, quién resiste y quién se queda con el valor.»</span><span className="lng-en">&ldquo;Who cooks, who resists, and who keeps the value.&rdquo;</span></p>
              <div className="rec-spec">
                <div className="rs"><span className="rsk"><span className="lng-es">Duración</span><span className="lng-en">Length</span></span><span className="rsv"><span className="lng-es">5 horas · ruta a pie</span><span className="lng-en">5 hours · on foot</span></span></div>
                <div className="rs"><span className="rsk"><span className="lng-es">Ritmo</span><span className="lng-en">Pace</span></span><span className="rsv meter"><span className="dots"><i className="on"></i><i className="on"></i><i></i></span><span className="ml"><span className="lng-es">Con pausas</span><span className="lng-en">With breaks</span></span></span></div>
                <div className="rs"><span className="rsk"><span className="lng-es">Zona</span><span className="lng-en">Area</span></span><span className="rsv"><span className="lng-es">San Rafael → Centro</span><span className="lng-en">San Rafael → Centro</span></span></div>
                <div className="rs"><span className="rsk"><span className="lng-es">Idioma</span><span className="lng-en">Language</span></span><span className="rsv">ES / EN</span></div>
              </div>
              <div className="rec-foot">
                <div className="rec-lead"><span className="lead-avatar">AR</span><span className="lead-meta"><span className="lbl"><span className="lng-es">Anfitriona</span><span className="lng-en">Host</span></span><span className="nm">Ana Cristina Rubio</span></span></div>
                <a href="#rsvp" className="rec-cta"><span className="lng-es">Solicitar →</span><span className="lng-en">Apply →</span></a>
              </div>
            </div>
          </article>

          {/* Card II – ¡Aguas! */}
          <article className="rec-card" data-c="slate">
            <div className="rec-media">
              <img src="/assets/exp-aguas.jpg" alt="Tuberías de agua y vegetación — la infraestructura hídrica de la ciudad" />
              <span className="rec-roman">III</span>
              <span className="rec-col"><span className="pill"></span> Bajotierra · Colección III</span>
            </div>
            <div className="rec-body">
              <span className="rec-tags">Agua · Historia · Arte</span>
              <h3 className="rec-name">¡Aguas!</h3>
              <p className="rec-product"><span className="lng-es">La ciudad que se quedó sin su lago. Del antiguo Texcoco a la crisis del agua, entre los murales de Diego Rivera en el Cárcamo de Dolores y un picnic en Chapultepec.</span><span className="lng-en">The city that lost its lake. From ancient Texcoco to the water crisis, between Diego Rivera&apos;s murals at the Cárcamo de Dolores and a picnic in Chapultepec.</span></p>
              <p className="rec-pull"><span className="lng-es">«Una ciudad que pasó de manto acuífero a traer su agua desde lejos —¿a qué precio?»</span><span className="lng-en">&ldquo;A city that went from aquifer to hauling its water from afar —at what price?&rdquo;</span></p>
              <div className="rec-spec">
                <div className="rs"><span className="rsk"><span className="lng-es">Duración</span><span className="lng-en">Length</span></span><span className="rsv"><span className="lng-es">5 horas · con picnic</span><span className="lng-en">5 hours · with picnic</span></span></div>
                <div className="rs"><span className="rsk"><span className="lng-es">Ritmo</span><span className="lng-en">Pace</span></span><span className="rsv meter"><span className="dots"><i className="on"></i><i></i><i></i></span><span className="ml"><span className="lng-es">Tranquilo</span><span className="lng-en">Easy</span></span></span></div>
                <div className="rs"><span className="rsk"><span className="lng-es">Lugar</span><span className="lng-en">Place</span></span><span className="rsv">Chapultepec</span></div>
                <div className="rs"><span className="rsk"><span className="lng-es">Idioma</span><span className="lng-en">Language</span></span><span className="rsv">ES / EN</span></div>
              </div>
              <div className="rec-foot">
                <div className="rec-lead"><span className="lead-avatar">SM</span><span className="lead-meta"><span className="lbl"><span className="lng-es">Anfitrión</span><span className="lng-en">Host</span></span><span className="nm">Sergio Mancilla Cuevas</span></span></div>
                <a href="#rsvp" className="rec-cta"><span className="lng-es">Solicitar →</span><span className="lng-en">Apply →</span></a>
              </div>
            </div>
          </article>

          {/* Card III – Próximamente */}
          <article className="rec-card rec-soon" data-c="clay">
            <div className="rec-media rec-media-soon">
              <span className="rec-roman">IV</span>
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
          </div>
        </div>
      </section>

      {/* ============ ESPECIALISTAS ============ */}
      <section id="especialistas" className="section-screen rule-top">
        <div className="wrap">
          <div className="masthead">
            <div className="mh-l">
              <span className="kicker"><span className="lng-es">Quién te recibe</span><span className="lng-en">Who receives you</span></span>
              <h2><span className="lng-es">Especialistas que <em>viven</em> lo que narran.</span><span className="lng-en">Specialists who <em>live</em> what they tell.</span></h2>
            </div>
            <span className="folio"><span className="lng-es">Anfitriones de línea</span><span className="lng-en">Line hosts</span></span>
          </div>
          <p className="lede" style={{ maxWidth: "62ch", marginBottom: "clamp(34px,5vh,52px)" }}><span className="lng-es">Cada experiencia la lleva quien la conoce desde adentro: su oficio es su credencial, y la ciudad que te muestran es, antes que nada, la suya.</span><span className="lng-en">Each experience is led by someone who knows it from the inside: their craft is their credential, and the city they show you is, above all, their own.</span></p>

          <div className="leads-grid">
            <article className="lead-card" data-c="moss">
              <div className="frame portrait"><img src="/assets/team-cristina.jpg" alt="Ana Cristina Rubio" /></div>
              <div className="lc-body">
                <div className="lc-collection"><span className="pill" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--moss)", display: "inline-block" }}></span> Poner la Mesa · <span className="lng-es">Colección II</span><span className="lng-en">Collection II</span></div>
                <h3 className="lc-name">Ana Cristina Rubio</h3>
                <div className="lc-role"><span className="lng-es">Gastrónoma · Investigadora</span><span className="lng-en">Gastronome · Researcher</span></div>
                <p className="lc-bio"><span className="lng-es">Investiga la mesa como territorio político: panaderías cooperativas, fermentos de barrio, pulque centenario y cocina que también es resistencia.</span><span className="lng-en">She studies the table as political territory: cooperative bakeries, neighborhood ferments, century-old pulque and kitchens that are also resistance.</span></p>
                <div className="lc-reclaims"><div className="rk"><span className="lng-es">Lo que reivindica</span><span className="lng-en">What she reclaims</span></div><div className="rv"><span className="lng-es">«Comer es un acto político y comunitario.»</span><span className="lng-en">&ldquo;Eating is a political, communal act.&rdquo;</span></div></div>
              </div>
            </article>

            <article className="lead-card" data-c="slate">
              <div className="frame portrait"><img src="/assets/team-david-alt.jpg" alt="Sergio Mancilla Cuevas" /></div>
              <div className="lc-body">
                <div className="lc-collection"><span className="pill" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--slate)", display: "inline-block" }}></span> Bajotierra · <span className="lng-es">Colección III</span><span className="lng-en">Collection III</span></div>
                <h3 className="lc-name">Sergio Mancilla Cuevas</h3>
                <div className="lc-role"><span className="lng-es">Productor · Fixer · Consultor DDHH</span><span className="lng-en">Producer · Fixer · Human-rights consultant</span></div>
                <p className="lc-bio"><span className="lng-es">Ha sido los ojos de corresponsales y documentalistas en la ciudad. Narra cómo la CDMX pasó de gran manto acuífero a megaurbe que trae su agua de lejos.</span><span className="lng-en">He has been the eyes of correspondents and documentarians in the city. He tells how Mexico City went from a great aquifer to a megacity that hauls its water from afar.</span></p>
                <div className="lc-reclaims"><div className="rk"><span className="lng-es">Lo que reivindica</span><span className="lng-en">What he reclaims</span></div><div className="rv"><span className="lng-es">«Entender el agua es entender la ciudad.»</span><span className="lng-en">&ldquo;To understand the water is to understand the city.&rdquo;</span></div></div>
              </div>
            </article>

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
          </div>
        </div>
      </section>

      {/* ============ RSVP ============ */}
      <section id="rsvp" className="section-screen rule-top">
        <div className="wrap">
          <div className="rsvp-grid">
            <div className="rsvp-left">
              <span className="kicker"><span className="lng-es">El lanzamiento público</span><span className="lng-en">The public launch</span></span>
              <h2><span className="lng-es">Tres líneas.<br />Un <em>lanzamiento</em>.</span><span className="lng-en">Three lines.<br />One <em>launch</em>.</span></h2>
              <p className="lede"><span className="lng-es">Después de seis meses de incubación y cuatro intensas semanas de laboratorio con el equipo, las tres experiencias se abren al público por primera vez. Solicita tu lugar; te diremos honestamente si es para ti.</span><span className="lng-en">After six months of incubation and four intense weeks of lab with the team, the three experiences open to the public for the first time. Request your spot; we&apos;ll honestly tell you if it&apos;s for you.</span></p>
              <div className="launch-card">
                <div className="launch-row"><span className="lk"><span className="lng-es">Fecha</span><span className="lng-en">Date</span></span><span className="lv">29 Jun – 4 Jul<small><span className="lng-es">Semana de lanzamiento · 2026</span><span className="lng-en">Launch week · 2026</span></small></span></div>
                <div className="launch-row"><span className="lk"><span className="lng-es">Lugar</span><span className="lng-en">Place</span></span><span className="lv"><span className="lng-es">Ciudad de México</span><span className="lng-en">Mexico City</span><small>San Rafael · Chapultepec</small></span></div>
                <div className="launch-row"><span className="lk"><span className="lng-es">Cupos</span><span className="lng-en">Spots</span></span><span className="lv"><span className="lng-es">Limitados</span><span className="lng-en">Limited</span><small><span className="lng-es">Grupos pequeños · precio público real</span><span className="lng-en">Small groups · real public price</span></small></span></div>
              </div>
            </div>

            <div className="form-card">
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
                    <span className="chip" data-v="Cocinando Resistencia" role="button" tabIndex={0} aria-pressed="false">Cocinando Resistencia</span>
                    <span className="chip" data-v="¡Aguas!" role="button" tabIndex={0} aria-pressed="false">¡Aguas!</span>
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
          <div className="masthead">
            <div className="mh-l">
              <span className="kicker"><span className="lng-es">Descubre más</span><span className="lng-en">Discover more</span></span>
              <h2><span className="lng-es">Todo lo demás,<br />a un <em>clic</em>.</span><span className="lng-en">Everything else,<br />one <em>click</em> away.</span></h2>
            </div>
            <span className="folio"><span className="lng-es">Manifiesto · Comunidad · Esporas · Studio · FAQ</span><span className="lng-en">Manifesto · Community · Esporas · Studio · FAQ</span></span>
          </div>

          <div className="disclosures">
            {/* Disclosure 01 – FAQ */}
            <details className="disc" open>
              <summary className="disc-head">
                <span className="disc-ix">01</span>
                <span className="disc-tt"><span className="lng-es">Preguntas honestas</span><span className="lng-en">Honest questions</span></span>
                <span className="disc-meta"><span className="lng-es">Lo que necesitas saber antes de reservar.</span><span className="lng-en">What to know before you book.</span></span>
                <span className="disc-plus" aria-hidden="true"></span>
              </summary>
              <div className="disc-body">
                <div className="disc-inner">
                  <FaqPanel />
                </div>
              </div>
            </details>

            {/* Disclosure 02 – Comunidad */}
            <details className="disc">
              <summary className="disc-head">
                <span className="disc-ix">02</span>
                <span className="disc-tt"><span className="lng-es">No viajas solo</span><span className="lng-en">You don&apos;t travel alone</span></span>
                <span className="disc-meta"><span className="lng-es">Grupos pequeños de 6 a 8. Cómo funciona.</span><span className="lng-en">Small groups of 6–8. How it works.</span></span>
                <span className="disc-plus" aria-hidden="true"></span>
              </summary>
              <div className="disc-body">
                <div className="disc-inner">
                  <div className="comm-grid">
                    <div className="comm-photo">
                      <div className="frame"><img src="/assets/comm-bag.jpg" alt="Maleta roja con ramo de flores y sombrero" /></div>
                    </div>
                    <div className="comm-copy">
                      <span className="kicker"><span className="lng-es">La compañía</span><span className="lng-en">The company</span></span>
                      <h2><span className="lng-es">No viajas solo.<br />Viajas con los <em>tuyos</em>.</span><span className="lng-en">You don&apos;t travel alone.<br />You travel with <em>your people</em>.</span></h2>
                      <p className="lede"><span className="lng-es">Recreo se vive en grupos pequeños de desconocidos que rara vez siguen siéndolo.</span><span className="lng-en">Recreo happens in small groups of strangers who rarely stay strangers.</span></p>
                      <div className="comm-stats">
                        <div><div className="cn">6–8</div><div className="ck"><span className="lng-es">Personas por grupo</span><span className="lng-en">People per group</span></div></div>
                        <div><div className="cn">1</div><div className="ck"><span className="lng-es">Anfitrión</span><span className="lng-en">Host</span></div></div>
                        <div><div className="cn"><span className="lng-es">Día 1</span><span className="lng-en">Day 1</span></div><div className="ck"><span className="lng-es">Ya no son desconocidos</span><span className="lng-en">No longer strangers</span></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </details>

            {/* Disclosure 03 – Manifiesto */}
            <details className="disc" id="manifiesto">
              <summary className="disc-head">
                <span className="disc-ix">03</span>
                <span className="disc-tt"><span className="lng-es">El manifiesto</span><span className="lng-en">The manifesto</span></span>
                <span className="disc-meta"><span className="lng-es">Por qué la ciudad se cuenta desde adentro.</span><span className="lng-en">Why the city is told from the inside.</span></span>
                <span className="disc-plus" aria-hidden="true"></span>
              </summary>
              <div className="disc-body">
                <div className="disc-inner">
                  <div className="manifesto-grid">
                    <aside className="manifesto-aside">
                      <span className="kicker">Editorial · Núm. 01</span>
                      <h3 className="big"><span className="lng-es">No se trata <em>sobre</em> nosotros.<br />La contamos <em>nosotros</em>.</span><span className="lng-en">It&apos;s not <em>about</em> us.<br />We tell it <em>ourselves</em>.</span></h3>
                    </aside>
                    <div className="manifesto-body">
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
                  </div>
                </div>
              </div>
            </details>

            {/* Disclosure 04 – Fundadores */}
            <details className="disc">
              <summary className="disc-head">
                <span className="disc-ix">04</span>
                <span className="disc-tt"><span className="lng-es">Quiénes fundaron Raíz</span><span className="lng-en">Who founded Raíz</span></span>
                <span className="disc-meta"><span className="lng-es">Fernanda Resendiz y Cesar Jeronimo Esquinca.</span><span className="lng-en">Fernanda Resendiz and Cesar Jeronimo Esquinca.</span></span>
                <span className="disc-plus" aria-hidden="true"></span>
              </summary>
              <div className="disc-body">
                <div className="disc-inner">
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
                      <p className="fc-bio"><span className="lng-es">Una década en el corazón de la aerolínea más grande de México: customer journeys, estrategia con el C-suite y planeación de red.</span><span className="lng-en">A decade at the heart of Mexico&apos;s largest airline: customer journeys, C-suite strategy and network planning.</span></p>
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
                      <p className="fc-bio"><span className="lng-es">Más de quince años en la intersección entre territorio, gastronomía y comunidad. Ha cocinado en Italia, Inglaterra y Francia.</span><span className="lng-en">Over fifteen years at the intersection of territory, gastronomy and community. He has cooked in Italy, England and France.</span></p>
                    </article>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ============ PRÓXIMAS FECHAS ============ */}
      <section className="section-screen" id="fechas">
        <ProximasFechas />
      </section>

      {/* ============ FOOTER ============ */}
      <footer>
        <div className="wrap">
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
            <span>Space Grotesk · Hanken Grotesk</span>
          </div>
        </div>
      </footer>
    </main>
  );
}


const FAQ_DATA = [
  { n: "01", q: ["¿Esto es un tour?", "Is this a tour?"], a: ["No. Un tour te lleva a ver cosas; Recreo te invita a hacer y a conversar. No hay banderita ni grupo de cuarenta. Si buscas una lista de monumentos para tachar, no somos para ti —y está bien.", "No. A tour takes you to see things; Recreo invites you to do and to talk. No little flag, no group of forty. If you want a checklist of monuments to tick off, we're not for you —and that's fine."] },
  { n: "02", q: ["¿A dónde va mi dinero?", "Where does my money go?"], a: ["A la gente que te recibe: guías, cocineros, productores y los espacios que abren sus puertas. Trabajamos sin intermediarios que se queden con la mayor parte.", "To the people who receive you: guides, cooks, producers and the places that open their doors. We work without middlemen who keep the bulk of it."] },
  { n: "03", q: ["¿Necesito hablar español?", "Do I need to speak Spanish?"], a: ["No. Operamos en español e inglés, y varias experiencias son bilingües. Dinos tu idioma al reservar y lo resolvemos.", "No. We operate in Spanish and English, and several experiences are bilingual. Tell us your language when you book and we'll sort it out."] },
  { n: "04", q: ["¿Qué tan exigente es físicamente?", "How physically demanding is it?"], a: ["Depende de la experiencia. Cada una indica su ritmo y accesibilidad con detalle —desde recorridos planos hasta jornadas activas a pie.", "It depends on the experience. Each one states its pace and accessibility in detail —from flat, unhurried walks to active days on foot."] },
  { n: "05", q: ["¿Es seguro?", "Is it safe?"], a: ["Sí, y lo tomamos en serio. Grupos pequeños, anfitriones que conocen cada zona, y rutas pensadas con criterio local. La seguridad no está peleada con lo real.", "Yes, and we take it seriously. Small groups, hosts who know each area, and routes planned with local judgment. Safety isn't at odds with the real thing."] },
  { n: "06", q: ["¿Cuándo puedo reservar?", "When can I book?"], a: ["El lanzamiento público es la semana del 29 de junio al 4 de julio de 2026. Los cupos son limitados y revisamos cada solicitud personalmente.", "The public launch is the week of June 29 – July 4, 2026. Spots are limited and we review every request personally."] },
];

function FaqPanel() {
  const [active, setActive] = useState<string | null>(null);
  const selected = FAQ_DATA.find((item) => item.n === active);

  return (
    <div className="faq-split">
      <div className="faq-questions">
        {FAQ_DATA.map((item) => (
          <button
            key={item.n}
            className={`faq-q-btn${active === item.n ? " active" : ""}`}
            onClick={() => setActive(active === item.n ? null : item.n)}
          >
            <span className="qn">{item.n}</span>
            <span className="qtxt">
              <span className="lng-es">{item.q[0]}</span>
              <span className="lng-en">{item.q[1]}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="faq-answer">
        {selected ? (
          <div className="faq-answer-content">
            <span className="faq-answer-num">{selected.n}</span>
            <p><span className="lng-es">{selected.a[0]}</span><span className="lng-en">{selected.a[1]}</span></p>
          </div>
        ) : (
          <div className="faq-answer-empty">
            <span className="lng-es">Elige una pregunta</span>
            <span className="lng-en">Choose a question</span>
          </div>
        )}
      </div>
    </div>
  );
}
