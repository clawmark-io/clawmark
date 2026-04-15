/**
 * Lightweight utilities for markdown formatting in a textarea.
 * Operates on the textarea's selection and dispatches native input events
 * so React state stays in sync.
 */

type WrapOp = { type: "wrap"; before: string; after: string };
type PrefixOp = { type: "prefix"; prefix: string };
type InsertOp = { type: "insert"; template: string };

type FormatOp = WrapOp | PrefixOp | InsertOp;

const FORMAT_OPS: Record<string, FormatOp> = {
  bold: { type: "wrap", before: "**", after: "**" },
  italic: { type: "wrap", before: "_", after: "_" },
  strikethrough: { type: "wrap", before: "~~", after: "~~" },
  "code-inline": { type: "wrap", before: "`", after: "`" },
  h1: { type: "prefix", prefix: "# " },
  h2: { type: "prefix", prefix: "## " },
  h3: { type: "prefix", prefix: "### " },
  "unordered-list": { type: "prefix", prefix: "- " },
  "ordered-list": { type: "prefix", prefix: "1. " },
  "block-quotes": { type: "prefix", prefix: "> " },
  "code-block": { type: "wrap", before: "```\n", after: "\n```" },
  link: { type: "insert", template: "[text](url)" },
};

function setNativeValue(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  if (setter) setter.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function applyWrap(textarea: HTMLTextAreaElement, before: string, after: string) {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const selected = value.slice(start, end);

  // Toggle off: if already wrapped, remove markers
  if (
    start >= before.length &&
    value.slice(start - before.length, start) === before &&
    value.slice(end, end + after.length) === after
  ) {
    const newValue = value.slice(0, start - before.length) + selected + value.slice(end + after.length);
    setNativeValue(textarea, newValue);
    textarea.selectionStart = start - before.length;
    textarea.selectionEnd = end - before.length;
    return;
  }

  const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
  setNativeValue(textarea, newValue);
  textarea.selectionStart = start + before.length;
  textarea.selectionEnd = end + before.length;
}

function getLineRange(value: string, pos: number): [number, number] {
  const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
  let lineEnd = value.indexOf("\n", pos);
  if (lineEnd === -1) lineEnd = value.length;
  return [lineStart, lineEnd];
}

function applyPrefix(textarea: HTMLTextAreaElement, prefix: string) {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const [lineStart, lineEnd] = getLineRange(value, start);
  const line = value.slice(lineStart, lineEnd);

  // Toggle off: if line already starts with this prefix, remove it
  if (line.startsWith(prefix)) {
    const newValue = value.slice(0, lineStart) + line.slice(prefix.length) + value.slice(lineEnd);
    setNativeValue(textarea, newValue);
    textarea.selectionStart = Math.max(lineStart, start - prefix.length);
    textarea.selectionEnd = Math.max(lineStart, end - prefix.length);
    return;
  }

  // Remove any existing heading prefix before adding new one
  const headingMatch = /^#{1,3}\s/.exec(line);
  const existingPrefixLen = headingMatch ? headingMatch[0].length : 0;
  const stripped = existingPrefixLen > 0 ? line.slice(existingPrefixLen) : line;

  const newLine = prefix + stripped;
  const newValue = value.slice(0, lineStart) + newLine + value.slice(lineEnd);
  const delta = newLine.length - line.length;
  setNativeValue(textarea, newValue);
  textarea.selectionStart = start + delta;
  textarea.selectionEnd = end + delta;
}

function applyInsert(textarea: HTMLTextAreaElement, template: string) {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const selected = value.slice(start, end);

  let insertion: string;
  if (selected && template === "[text](url)") {
    insertion = `[${selected}](url)`;
  } else {
    insertion = template;
  }

  const newValue = value.slice(0, start) + insertion + value.slice(end);
  setNativeValue(textarea, newValue);
  textarea.selectionStart = start;
  textarea.selectionEnd = start + insertion.length;
}

export type TextareaFormatCommand =
  | "bold" | "italic" | "strikethrough" | "code-inline" | "code-block"
  | "h1" | "h2" | "h3"
  | "unordered-list" | "ordered-list" | "block-quotes"
  | "link";

export function applyTextareaFormat(textarea: HTMLTextAreaElement, command: TextareaFormatCommand) {
  const op = FORMAT_OPS[command];
  if (!op) return;

  textarea.focus();
  switch (op.type) {
    case "wrap":
      applyWrap(textarea, op.before, op.after);
      break;
    case "prefix":
      applyPrefix(textarea, op.prefix);
      break;
    case "insert":
      applyInsert(textarea, op.template);
      break;
  }
}
