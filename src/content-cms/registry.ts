export type ContentBlockType = "text" | "textarea" | "richtext";

export type ContentBlockDefinition = {
  pageKey: string;
  sectionKey: string;
  fieldKey: string;
  locale: "es" | "en";
  label: string;
  type: ContentBlockType;
  defaultValue: string;
  sortOrder: number;
};

export type ContentBlockRow = ContentBlockDefinition & {
  id: string;
  value: string | null;
  updatedAt?: string;
};

export type ContentMap = Record<string, string>;

export const LANDING_CONTENT_BLOCKS: ContentBlockDefinition[] = [
  {
    pageKey: "landing",
    sectionKey: "hero",
    fieldKey: "eyebrow",
    locale: "es",
    label: "Hero / ceja",
    type: "text",
    defaultValue: "Ciudad de México · Experiencias de un día",
    sortOrder: 10,
  },
  {
    pageKey: "landing",
    sectionKey: "hero",
    fieldKey: "eyebrow",
    locale: "en",
    label: "Hero / eyebrow",
    type: "text",
    defaultValue: "Mexico City · One-day experiences",
    sortOrder: 11,
  },
  {
    pageKey: "landing",
    sectionKey: "hero",
    fieldKey: "title",
    locale: "es",
    label: "Hero / título",
    type: "richtext",
    defaultValue: "La ciudad<br><em>debajo</em> de la ciudad.",
    sortOrder: 20,
  },
  {
    pageKey: "landing",
    sectionKey: "hero",
    fieldKey: "title",
    locale: "en",
    label: "Hero / title",
    type: "richtext",
    defaultValue: "The city<br><em>beneath</em> the city.",
    sortOrder: 21,
  },
  {
    pageKey: "landing",
    sectionKey: "hero",
    fieldKey: "lede",
    locale: "es",
    label: "Hero / bajada",
    type: "textarea",
    defaultValue:
      "Existe una versión de la Ciudad de México que no aparece en ninguna plataforma. Raíz te lleva ahí -con quienes la habitan, no quienes la venden.",
    sortOrder: 30,
  },
  {
    pageKey: "landing",
    sectionKey: "hero",
    fieldKey: "lede",
    locale: "en",
    label: "Hero / lede",
    type: "textarea",
    defaultValue:
      "There's a version of Mexico City that lives on no platform. Raíz takes you there -with the people who inhabit it, not the ones who sell it.",
    sortOrder: 31,
  },
  {
    pageKey: "landing",
    sectionKey: "hero",
    fieldKey: "primaryCta",
    locale: "es",
    label: "Hero / CTA principal",
    type: "text",
    defaultValue: "Ver las experiencias",
    sortOrder: 40,
  },
  {
    pageKey: "landing",
    sectionKey: "hero",
    fieldKey: "primaryCta",
    locale: "en",
    label: "Hero / primary CTA",
    type: "text",
    defaultValue: "See the experiences",
    sortOrder: 41,
  },
  {
    pageKey: "landing",
    sectionKey: "hero",
    fieldKey: "secondaryCta",
    locale: "es",
    label: "Hero / CTA secundario",
    type: "text",
    defaultValue: "Lee el manifiesto",
    sortOrder: 50,
  },
  {
    pageKey: "landing",
    sectionKey: "hero",
    fieldKey: "secondaryCta",
    locale: "en",
    label: "Hero / secondary CTA",
    type: "text",
    defaultValue: "Read the manifesto",
    sortOrder: 51,
  },
  {
    pageKey: "landing",
    sectionKey: "recreo",
    fieldKey: "kicker",
    locale: "es",
    label: "Recreo / ceja",
    type: "text",
    defaultValue: "Recreo · Experiencias de un día",
    sortOrder: 100,
  },
  {
    pageKey: "landing",
    sectionKey: "recreo",
    fieldKey: "kicker",
    locale: "en",
    label: "Recreo / eyebrow",
    type: "text",
    defaultValue: "Recreo · One-day experiences",
    sortOrder: 101,
  },
  {
    pageKey: "landing",
    sectionKey: "recreo",
    fieldKey: "title",
    locale: "es",
    label: "Recreo / título",
    type: "richtext",
    defaultValue: "Tres <em>experiencias</em>,<br>cada una un mundo.",
    sortOrder: 110,
  },
  {
    pageKey: "landing",
    sectionKey: "recreo",
    fieldKey: "title",
    locale: "en",
    label: "Recreo / title",
    type: "richtext",
    defaultValue: "Three <em>experiences</em>,<br>each its own world.",
    sortOrder: 111,
  },
  {
    pageKey: "landing",
    sectionKey: "recreo",
    fieldKey: "lede",
    locale: "es",
    label: "Recreo / bajada",
    type: "textarea",
    defaultValue:
      "Cada línea es un laboratorio con su propio anfitrión y su propio arco -contexto, proceso, catarsis. Desliza para recorrerlas.",
    sortOrder: 120,
  },
  {
    pageKey: "landing",
    sectionKey: "recreo",
    fieldKey: "lede",
    locale: "en",
    label: "Recreo / lede",
    type: "textarea",
    defaultValue:
      "Each line is a lab with its own host and its own arc - context, process, catharsis. Swipe to explore them.",
    sortOrder: 121,
  },
  {
    pageKey: "landing",
    sectionKey: "specialists",
    fieldKey: "kicker",
    locale: "es",
    label: "Especialistas / ceja",
    type: "text",
    defaultValue: "Quién te recibe",
    sortOrder: 200,
  },
  {
    pageKey: "landing",
    sectionKey: "specialists",
    fieldKey: "kicker",
    locale: "en",
    label: "Specialists / eyebrow",
    type: "text",
    defaultValue: "Who receives you",
    sortOrder: 201,
  },
  {
    pageKey: "landing",
    sectionKey: "specialists",
    fieldKey: "title",
    locale: "es",
    label: "Especialistas / título",
    type: "richtext",
    defaultValue: "Especialistas que <em>viven</em><br>lo que narran.",
    sortOrder: 210,
  },
  {
    pageKey: "landing",
    sectionKey: "specialists",
    fieldKey: "title",
    locale: "en",
    label: "Specialists / title",
    type: "richtext",
    defaultValue: "Specialists who <em>live</em><br>what they tell.",
    sortOrder: 211,
  },
  {
    pageKey: "landing",
    sectionKey: "specialists",
    fieldKey: "lede",
    locale: "es",
    label: "Especialistas / bajada",
    type: "textarea",
    defaultValue:
      "Cada experiencia la lleva quien la conoce desde adentro: su oficio es su credencial, y la ciudad que te muestran es, antes que nada, la suya.",
    sortOrder: 220,
  },
  {
    pageKey: "landing",
    sectionKey: "specialists",
    fieldKey: "lede",
    locale: "en",
    label: "Specialists / lede",
    type: "textarea",
    defaultValue:
      "Each experience is led by someone who knows it from the inside: their craft is their credential, and the city they show you is, above all, their own.",
    sortOrder: 221,
  },
  {
    pageKey: "landing",
    sectionKey: "rsvp",
    fieldKey: "kicker",
    locale: "es",
    label: "Lanzamiento / ceja",
    type: "text",
    defaultValue: "El lanzamiento público",
    sortOrder: 300,
  },
  {
    pageKey: "landing",
    sectionKey: "rsvp",
    fieldKey: "kicker",
    locale: "en",
    label: "Launch / eyebrow",
    type: "text",
    defaultValue: "The public launch",
    sortOrder: 301,
  },
  {
    pageKey: "landing",
    sectionKey: "rsvp",
    fieldKey: "title",
    locale: "es",
    label: "Lanzamiento / título",
    type: "richtext",
    defaultValue: "Tres líneas.<br>Un <em>lanzamiento</em>.",
    sortOrder: 310,
  },
  {
    pageKey: "landing",
    sectionKey: "rsvp",
    fieldKey: "title",
    locale: "en",
    label: "Launch / title",
    type: "richtext",
    defaultValue: "Three lines.<br>One <em>launch</em>.",
    sortOrder: 311,
  },
  {
    pageKey: "landing",
    sectionKey: "rsvp",
    fieldKey: "lede",
    locale: "es",
    label: "Lanzamiento / bajada",
    type: "textarea",
    defaultValue:
      "Después de seis meses de incubación y cuatro intensas semanas de laboratorio con el equipo, las tres experiencias se abren al público por primera vez. Solicita tu lugar; te diremos honestamente si es para ti.",
    sortOrder: 320,
  },
  {
    pageKey: "landing",
    sectionKey: "rsvp",
    fieldKey: "lede",
    locale: "en",
    label: "Launch / lede",
    type: "textarea",
    defaultValue:
      "After six months of incubation and four intense weeks of lab with the team, the three experiences open to the public for the first time. Request your spot; we'll honestly tell you if it's for you.",
    sortOrder: 321,
  },
  {
    pageKey: "landing",
    sectionKey: "rsvp",
    fieldKey: "date",
    locale: "es",
    label: "Lanzamiento / fecha",
    type: "text",
    defaultValue: "29 Jun - 4 Jul",
    sortOrder: 330,
  },
  {
    pageKey: "landing",
    sectionKey: "rsvp",
    fieldKey: "date",
    locale: "en",
    label: "Launch / date",
    type: "text",
    defaultValue: "Jun 29 - Jul 4",
    sortOrder: 331,
  },
  {
    pageKey: "landing",
    sectionKey: "rsvp",
    fieldKey: "place",
    locale: "es",
    label: "Lanzamiento / lugar",
    type: "text",
    defaultValue: "Ciudad de México",
    sortOrder: 340,
  },
  {
    pageKey: "landing",
    sectionKey: "rsvp",
    fieldKey: "place",
    locale: "en",
    label: "Launch / place",
    type: "text",
    defaultValue: "Mexico City",
    sortOrder: 341,
  },
  {
    pageKey: "landing",
    sectionKey: "discover",
    fieldKey: "title",
    locale: "es",
    label: "Descubre / título",
    type: "richtext",
    defaultValue: "Todo lo demás,<br>a un <em>clic</em>.",
    sortOrder: 400,
  },
  {
    pageKey: "landing",
    sectionKey: "discover",
    fieldKey: "title",
    locale: "en",
    label: "Discover / title",
    type: "richtext",
    defaultValue: "Everything else,<br>one <em>click</em> away.",
    sortOrder: 401,
  },
  {
    pageKey: "landing",
    sectionKey: "footer",
    fieldKey: "manifesto",
    locale: "es",
    label: "Footer / manifiesto",
    type: "richtext",
    defaultValue: "Esto no es un tour.<br>Es una <em>introducción</em>.",
    sortOrder: 500,
  },
  {
    pageKey: "landing",
    sectionKey: "footer",
    fieldKey: "manifesto",
    locale: "en",
    label: "Footer / manifesto",
    type: "richtext",
    defaultValue: "This isn't a tour.<br>It's an <em>introduction</em>.",
    sortOrder: 501,
  },
];

const DISCOVER_NAV_DEFAULTS = [
  ["faq", "Preguntas honestas", "Honest questions", "Lo que necesitas saber antes de reservar.", "What to know before you book."],
  ["comunidad", "No viajas solo", "You don't travel alone", "Grupos pequeños de 6 a 8. Cómo funciona.", "Small groups of 6-8. How it works."],
  ["manifiesto", "El manifiesto", "The manifesto", "Por qué la ciudad se cuenta desde adentro.", "Why the city is told from the inside."],
  ["servicios", "Una raíz, tres expresiones", "One root, three expressions", "Recreo, Esporas y Raíz Studio.", "Recreo, Esporas and Raíz Studio."],
  ["esporas", "Esporas & Détente", "Esporas & Détente", "El brazo editorial y la revista - Nº 01 y Nº 02.", "The editorial arm and the magazine - issues No. 01 & 02."],
  ["fundadores", "Quiénes fundaron Raíz", "Who founded Raíz", "Fernanda Resendiz y Cesar Jeronimo Esquinca.", "Fernanda Resendiz and Cesar Jeronimo Esquinca."],
  ["studio", "Raíz Studio · Asesoría", "Raíz Studio · Advisory", "Formación y consultoría para operadores.", "Training and consulting for operators."],
] as const;

const FAQ_DEFAULTS = [
  ["01", "¿Esto es un tour?", "Is this a tour?", "No. Un tour te lleva a ver cosas; Recreo te invita a hacer y a conversar. No hay banderita ni grupo de cuarenta. Si buscas una lista de monumentos para tachar, no somos para ti -y está bien.", "No. A tour takes you to see things; Recreo invites you to do and to talk. No little flag, no group of forty. If you want a checklist of monuments to tick off, we're not for you -and that's fine."],
  ["02", "¿A dónde va mi dinero?", "Where does my money go?", "A la gente que te recibe: guías, cocineros, productores y los espacios que abren sus puertas. Trabajamos sin intermediarios que se queden con la mayor parte.", "To the people who receive you: guides, cooks, producers and the places that open their doors. We work without middlemen who keep the bulk of it."],
  ["03", "¿Necesito hablar español?", "Do I need to speak Spanish?", "No. Operamos en español e inglés, y varias experiencias son bilingües. Dinos tu idioma al reservar y lo resolvemos.", "No. We operate in Spanish and English, and several experiences are bilingual. Tell us your language when you book and we'll sort it out."],
  ["04", "¿Qué tan exigente es físicamente?", "How physically demanding is it?", "Depende de la experiencia. Cada una indica su ritmo y accesibilidad con detalle -desde recorridos planos y pausados hasta jornadas activas a pie. Si tienes dudas sobre movilidad, escríbenos antes y te decimos la verdad.", "It depends on the experience. Each one states its pace and accessibility in detail -from flat, unhurried walks to active days on foot. If you have any doubt about mobility, write to us first and we'll tell you the truth."],
  ["05", "¿Puedo ir si tengo movilidad reducida?", "Can I come with reduced mobility?", "Algunas sí, otras no, y preferimos ser honestos en cada caso. Cuéntanos tus necesidades y te orientamos sin rodeos.", "Some yes, some no, and we'd rather be honest case by case. Tell us your needs and we'll guide you straight."],
  ["06", "¿Es seguro?", "Is it safe?", "Sí, y lo tomamos en serio. Grupos pequeños, anfitriones que conocen cada zona, y rutas pensadas con criterio local. La seguridad no está peleada con lo real.", "Yes, and we take it seriously. Small groups, hosts who know each area, and routes planned with local judgment. Safety isn't at odds with the real thing."],
  ["07", "¿Cuándo puedo reservar?", "When can I book?", "El lanzamiento público es la semana del 29 de junio al 4 de julio de 2026. Los cupos son limitados y revisamos cada solicitud personalmente.", "The public launch is the week of June 29 - July 4, 2026. Spots are limited and we review every request personally."],
] as const;

DISCOVER_NAV_DEFAULTS.forEach(([id, labelEs, labelEn, metaEs, metaEn], index) => {
  LANDING_CONTENT_BLOCKS.push(
    {
      pageKey: "landing",
      sectionKey: "discover_nav",
      fieldKey: `${id}_label`,
      locale: "es",
      label: `Descubre / ${id} / etiqueta`,
      type: "text",
      defaultValue: labelEs,
      sortOrder: 600 + index * 10,
    },
    {
      pageKey: "landing",
      sectionKey: "discover_nav",
      fieldKey: `${id}_label`,
      locale: "en",
      label: `Discover / ${id} / label`,
      type: "text",
      defaultValue: labelEn,
      sortOrder: 601 + index * 10,
    },
    {
      pageKey: "landing",
      sectionKey: "discover_nav",
      fieldKey: `${id}_meta`,
      locale: "es",
      label: `Descubre / ${id} / descripción`,
      type: "textarea",
      defaultValue: metaEs,
      sortOrder: 602 + index * 10,
    },
    {
      pageKey: "landing",
      sectionKey: "discover_nav",
      fieldKey: `${id}_meta`,
      locale: "en",
      label: `Discover / ${id} / description`,
      type: "textarea",
      defaultValue: metaEn,
      sortOrder: 603 + index * 10,
    }
  );
});

FAQ_DEFAULTS.forEach(([number, qEs, qEn, aEs, aEn], index) => {
  LANDING_CONTENT_BLOCKS.push(
    {
      pageKey: "landing",
      sectionKey: "faq",
      fieldKey: `q${number}`,
      locale: "es",
      label: `FAQ ${number} / pregunta`,
      type: "text",
      defaultValue: qEs,
      sortOrder: 800 + index * 10,
    },
    {
      pageKey: "landing",
      sectionKey: "faq",
      fieldKey: `q${number}`,
      locale: "en",
      label: `FAQ ${number} / question`,
      type: "text",
      defaultValue: qEn,
      sortOrder: 801 + index * 10,
    },
    {
      pageKey: "landing",
      sectionKey: "faq",
      fieldKey: `a${number}`,
      locale: "es",
      label: `FAQ ${number} / respuesta`,
      type: "textarea",
      defaultValue: aEs,
      sortOrder: 802 + index * 10,
    },
    {
      pageKey: "landing",
      sectionKey: "faq",
      fieldKey: `a${number}`,
      locale: "en",
      label: `FAQ ${number} / answer`,
      type: "textarea",
      defaultValue: aEn,
      sortOrder: 803 + index * 10,
    }
  );
});

export function blocksForPage(pageKey: string) {
  if (pageKey === "landing") return LANDING_CONTENT_BLOCKS;
  return [];
}

export function contentKey(
  pageKey: string,
  sectionKey: string,
  fieldKey: string,
  locale: string
) {
  return `${pageKey}.${sectionKey}.${fieldKey}.${locale}`;
}

export function contentRowsToMap(rows: Array<{
  page_key?: unknown;
  pageKey?: unknown;
  section_key?: unknown;
  sectionKey?: unknown;
  field_key?: unknown;
  fieldKey?: unknown;
  locale?: unknown;
  value?: unknown;
  default_value?: unknown;
  defaultValue?: unknown;
}>): ContentMap {
  return rows.reduce<ContentMap>((acc, row) => {
    const pageKey = String(row.page_key ?? row.pageKey ?? "");
    const sectionKey = String(row.section_key ?? row.sectionKey ?? "");
    const fieldKey = String(row.field_key ?? row.fieldKey ?? "");
    const locale = String(row.locale ?? "es");
    if (!pageKey || !sectionKey || !fieldKey) return acc;
    const value = row.value ?? row.default_value ?? row.defaultValue ?? "";
    acc[contentKey(pageKey, sectionKey, fieldKey, locale)] = String(value);
    return acc;
  }, {});
}
