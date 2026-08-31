"use client";

import { useEffect, useRef } from "react";
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

export default function RichTextEditor({
  value,
  onChange,
  labelledBy,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialValueRef = useRef(normalizeCmsHtml(value));

  useEffect(() => {
    const normalized = normalizeCmsHtml(value);
    const editor = editorRef.current;
    if (!editor) {
      initialValueRef.current = normalized;
      return;
    }

    if (document.activeElement === editor) {
      return;
    }

    initialValueRef.current = normalized;
    if (editor.innerHTML !== normalized) {
      editor.innerHTML = normalized;
    }
  }, [value]);

  function sync(options: { normalize?: boolean } = {}) {
    const editor = editorRef.current;
    if (!editor) return;

    const next = options.normalize ? normalizeCmsHtml(editor.innerHTML) : editor.innerHTML;
    if (options.normalize && editor.innerHTML !== next) {
      editor.innerHTML = next;
    }

    onChange(next);
  }

  function exec(command: string, argument?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    sync();
  }

  function addLink() {
    const href = window.prompt("URL del enlace");
    if (!href) return;
    exec("createLink", href);
  }

  function clearFormat() {
    exec("removeFormat");
  }

  const commands: Command[] = [
    { label: "B", title: "Negritas", run: () => exec("bold") },
    { label: "I", title: "Itálicas", run: () => exec("italic") },
    { label: "U", title: "Subrayado", run: () => exec("underline") },
    { label: "•", title: "Lista", run: () => exec("insertUnorderedList") },
    { label: "1.", title: "Lista numerada", run: () => exec("insertOrderedList") },
    { label: "←", title: "Alinear izquierda", run: () => exec("justifyLeft") },
    { label: "↔", title: "Centrar", run: () => exec("justifyCenter") },
    { label: "⇥", title: "Alinear derecha", run: () => exec("justifyRight") },
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
      <div
        ref={editorRef}
        className="cms-rich-surface"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-labelledby={labelledBy}
        suppressContentEditableWarning
        onInput={() => sync()}
        onBlur={() => sync({ normalize: true })}
        dangerouslySetInnerHTML={{ __html: initialValueRef.current }}
      />
    </div>
  );
}
