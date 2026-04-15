import { useEffect } from 'react';

type KeyboardModifiers = {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
};

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers: KeyboardModifiers = {}
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip plain-key shortcuts when focus is in a text field
      const hasModifier = modifiers.ctrl || modifiers.meta || modifiers.shift || modifiers.alt;
      if (!hasModifier) {
        const el = document.activeElement;
        const isEditable =
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          (el instanceof HTMLElement && el.isContentEditable);
        if (isEditable) return;
      }

      const ctrlMatch = modifiers.ctrl === undefined || e.ctrlKey === modifiers.ctrl;
      const metaMatch = modifiers.meta === undefined || e.metaKey === modifiers.meta;
      const shiftMatch = modifiers.shift === undefined || e.shiftKey === modifiers.shift;
      const altMatch = modifiers.alt === undefined || e.altKey === modifiers.alt;

      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        ctrlMatch &&
        metaMatch &&
        shiftMatch &&
        altMatch
      ) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, modifiers]);
}
