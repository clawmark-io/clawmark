import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model.ts";
import { runAutoArchive } from "@/lib/workspace/auto-archive.ts";

export class BackgroundProcesses {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private handle: DocHandle<Workspace> | null = null;
  private visibilityHandler: (() => void) | null = null;

  start(handle: DocHandle<Workspace>, intervalMs: number): void {
    this.stop();
    this.handle = handle;

    const runProcesses = () => {
      if (this.handle) {
        runAutoArchive(this.handle);
      }
    };

    // Run immediately
    runProcesses();

    // Set up periodic execution
    this.intervalId = setInterval(runProcesses, intervalMs);

    // Run when app becomes visible
    this.visibilityHandler = () => {
      if (document.visibilityState === "visible") {
        runProcesses();
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.handle = null;
  }
}
