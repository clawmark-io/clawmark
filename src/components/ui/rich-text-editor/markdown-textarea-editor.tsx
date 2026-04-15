import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { useTranslation } from "react-i18next";

export type MarkdownTextareaEditorRef = {
  getTextarea: () => HTMLTextAreaElement | null;
};

type MarkdownTextareaEditorProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

export const MarkdownTextareaEditor = forwardRef<MarkdownTextareaEditorRef, MarkdownTextareaEditorProps>(
  function MarkdownTextareaEditor({ value, placeholder, onChange, onKeyDown }, ref) {
    const { t } = useTranslation("common");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      getTextarea: () => textareaRef.current,
    }));

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.value.length;
      }
    }, []);

    return (
      <textarea
        ref={textareaRef}
        className="rich-text-editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? t("editorPlaceholder")}
      />
    );
  }
);
