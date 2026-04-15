import { useEffect, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";

function getMarkdownFromEditor(editor: Editor): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tiptap-markdown stores getMarkdown on editor.storage.markdown
  return ((editor.storage as any).markdown as MarkdownStorage).getMarkdown();
}

export type WysiwygEditorRef = {
  getEditor: () => Editor | null;
  getMarkdown: () => string;
};

type WysiwygEditorProps = {
  initialValue: string;
  placeholder?: string;
  onChange: (markdown: string) => void;
};

export const WysiwygEditor = forwardRef<WysiwygEditorRef, WysiwygEditorProps>(
  function WysiwygEditor({ initialValue, placeholder, onChange }, ref) {
    const { t } = useTranslation("common");

    const editor = useEditor({
      extensions: [
        StarterKit,
        Link.configure({ openOnClick: false }),
        Placeholder.configure({ placeholder: placeholder ?? t("editorPlaceholder") }),
        Markdown.configure({
          html: false,
          tightLists: true,
          transformPastedText: true,
          transformCopiedText: true,
        }),
      ],
      content: initialValue,
      onUpdate: ({ editor: e }) => {
        onChange(getMarkdownFromEditor(e));
      },
      editorProps: {
        attributes: {
          class: "rich-text-wysiwyg-content",
        },
        handleKeyDown(_view, event) {
          const isMod = event.ctrlKey || event.metaKey;
          if (isMod && event.key === "a") {
            event.stopPropagation();
          }
          // Return false so tiptap's own keymap (Mod-a → selectAll) still runs
          return false;
        },
      },
    });

    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
      getMarkdown: () => editor ? getMarkdownFromEditor(editor) : "",
    }));

    useEffect(() => {
      if (editor && !editor.isFocused) {
        editor.commands.focus("end");
      }
    }, [editor]);

    return <EditorContent editor={editor} />;
  }
);
