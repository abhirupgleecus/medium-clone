"use client";

import { useEffect, useRef } from "react";

type RichTextEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

function hasMeaningfulText(html: string) {
  const plainText = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return plainText.length > 0;
}

function normalizeEditorHtml(html: string) {
  const trimmed = html.trim();
  if (trimmed === "<br>" || trimmed === "<div><br></div>" || trimmed === "<p><br></p>") {
    return "";
  }
  return html;
}

export function toEditorHtml(rawContent: string) {
  if (!rawContent.trim()) {
    return "";
  }

  if (/<[a-z][\s\S]*>/i.test(rawContent)) {
    return rawContent;
  }

  const escaped = rawContent
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  return `<p>${escaped}</p>`;
}

export function isEditorContentEmpty(value: string) {
  return !hasMeaningfulText(value);
}

export default function RichTextEditor({
  id,
  label,
  value,
  onChange,
  placeholder = "Tell your story...",
  disabled = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isEmpty = !hasMeaningfulText(value);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  const syncFromDom = () => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const html = normalizeEditorHtml(editor.innerHTML);
    onChange(html);
  };

  const runCommand = (command: string, commandValue?: string) => {
    const editor = editorRef.current;
    if (!editor || disabled) {
      return;
    }

    editor.focus();
    document.execCommand(command, false, commandValue);
    syncFromDom();
  };

  const onInsertLink = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (disabled) {
      return;
    }

    const url = window.prompt("Enter URL", "https://");
    if (!url) {
      return;
    }

    runCommand("createLink", url);
  };

  return (
    <div className="rich-editor">
      <label htmlFor={id}>{label}</label>

      <div className="rich-editor-toolbar" role="toolbar" aria-label={`${label} formatting`}>
        <button
          className="rich-editor-button"
          onMouseDown={(event) => {
            event.preventDefault();
            runCommand("bold");
          }}
          type="button"
        >
          Bold
        </button>
        <button
          className="rich-editor-button"
          onMouseDown={(event) => {
            event.preventDefault();
            runCommand("italic");
          }}
          type="button"
        >
          Italic
        </button>
        <button
          className="rich-editor-button"
          onMouseDown={(event) => {
            event.preventDefault();
            runCommand("underline");
          }}
          type="button"
        >
          Underline
        </button>
        <button
          className="rich-editor-button"
          onMouseDown={(event) => {
            event.preventDefault();
            runCommand("formatBlock", "H2");
          }}
          type="button"
        >
          H2
        </button>
        <button
          className="rich-editor-button"
          onMouseDown={(event) => {
            event.preventDefault();
            runCommand("insertUnorderedList");
          }}
          type="button"
        >
          Bullet List
        </button>
        <button
          className="rich-editor-button"
          onMouseDown={(event) => {
            event.preventDefault();
            runCommand("formatBlock", "BLOCKQUOTE");
          }}
          type="button"
        >
          Quote
        </button>
        <button className="rich-editor-button" onMouseDown={onInsertLink} type="button">
          Link
        </button>
        <button
          className="rich-editor-button"
          onMouseDown={(event) => {
            event.preventDefault();
            runCommand("removeFormat");
          }}
          type="button"
        >
          Clear
        </button>
      </div>

      <div
        id={id}
        ref={editorRef}
        className="rich-editor-surface"
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-empty={isEmpty}
        data-placeholder={placeholder}
        onInput={syncFromDom}
        onBlur={syncFromDom}
        role="textbox"
        aria-multiline="true"
      />

      <p className="muted-text rich-editor-help">Use the toolbar to format your draft. HTML output is sanitized by the backend.</p>
    </div>
  );
}