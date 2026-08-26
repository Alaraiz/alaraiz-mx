import { normalizeCmsHtml } from "./html";

export default function RichTextContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const inlineHtml = normalizeCmsHtml(html)
    .replace(/<\/p>\s*<p[^>]*>/gi, "<br>")
    .replace(/<\/div>\s*<div[^>]*>/gi, "<br>")
    .replace(/<\/?(p|div)[^>]*>/gi, "");

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: inlineHtml }}
    />
  );
}
