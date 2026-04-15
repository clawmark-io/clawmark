type QueueEntry = {
  resolve: () => void;
  reject: (reason: unknown) => void;
  signal?: AbortSignal;
  onAbort?: () => void;
};

export class Semaphore {
  private capacity: number;
  private running = 0;
  private queue: QueueEntry[] = [];

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  async acquire(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    if (this.running < this.capacity) {
      this.running++;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const entry: QueueEntry = { resolve, reject, signal };

      if (signal) {
        entry.onAbort = () => {
          const idx = this.queue.indexOf(entry);
          if (idx !== -1) {
            this.queue.splice(idx, 1);
            reject(new DOMException("Aborted", "AbortError"));
          }
        };
        signal.addEventListener("abort", entry.onAbort, { once: true });
      }

      this.queue.push(entry);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      if (next.onAbort && next.signal) {
        next.signal.removeEventListener("abort", next.onAbort);
      }
      next.resolve();
    } else {
      this.running--;
    }
  }
}
