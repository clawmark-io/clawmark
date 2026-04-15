export type ReadableStore<T> = {
  get(): T;
  subscribe(listener: () => void): () => void;
};

export type WritableStore<T> = ReadableStore<T> & {
  set(value: T): void;
  update(fn: (current: T) => T): void;
};

export function createStore<T>(initial: T): WritableStore<T> {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set: (next) => {
      if (next !== value) {
        value = next;
        for (const l of listeners) l();
      }
    },
    update: (fn) => {
      const next = fn(value);
      if (next !== value) {
        value = next;
        for (const l of listeners) l();
      }
    },
  };
}

export function readOnly<T>(store: WritableStore<T>): ReadableStore<T> {
  return {
    get: store.get,
    subscribe: store.subscribe,
  };
}
