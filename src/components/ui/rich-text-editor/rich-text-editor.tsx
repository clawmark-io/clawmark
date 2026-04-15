import "./rich-text-editor.css";
import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Markdown from "react-markdown";
import { EditorToolbar } from "./editor-toolbar";
import { MarkdownTextareaEditor, type MarkdownTextareaEditorRef } from "./markdown-textarea-editor";
import { WysiwygEditor, type WysiwygEditorRef } from "./wysiwyg-editor";

type EditorMode = "markdown" | "wysiwyg";

const EDITOR_MODE_KEY = "rich-text-editor-mode";

function getStoredEditorMode(): EditorMode {
  const stored = localStorage.getItem(EDITOR_MODE_KEY);
  return stored === "wysiwyg" ? "wysiwyg" : "markdown";
}

type RichTextEditorProps = {
  value: string;
  placeholder?: string;
  emptyText?: string;
  autoEdit?: boolean;
  onSave: (value: string) => void;
};

export function RichTextEditor({
  value,
  placeholder,
  emptyText,
  autoEdit,
  onSave,
}: RichTextEditorProps) {
  const { t } = useTranslation("common");
  const [editing, setEditing] = useState(autoEdit ?? false);
  const [editorMode, setEditorMode] = useState<EditorMode>(getStoredEditorMode);
  const [localValue, setLocalValue] = useState(value);
  const originalRef = useRef(value);
  const containerRef = useRef<HTMLDivElement>(null);

  const markdownEditorRef = useRef<MarkdownTextareaEditorRef>(null);
  const wysiwygEditorRef = useRef<WysiwygEditorRef>(null);

  useEffect(() => {
    if (!editing) {
      setLocalValue(value);
      originalRef.current = value;
    }
  }, [value, editing]);

  const saveAndClose = useCallback(() => {
    onSave(localValue);
    setEditing(false);
  }, [localValue, onSave]);

  const handleContainerBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    if (e.relatedTarget && container.contains(e.relatedTarget as Node)) return;

    requestAnimationFrame(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        saveAndClose();
      }
    });
  }, [saveAndClose]);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      setLocalValue(originalRef.current);
      setEditing(false);
    }
  };

  const handleModeChange = (newMode: EditorMode) => {
    if (editorMode === "wysiwyg" && wysiwygEditorRef.current) {
      const md = wysiwygEditorRef.current.getMarkdown();
      setLocalValue(md);
    }
    setEditorMode(newMode);
    localStorage.setItem(EDITOR_MODE_KEY, newMode);
  };

  const getTextarea = useCallback(
    () => markdownEditorRef.current?.getTextarea() ?? null,
    []
  );

  const getEditor = useCallback(
    () => wysiwygEditorRef.current?.getEditor() ?? null,
    []
  );

  if (!editing) {
    return (
      <div
        role="button"
        tabIndex={0}
        className="rich-text-editor-preview"
        onClick={() => setEditing(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditing(true); } }}
      >
        {value ? (
          <Markdown>{value}</Markdown>
        ) : (
          <span className="rich-text-editor-empty">
            {emptyText ?? t("editorEmptyPlaceholder")}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rich-text-editor-container"
      onBlur={handleContainerBlur}
    >
      <EditorToolbar
        mode={editorMode}
        onModeChange={handleModeChange}
        getTextarea={getTextarea}
        getEditor={getEditor}
      />
      {editorMode === "markdown" ? (
        <MarkdownTextareaEditor
          ref={markdownEditorRef}
          value={localValue}
          placeholder={placeholder}
          onChange={setLocalValue}
          onKeyDown={handleTextareaKeyDown}
        />
      ) : (
        <WysiwygEditor
          ref={wysiwygEditorRef}
          initialValue={localValue}
          placeholder={placeholder}
          onChange={setLocalValue}
        />
      )}
    </div>
  );
}
