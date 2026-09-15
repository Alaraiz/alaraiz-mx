export type EmailTemplateKey = "reservation_confirmation" | "exit_survey" | "reservation_rescheduled";

export type EmailTemplateDefault = {
  key: EmailTemplateKey;
  label: string;
  subject: string;
  title: string;
  body: string;
  cta_label: string;
  footer: string;
};

export const EMAIL_TEMPLATE_VARIABLES = [
  ["{{nombre}}", "Nombre del cliente"],
  ["{{experiencia}}", "Nombre de la experiencia"],
  ["{{fecha}}", "Fecha de la salida"],
  ["{{hora}}", "Hora de inicio"],
  ["{{fecha_anterior}}", "Fecha anterior (cambio de fecha)"],
  ["{{hora_anterior}}", "Hora anterior (cambio de fecha)"],
  ["{{personas}}", "Número de asistentes"],
  ["{{total}}", "Total pagado"],
  ["{{descuento}}", "Monto descontado"],
  ["{{codigo_descuento}}", "Código aplicado"],
  ["{{duracion}}", "Duración"],
  ["{{punto_encuentro}}", "Punto de encuentro"],
  ["{{que_esperar}}", "Indicaciones para la salida"],
  ["{{link_confirmacion}}", "Liga de confirmación"],
  ["{{link_cuestionario}}", "Liga de encuesta de salida"],
] as const;

export const DEFAULT_EMAIL_TEMPLATES: Record<EmailTemplateKey, EmailTemplateDefault> = {
  reservation_confirmation: {
    key: "reservation_confirmation",
    label: "Confirmación de reserva",
    subject: "Tu llave a la ciudad oculta · {{experiencia}}",
    title: "Tu llave a la ciudad oculta",
    body: `¡Hola, {{nombre}}!

Ya está: tu lugar está confirmado para {{experiencia}}.

Aquí lo importante:
Punto de encuentro: {{punto_encuentro}}
Cuándo: {{fecha}}
Hora: {{hora}}
Duración: {{duracion}}
Personas: {{personas}}
Total: {{total}}

Qué esperar:
{{que_esperar}}

Te recomendamos traer zapatos cómodos, gorra y/o bloqueador solar, botella de agua reutilizable y paraguas o chamarra si el clima lo pide.

Puedes revisar tu confirmación aquí:
{{link_confirmacion}}

Ya nos queremos ver,
El equipo de re·creo`,
    cta_label: "Ver confirmación",
    footer: "Raíz · La ciudad debajo de la ciudad\nCiudad de México · Este correo se generó automáticamente para tu reserva.",
  },
  reservation_rescheduled: {
    key: "reservation_rescheduled",
    label: "Cambio de fecha",
    subject: "Nueva fecha para {{experiencia}}",
    title: "Tu experiencia tiene una nueva fecha",
    body: `Hola, {{nombre}}.

Reagendamos tu reserva para {{experiencia}}.

Fecha anterior: {{fecha_anterior}} a las {{hora_anterior}}
Nueva fecha: {{fecha}} a las {{hora}}
Horarios de Ciudad de México.

Personas: {{personas}}
Punto de encuentro: {{punto_encuentro}}
Qué esperar: {{que_esperar}}

Este cambio no genera un nuevo cobro ni modifica el estado de tu pago. Puedes consultar los datos de tu reserva aquí:
{{link_confirmacion}}

Si ya guardaste la salida en tu calendario, actualiza la fecha. Si necesitas ayuda con este cambio, contacta al equipo de Raíz.

Nos vemos pronto,
El equipo de re·creo`,
    cta_label: "Consultar mi reserva",
    footer: "Raíz · La ciudad debajo de la ciudad\nCiudad de México · Aviso de cambio de fecha.",
  },
  exit_survey: {
    key: "exit_survey",
    label: "Encuesta de salida",
    subject: "Cuéntanos cómo fue {{experiencia}}",
    title: "¿Cómo estuvo tu experiencia?",
    body: `Hola, {{nombre}}.

Gracias por vivir {{experiencia}} con Raíz.

Nos ayuda muchísimo que nos cuentes cómo se sintió la salida, qué funcionó bien y qué podríamos cuidar mejor para las siguientes experiencias.

Tu cuestionario personalizado está aquí:
{{link_cuestionario}}`,
    cta_label: "Responder cuestionario",
    footer: "Raíz · La ciudad debajo de la ciudad\nGracias por ayudarnos a cuidar mejor cada salida.",
  },
};
