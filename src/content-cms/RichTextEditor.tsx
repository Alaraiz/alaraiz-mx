"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeCmsHtml } from "./html";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  labelledBy?: string;
};

type Command = {
  label: string;
  title: string;
  run: () => void;
};

function htmlToEditorText(value: string) {
  return normalizeCmsHtml(value).replace(/<br\s*\/?>/gi, "\n");
}

function editorTextToHtml(value: string) {
  return normalizeCmsHtml(value.replace(/\n/g, "<br>"));
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

export default function RichTextEditor({
  value,
  onChange,
  labelledBy,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(() => htmlToEditorText(value));

  useEffect(() => {
    if (document.activeElement === textareaRef.current) return;
    setDraft(htmlToEditorText(value));
  }, [value]);

  function emit(nextDraft: string) {
    setDraft(nextDraft);
    onChange(editorTextToHtml(nextDraft));
  }

  function replaceSelection(nextText: string, selectionStart: number, selectionEnd: number) {
    const before = draft.slice(0, selectionStart);
    const after = draft.slice(selectionEnd);
    emit(`${before}${nextText}${after}`);

    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(
        selectionStart,
        selectionStart + nextText.length
      );
    });
  }

  function wrapSelection(before: string, after: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selected = draft.slice(selectionStart, selectionEnd) || "texto";
    replaceSelection(
      `${before}${selected}${after}`,
      selectionStart,
      selectionEnd
    );
  }

  function alignSelection(value: "left" | "center" | "right") {
    wrapSelection(`<div style="text-align: ${value}">`, "</div>");
  }

  function addLink() {
    const href = window.prompt("URL del enlace");
    if (!href) return;
    wrapSelection(`<a href="${href}" target="_blank">`, "</a>");
  }

  function clearFormat() {
    emit(stripTags(draft));
  }

  const commands: Command[] = [
    { label: "B", title: "Negritas", run: () => wrapSelection("<strong>", "</strong>") },
    { label: "I", title: "Itálicas", run: () => wrapSelection("<em>", "</em>") },
    { label: "U", title: "Subrayado", run: () => wrapSelection("<u>", "</u>") },
    { label: "•", title: "Lista", run: () => wrapSelection("<ul><li>", "</li></ul>") },
    { label: "1.", title: "Lista numerada", run: () => wrapSelection("<ol><li>", "</li></ol>") },
    { label: "←", title: "Alinear izquierda", run: () => alignSelection("left") },
    { label: "↔", title: "Centrar", run: () => alignSelection("center") },
    { label: "⇥", title: "Alinear derecha", run: () => alignSelection("right") },
    { label: "🔗", title: "Enlace", run: addLink },
    { label: "Tx", title: "Limpiar formato", run: clearFormat },
  ];

  return (
    <div className="cms-rich-editor">
      <div className="cms-rich-toolbar" aria-label="Formato de texto">
        {commands.map((command) => (
          <button
            key={command.title}
            type="button"
            title={command.title}
            aria-label={command.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={command.run}
          >
            {command.label}
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="cms-rich-surface"
        aria-labelledby={labelledBy}
        value={draft}
        onChange={(event) => emit(event.target.value)}
        onBlur={() => emit(htmlToEditorText(editorTextToHtml(draft)))}
      />
    </div>
  );
}
