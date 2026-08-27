const BLOCKED_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "svg",
  "math",
];

const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "div",
  "em",
  "i",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "u",
  "ul",
]);

const ALLOWED_ATTRS = new Set(["href", "target", "rel", "style"]);
const ALLOWED_STYLES = new Set(["text-align"]);

export function normalizeCmsHtml(input: string | null | undefined): string {
  if (!input) return "";

  let html = String(input)
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .trim();

  for (const tag of BLOCKED_TAGS) {
    html = html.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), "");
    html = html.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi"), "");
  }

  html = html.replace(/<([a-z0-9-]+)([^>]*)>/gi, (match, tagName, attrs) => {
    const tag = String(tagName).toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    const safeAttrs = sanitizeAttrs(String(attrs || ""));
    return `<${tag}${safeAttrs}>`;
  });

  html = html.replace(/<\/([a-z0-9-]+)>/gi, (_match, tagName) => {
    const tag = String(tagName).toLowerCase();
    return ALLOWED_TAGS.has(tag) ? `</${tag}>` : "";
  });

  return html;
}

export function plainTextToCmsHtml(input: string | null | undefined): string {
  return escapeHtml(input || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, "<br>"))
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");
}

export function stripCmsHtml(input: string | null | undefined): string {
  return normalizeCmsHtml(input).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function sanitizeAttrs(attrs: string): string {
  const cleaned: string[] = [];
  attrs.replace(/([a-z0-9:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gi, (_match, name, _raw, doubleValue, singleValue, bareValue) => {
    const attr = String(name).toLowerCase();
    const value = String(doubleValue ?? singleValue ?? bareValue ?? "");
    if (attr.startsWith("on") || !ALLOWED_ATTRS.has(attr)) return "";
    if ((attr === "href" || attr === "src") && isUnsafeUrl(value)) return "";
    if (attr === "style") {
      const style = sanitizeStyle(value);
      if (style) cleaned.push(` style="${escapeAttr(style)}"`);
      return "";
    }
    if (attr === "target") {
      cleaned.push(` target="${escapeAttr(value || "_blank")}"`);
      cleaned.push(` rel="noopener noreferrer"`);
      return "";
    }
    if (attr === "rel") return "";
    cleaned.push(` ${attr}="${escapeAttr(value)}"`);
    return "";
  });
  return cleaned.join("");
}

function sanitizeStyle(style: string): string {
  return style
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const [property, ...valueParts] = rule.split(":");
      const propertyName = property?.trim().toLowerCase();
      const value = valueParts.join(":").trim().toLowerCase();
      if (!ALLOWED_STYLES.has(propertyName)) return "";
      if (!["left", "center", "right", "justify"].includes(value)) return "";
      return `${propertyName}: ${value}`;
    })
    .filter(Boolean)
    .join("; ");
}

function isUnsafeUrl(value: string): boolean {
  const normalized = value.replace(/\s+/g, "").toLowerCase();
  return (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("data:")
  );
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(input: string): string {
  return escapeHtml(input).replace(/`/g, "&#96;");
}
