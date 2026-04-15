import { useTranslation } from "react-i18next";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  TextQuote,
  Code,
  Link,
  FileCode,
  Pilcrow,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import { applyTextareaFormat, type TextareaFormatCommand } from "@/lib/textarea-markdown";

type EditorMode = "markdown" | "wysiwyg";

type EditorToolbarProps = {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  getTextarea: () => HTMLTextAreaElement | null;
  getEditor: () => Editor | null;
};

type ToolbarButton = {
  command: TextareaFormatCommand;
  tiptapAction: (editor: Editor) => void;
  icon: React.ComponentType<{ size?: number }>;
  labelKey: "toolbarBold" | "toolbarItalic" | "toolbarStrikethrough" | "toolbarH1" | "toolbarH2" | "toolbarH3" | "toolbarBulletList" | "toolbarOrderedList" | "toolbarBlockquote" | "toolbarCode" | "toolbarLink";
};

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  {
    command: "bold",
    tiptapAction: (e) => e.chain().focus().toggleBold().run(),
    icon: Bold,
    labelKey: "toolbarBold",
  },
  {
    command: "italic",
    tiptapAction: (e) => e.chain().focus().toggleItalic().run(),
    icon: Italic,
    labelKey: "toolbarItalic",
  },
  {
    command: "strikethrough",
    tiptapAction: (e) => e.chain().focus().toggleStrike().run(),
    icon: Strikethrough,
    labelKey: "toolbarStrikethrough",
  },
  {
    command: "h1",
    tiptapAction: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    icon: Heading1,
    labelKey: "toolbarH1",
  },
  {
    command: "h2",
    tiptapAction: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    icon: Heading2,
    labelKey: "toolbarH2",
  },
  {
    command: "h3",
    tiptapAction: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    icon: Heading3,
    labelKey: "toolbarH3",
  },
  {
    command: "unordered-list",
    tiptapAction: (e) => e.chain().focus().toggleBulletList().run(),
    icon: List,
    labelKey: "toolbarBulletList",
  },
  {
    command: "ordered-list",
    tiptapAction: (e) => e.chain().focus().toggleOrderedList().run(),
    icon: ListOrdered,
    labelKey: "toolbarOrderedList",
  },
  {
    command: "block-quotes",
    tiptapAction: (e) => e.chain().focus().toggleBlockquote().run(),
    icon: TextQuote,
    labelKey: "toolbarBlockquote",
  },
  {
    command: "code-inline",
    tiptapAction: (e) => e.chain().focus().toggleCode().run(),
    icon: Code,
    labelKey: "toolbarCode",
  },
  {
    command: "link",
    tiptapAction: (e) => {
      const url = window.prompt("URL:");
      if (url) {
        e.chain().focus().setLink({ href: url }).run();
      }
    },
    icon: Link,
    labelKey: "toolbarLink",
  },
];

function ToolbarFormatButton({ button, onClick }: { button: ToolbarButton; onClick: () => void }) {
  const { t } = useTranslation("common");
  const Icon = button.icon;

  return (
    <button
      type="button"
      className="rich-text-editor-toolbar-btn"
      title={t(button.labelKey)}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <Icon size={14} />
    </button>
  );
}

function ToolbarModeToggle({ mode, onModeChange }: { mode: EditorMode; onModeChange: (mode: EditorMode) => void }) {
  const { t } = useTranslation("common");
  const nextMode = mode === "markdown" ? "wysiwyg" : "markdown";
  const Icon = mode === "markdown" ? Pilcrow : FileCode;

  return (
    <button
      type="button"
      className="rich-text-editor-toolbar-btn rich-text-editor-toolbar-mode-toggle"
      title={mode === "markdown" ? t("editorSwitchToWysiwyg") : t("editorSwitchToMarkdown")}
      onMouseDown={(e) => {
        e.preventDefault();
        onModeChange(nextMode);
      }}
    >
      <Icon size={14} />
    </button>
  );
}

export function EditorToolbar({ mode, onModeChange, getTextarea, getEditor }: EditorToolbarProps) {
  const handleClick = (button: ToolbarButton) => {
    if (mode === "markdown") {
      const textarea = getTextarea();
      if (textarea) applyTextareaFormat(textarea, button.command);
    } else {
      const editor = getEditor();
      if (editor) button.tiptapAction(editor);
    }
  };

  return (
    <div className="rich-text-editor-toolbar">
      <div className="rich-text-editor-toolbar-buttons">
        {TOOLBAR_BUTTONS.map((button) => (
          <ToolbarFormatButton key={button.command} button={button} onClick={() => handleClick(button)} />
        ))}
      </div>
      <ToolbarModeToggle mode={mode} onModeChange={onModeChange} />
    </div>
  );
}
