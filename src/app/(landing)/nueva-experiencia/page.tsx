"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const RECREO_MAIL = "recreobyraiz@pm.me";

type Field = {
  label: string;
  name: string;
  placeholder?: string;
  type?: "text" | "number" | "email" | "select";
  options?: string[];
  tall?: boolean;
};

type Section = {
  number: string;
  title: string;
  intro?: string;
  fields: Field[];
  tip?: string;
};

type CollectionOption = {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
};

const sections: Section[] = [
  {
    number: "01",
    title: "La idea",
    fields: [
      { label: "Tu nombre", name: "Tu nombre" },
      { label: "Correo", name: "Correo", type: "email" },
      { label: "Teléfono", name: "Teléfono" },
      { label: "Título de trabajo", name: "Título de trabajo" },
      {
        label: "Concepto",
        name: "Concepto",
        placeholder: "Los invitados descubrirán, probarán, harán o entenderán ______ a través de ______.",
        tall: true,
      },
    ],
    tip: "Sé específico: una imagen concreta se entiende mejor que una categoría general.",
  },
  {
    number: "02",
    title: "Por qué tú",
    fields: [
      {
        label: "¿Por qué eres la persona indicada para diseñarla o guiarla?",
        name: "Por qué tú",
        placeholder: "Comparte la historia personal, el oficio, el vínculo comunitario o la pasión detrás de la idea.",
        tall: true,
      },
    ],
    tip: "No necesitas ser guía formal. Tu valor está en la mirada, la confianza y el cuidado que aportas.",
  },
  {
    number: "03",
    title: "Qué se llevan los invitados",
    fields: [
      {
        label: "Al terminar, los invitados tendrán...",
        name: "Transformación",
        placeholder: "Una nueva mirada, una habilidad, un sabor, una historia, un vínculo o algo tangible.",
        tall: true,
      },
      {
        label: "Momento sello",
        name: "Momento sello",
        placeholder: "¿Cuál es el único momento que van a recordar o contar?",
      },
    ],
    tip: "Vende la transformación, no el itinerario: acceso, cercanía, curaduría y sentido.",
  },
  {
    number: "04",
    title: "Audiencia",
    fields: [
      {
        label: "¿Para quién es?",
        name: "Audiencia ideal",
        placeholder: "Intereses, estilo de viaje, idioma, edad o disposición a participar en entornos poco familiares.",
        tall: true,
      },
      {
        label: "¿Quién quizá no la disfrute?",
        name: "No ideal para",
        placeholder: "Límites de movilidad, sensoriales, alimentarios, de edad o emocionales.",
      },
    ],
  },
  {
    number: "05",
    title: "Los tres momentos",
    intro: "Toda experiencia de re·creo se cuenta en tres momentos. El detalle vendrá después.",
    fields: [
      { label: "Momento 1 · Apertura", name: "Apertura", placeholder: "¿Cómo empieza? ¿Qué rompe el hielo?" },
      { label: "Momento 2 · Núcleo", name: "Núcleo", placeholder: "¿Cuál es el corazón de la experiencia?" },
      { label: "Momento 3 · Cierre", name: "Cierre", placeholder: "¿Cómo se despiden los invitados?" },
      {
        label: "¿Por qué esta experiencia y para qué?",
        name: "Intención",
        placeholder: "Qué defiende esta experiencia y qué busca dejar en invitados y comunidad.",
        tall: true,
      },
      { label: "Duración estimada", name: "Duración estimada", placeholder: "90 min, 2 horas, 2.5 horas..." },
      { label: "Tamaño ideal de grupo", name: "Tamaño ideal de grupo", type: "number" },
      { label: "Tamaño máximo de grupo", name: "Tamaño máximo de grupo", type: "number" },
    ],
    tip: "Un solo escenario, o dos a tres locaciones cercanas, suele funcionar mejor que muchas transiciones.",
  },
  {
    number: "06",
    title: "Accesibilidad",
    intro: "Describe, a nivel general, cómo se mueven los invitados durante la experiencia.",
    fields: [
      {
        label: "Tipo de accesibilidad",
        name: "Accesibilidad",
        type: "select",
        options: ["Caminando", "Sentados", "Mixta — caminar y sentarse", "Accesible en silla de ruedas"],
      },
      {
        label: "Notas de accesibilidad y comodidad",
        name: "Notas de accesibilidad",
        placeholder: "Escaleras, terreno irregular, calor, ruido, aglomeraciones, alcohol, comida picante o contenido sensible.",
        tall: true,
      },
    ],
    tip: "La claridad ayuda a los invitados a elegir con confianza y a RAÍZ a adaptarse con responsabilidad.",
  },
  {
    number: "07",
    title: "Tu conexión con la experiencia",
    fields: [
      {
        label: "¿Cómo estás conectado o conectada con este lugar, oficio o comunidad?",
        name: "Conexión real",
        placeholder: "Cuéntanos el vínculo real: dónde creciste, con quién trabajas o qué relación sostienes.",
        tall: true,
      },
      {
        label: "Locación(es) principal(es) o colaboradores",
        name: "Locaciones o colaboradores",
        placeholder: "Puedes describir el tipo de lugar y la colonia sin compartir nombres confidenciales.",
      },
    ],
    tip: "Una relación real con el lugar o las personas es lo que separa contar la ciudad de vivirla.",
  },
  {
    number: "08",
    title: "Precio y costo",
    intro: "Referencia pública sugerida: MXN 1,500-2,500 por invitado, según acceso, inclusiones y producción.",
    fields: [
      { label: "Precio sugerido por invitado", name: "Precio sugerido", placeholder: "MXN" },
      { label: "Mínimo sugerido para grupo privado", name: "Mínimo privado", placeholder: "Usualmente 3 invitados" },
      { label: "Costo fijo por experiencia", name: "Costo fijo" },
      { label: "Costo por invitado", name: "Costo por invitado" },
      {
        label: "¿Qué está incluido?",
        name: "Incluye",
        placeholder: "Comida, bebida, materiales, boletos, transporte, regalos o acceso a especialistas.",
      },
    ],
    tip: "Cobra el producto completo: conocimiento, preparación, curaduría y anfitrionía.",
  },
  {
    number: "09",
    title: "Diferenciadores frente al mercado",
    fields: [
      { label: "¿Esta experiencia ya existe?", name: "Ya existe", placeholder: "Sí, no, o algo parecido pero no igual." },
      { label: "¿Dónde?", name: "Dónde existe", placeholder: "Ciudad, colonia, plataforma u operador" },
      { label: "¿Cómo la ofrecen?", name: "Cómo la ofrecen", placeholder: "Formato, precio, duración" },
      {
        label: "¿Qué hace distinta a la tuya?",
        name: "Diferenciador",
        placeholder: "La mirada, el acceso, la voz, el precio o la comunidad detrás.",
        tall: true,
      },
    ],
    tip: "No hace falta ser lo único; hace falta ser honesto sobre qué te distingue.",
  },
  {
    number: "10",
    title: "Colección",
    intro: "Ubica tu idea dentro de una colección de re·creo, o dinos si abre una nueva línea.",
    fields: [
      {
        label: "¿Abre una nueva línea? ¿Por qué encaja ahí?",
        name: "Nueva línea",
        placeholder: "Si no encaja en ninguna colección, cuéntanos qué línea nueva propone.",
      },
    ],
  },
  {
    number: "11",
    title: "Resumen en un párrafo",
    fields: [
      {
        label: "Completa la frase",
        name: "Resumen",
        placeholder:
          "Esta es una experiencia de ___ horas para ___. Los invitados van a ___ a través de ___. Soy la persona indicada para guiarla porque ___.",
        tall: true,
      },
    ],
  },
];

const fallbackCollections = [
  ["Crudo", "Edgy · real. La ciudad como cuerpo que no pide permiso.", "clay"],
  ["Poner la Mesa", "Craft · origen · local. Del mercado y el productor al plato.", "moss"],
  ["Bajotierra", "Ciencia · política · real. La ciudad que se hunde, centímetro a centímetro.", "slate"],
] as const;

export default function NuevaExperienciaPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [collection, setCollection] = useState("");
  const [notice, setNotice] = useState("");
  const [clearArmed, setClearArmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [collections, setCollections] = useState<CollectionOption[] | null>(null);

  useEffect(() => {
    fetch("/api/public/collections")
      .then((response) => response.json())
      .then((data) => setCollections(data.collections || []))
      .catch(() => setCollections([]));
  }, []);

  const collectionOptions = useMemo(() => {
    if (!collections?.length) {
      return fallbackCollections.map(([name, description, tone]) => ({
        name,
        description,
        tone,
      }));
    }

    return collections.map((item, index) => ({
      name: item.name,
      description: item.description || item.name_en || "Colección activa de re·creo.",
      tone: ["clay", "moss", "slate"][index % 3],
    }));
  }, [collections]);

  function collectAnswers() {
    const form = formRef.current;
    if (!form) return "";

    const data = new FormData(form);
    const lines: string[] = [];

    sections.forEach((section) => {
      const block: string[] = [];
      section.fields.forEach((field) => {
        const value = String(data.get(field.name) || "").trim();
        if (value) block.push(`  ${field.label}: ${value}`);
      });

      if (section.number === "10" && collection) block.push(`  Colección elegida: ${collection}`);

      if (block.length) {
        lines.push(`${section.number}. ${section.title}`);
        lines.push(block.join("\n"));
        lines.push("");
      }
    });

    return lines.join("\n").trim();
  }

  async function submitApplication() {
    const body = collectAnswers();
    if (!body) {
      setNotice("Completa al menos un campo antes de enviar.");
      return;
    }

    const form = formRef.current;
    const data = form ? new FormData(form) : new FormData();
    const title = String(data.get("Título de trabajo") || "").trim();
    const name = String(data.get("Tu nombre") || "").trim();
    const email = String(data.get("Correo") || "").trim();
    const phone = String(data.get("Teléfono") || "").trim();
    const payload: Record<string, string> = {};
    data.forEach((value, key) => {
      if (key === "website") return;
      const clean = String(value || "").trim();
      if (clean) payload[key] = clean;
    });
    if (collection) payload["Colección elegida"] = collection;

    if (!name || !email) {
      setNotice("Nombre y correo son obligatorios para guardar la propuesta.");
      return;
    }

    setSubmitting(true);
    setNotice("");
    try {
      const response = await fetch("/api/public/host-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, title, payload }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No pudimos guardar la propuesta.");
      setNotice("Propuesta recibida. Gracias: ya quedó registrada para el equipo de Raíz.");
      formRef.current?.reset();
      setCollection("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No pudimos guardar la propuesta.");
    } finally {
      setSubmitting(false);
    }
  }

  function sendByEmail() {
    const body = collectAnswers();
    if (!body) {
      setNotice("Completa al menos un campo antes de enviar.");
      return;
    }

    const form = formRef.current;
    const title = form ? String(new FormData(form).get("Título de trabajo") || "").trim() : "";
    const subject = `Nueva idea de experiencia${title ? ` — ${title}` : ""}`;
    const href = `mailto:${RECREO_MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `Nueva propuesta de experiencia para re·creo\n\n${body}`
    )}`;

    window.location.href = href;
  }

  function clearForm() {
    if (!clearArmed) {
      setClearArmed(true);
      setNotice("Presiona de nuevo para borrar todos los campos.");
      window.setTimeout(() => setClearArmed(false), 3500);
      return;
    }

    formRef.current?.reset();
    setCollection("");
    setClearArmed(false);
    setNotice("Formulario limpio.");
  }

  return (
    <main className="public-flow idea-flow">
      <div className="idea-page">
        <header className="idea-brandbar">
          <a href="/" className="idea-mark">
            Ra<span>í</span>z
          </a>
          <span>re·creo · experiencias</span>
        </header>

        <section className="idea-hero">
          <p className="kicker">re·creo · nueva experiencia</p>
          <h1>
            Cuenta lo que <em>sabes</em>.
          </h1>
          <p className="lede">
            Este formulario nos ayuda a entender la experiencia que quieres crear, por qué te pertenece y qué se llevan los invitados.
          </p>
          <p className="idea-note">
            Tu primera idea puede estar inacabada. Buscamos un punto de vista humano y real, no un plan de negocio perfecto.
          </p>
        </section>

        <section className="idea-mission">
          <h2>Por qué existe RAÍZ</h2>
          <p>
            RAÍZ acerca a los invitados a un lugar a través de quienes lo cuidan, lo crean desde dentro y lo entienden de verdad. re·creo es nuestra línea de experiencias: pequeñas, cuidadas, contadas en primera persona.
          </p>
        </section>

        <form ref={formRef} className="idea-form">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px" }}
          />
          {sections.map((section) => (
            <section key={section.number} className="idea-section">
              <div className="form-section__head">
                <span>{section.number}</span>
                <h2>{section.title}</h2>
              </div>
              {section.intro && <p className="idea-intro">{section.intro}</p>}

              {section.number === "10" && (
                <div className="collection-grid" role="radiogroup" aria-label="Colección">
                  {collectionOptions.map(({ name, description, tone }) => (
                    <button
                      key={name}
                      type="button"
                      className={`collection-chip collection-chip--${tone}${collection === name ? " collection-chip--selected" : ""}`}
                      onClick={() => setCollection((current) => (current === name ? "" : name))}
                      aria-pressed={collection === name}
                    >
                      <strong>{name}</strong>
                      <span>{description}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="idea-fields">
                {section.fields.map((field) => (
                  <label key={field.name} className={`public-field${field.tall ? " public-field--wide" : ""}`}>
                    <span>{field.label}</span>
                    {field.type === "select" ? (
                      <select className="public-input" name={field.name} defaultValue="">
                        <option value="" disabled>
                          Selecciona una opción
                        </option>
                        {field.options?.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    ) : field.tall ? (
                      <textarea className="public-input" name={field.name} placeholder={field.placeholder} rows={5} />
                    ) : (
                      <input
                        className="public-input"
                        name={field.name}
                        type={field.type || "text"}
                        min={field.type === "number" ? 1 : undefined}
                        placeholder={field.placeholder}
                      />
                    )}
                  </label>
                ))}
              </div>

              {section.tip && <p className="idea-tip">{section.tip}</p>}
            </section>
          ))}

          <section className="idea-section">
            <div className="form-section__head">
              <span>·</span>
              <h2>Cómo lo contamos</h2>
            </div>
            <div className="voice-grid">
              <div>
                <span>Decimos</span>
                <p>La contamos nosotros.</p>
              </div>
              <div>
                <span>No decimos</span>
                <p>La experiencia más auténtica.</p>
              </div>
              <div>
                <span>Decimos</span>
                <p>Una relación, no una foto.</p>
              </div>
              <div>
                <span>No decimos</span>
                <p>El mejor tour de la ciudad.</p>
              </div>
            </div>
          </section>

          <div className="idea-actions">
            <button className="btn btn-ghost" type="button" onClick={clearForm}>
              {clearArmed ? "Confirmar borrado" : "Borrar campos"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => window.print()}>
              Guardar como PDF
            </button>
            <button className="btn btn-ghost" type="button" onClick={sendByEmail}>
              Abrir correo
            </button>
            <button className="btn btn-solid" type="button" onClick={submitApplication} disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar a re·creo"}
            </button>
          </div>

          <p className="send-note">
            Al enviar, la propuesta queda registrada en el CRM de Raíz. También puedes abrir un correo de respaldo a <strong>{RECREO_MAIL}</strong>.
          </p>
          {notice && <p className="send-note send-note--notice">{notice}</p>}
        </form>

        <footer className="idea-footer">
          RAÍZ · re·creo — <strong>Crear de nuevo</strong>. Tu pasión es el punto de partida; el diseño cuidadoso la vuelve algo que otros pueden vivir.
        </footer>
      </div>
    </main>
  );
}
