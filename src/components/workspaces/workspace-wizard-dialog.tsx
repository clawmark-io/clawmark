import { generateId } from "@/lib/utils/id";
import { useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus, RefreshCw, Download, Globe, Cloud, Copy, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import type { AnyDocumentId, Repo } from "@automerge/automerge-repo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useManager } from "@/stores/manager-context";
import { useStore } from "@/hooks/use-store";
import { createWorkspaceRepo, createWorkspaceDoc, parkRepo } from "@/lib/automerge/repo";
import { processJsonFile } from "@/lib/imports/json-import";
import { processKanriFile } from "@/lib/imports/kanri-import";
import { renderJsonImportSummary } from "@/components/sync/import-summaries";
import { renderKanriImportSummary } from "@/components/sync/import-summaries";
import { SyncServerForm, defaultSyncServerFormValues, isSyncServerFormValid } from "@/components/sync/sync-server-form";
import { WorkspaceListPicker } from "./workspace-list-picker";
import type { SyncServerFormValues } from "@/components/sync/sync-server-form";
import type { Workspace, ThemeSettings } from "@/types/data-model";
import type { WorkspaceListEntry } from "@/lib/workspace/drivers/types";
import { isCloudSyncSignedIn, getCloudSyncAuth } from "@/lib/cloud-sync/cloud-sync-auth";
import { CloneSelectWorkspaceStep, CloneSelectProjectsStep, CloneConfigureStep } from "./clone-workspace-steps";

type WorkspaceWizardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forceOpen: boolean;
};

type WizardStep =
  | { type: "choose-path" }
  | { type: "create-new" }
  | { type: "sync-server-form"; serverValues?: SyncServerFormValues }
  | { type: "sync-workspace-list"; serverValues: SyncServerFormValues }
  | { type: "sync-in-progress"; serverValues: SyncServerFormValues; workspaceId: string; workspaceName: string; documentUrl: string }
  | { type: "sync-error"; serverValues: SyncServerFormValues; error: string }
  | { type: "import-in-progress"; importType: "json" | "kanri" }
  | { type: "import-result"; importType: "json" | "kanri"; success: boolean; summary?: ReactNode; error?: string; workspaceId?: string }
  | { type: "cloud-workspace-list" }
  | { type: "cloud-sync-in-progress"; workspaceId: string; workspaceName: string; documentUrl: string }
  | { type: "cloud-sync-error"; error: string }
  | { type: "clone-select-workspace" }
  | { type: "clone-select-projects"; sourceEntry: WorkspaceListEntry }
  | { type: "clone-configure"; sourceEntry: WorkspaceListEntry; selectedProjectIds: string[] };

// --- Path option row (shared style with import-tab-content) ---

type PathOption = {
  icon: ReactNode;
  label: string;
  description: string;
  onClick: () => void;
};

function PathOptionRow({ icon, label, description, onClick }: PathOption) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border-subtle)] text-left transition-colors hover:border-[var(--border-default)] hover:bg-[var(--surface-overlay)] cursor-pointer"
    >
      <div className="shrink-0 text-[var(--text-muted)]">{icon}</div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-[var(--text-muted)]">{description}</span>
      </div>
    </button>
  );
}

// --- Create new workspace step ---

function CreateNewStep({ onBack, onCreated }: { onBack: () => void; onCreated: () => void }) {
  const { t } = useTranslation("projects");
  const [name, setName] = useState("New Workspace");
  const inputRef = useRef<HTMLInputElement>(null);
  const manager = useManager();
  const lastUsedTheme = useStore(manager.lastUsedTheme);

  useEffect(() => {
    setTimeout(() => inputRef.current?.select(), 50);
  }, []);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const themeSettings: ThemeSettings = lastUsedTheme.customColors
      ? { theme: lastUsedTheme.theme, customColors: lastUsedTheme.customColors }
      : { theme: lastUsedTheme.theme };

    const entry = manager.createWorkspace(trimmed, themeSettings);
    manager.setActiveWorkspaceId(entry.workspaceId);
    onCreated();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          {t("createWorkspace")}
        </DialogTitle>
        <DialogDescription>{t("createWorkspaceDescription")}</DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("workspaceName")}
          autoFocus
        />
        <DialogFooter className="mt-4">
          <button type="button" className="btn btn-outline" onClick={onBack}>{t("cancelButton", { ns: "common" })}</button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>{t("createButton", { ns: "common" })}</button>
        </DialogFooter>
      </form>
    </>
  );
}

// --- Sync server form step ---

function SyncServerFormStep({
  initialValues,
  onBack,
  onNext,
}: {
  initialValues?: SyncServerFormValues;
  onBack: () => void;
  onNext: (values: SyncServerFormValues) => void;
}) {
  const { t } = useTranslation("projects");
  const [values, setValues] = useState<SyncServerFormValues>(initialValues ?? defaultSyncServerFormValues);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          {t("syncFromServerTitle")}
        </DialogTitle>
        <DialogDescription>{t("syncFromServerFormDescription")}</DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); if (isSyncServerFormValid(values)) onNext(values); }} className="flex flex-col gap-3">
        <SyncServerForm values={values} onChange={setValues} />
        <DialogFooter>
          <button type="button" className="btn btn-outline" onClick={onBack}>{t("backButton", { ns: "common" })}</button>
          <button type="submit" className="btn btn-primary" disabled={!isSyncServerFormValid(values)}>{t("nextButton", { ns: "common" })}</button>
        </DialogFooter>
      </form>
    </>
  );
}

// --- Sync workspace list step ---

type ServerWorkspaceEntry = {
  workspaceId: string;
  name: string;
  documentUrl?: string;
  lastSyncedAt: string;
};

function SyncWorkspaceListStep({
  serverValues,
  onBack,
  onSync,
}: {
  serverValues: SyncServerFormValues;
  onBack: () => void;
  onSync: (workspaceId: string, workspaceName: string, documentUrl: string) => void;
}) {
  const { t } = useTranslation("projects");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<ServerWorkspaceEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const manager = useManager();
  const localWorkspaces = useStore(manager.workspaces);
  const localIds = localWorkspaces.map((w) => w.workspaceId);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const protocol = serverValues.useTls ? "https" : "http";
      const url = `${protocol}://${serverValues.host.trim()}:${serverValues.port}/v1/workspaces?token=${encodeURIComponent(serverValues.accessToken.trim())}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        const status = res.status;
        setError(status === 401 ? "Authentication failed. Check your access token." : `Server returned ${status}`);
        return;
      }
      const data = await res.json();
      setWorkspaces(data.workspaces ?? []);
    } catch {
      setError("Could not reach the server. Check the connection details and try again.");
    } finally {
      setLoading(false);
    }
  }, [serverValues]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const selectedWs = workspaces.find((w) => w.workspaceId === selectedId);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          {t("selectWorkspace")}
        </DialogTitle>
        <DialogDescription>{t("chooseWorkspaceToSync")}</DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={24} className="animate-spin text-[var(--accent-purple)]" />
          <p className="text-sm text-[var(--text-muted)]">{t("loadingWorkspaces")}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col gap-3 py-4">
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-error shrink-0" />
            <p className="text-sm text-error">{error}</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm self-start" onClick={fetchWorkspaces}>
            {t("retryButton", { ns: "common" })}
          </button>
        </div>
      ) : (
        <WorkspaceListPicker
          workspaces={workspaces}
          localWorkspaceIds={localIds}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      <DialogFooter>
        <button type="button" className="btn btn-outline" onClick={onBack}>{t("backButton", { ns: "common" })}</button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!selectedWs || localIds.includes(selectedWs.workspaceId) || !selectedWs.documentUrl}
          onClick={() => { if (selectedWs?.documentUrl) onSync(selectedWs.workspaceId, selectedWs.name, selectedWs.documentUrl); }}
        >
          {t("syncNowButton", { ns: "common" })}
        </button>
      </DialogFooter>
    </>
  );
}

// --- Sync in progress step ---

const SYNC_TIMEOUT_MS = 30000;

function SyncInProgressStep({
  serverValues,
  workspaceId,
  workspaceName,
  documentUrl,
  onError,
  onDone,
}: {
  serverValues: SyncServerFormValues;
  workspaceId: string;
  workspaceName: string;
  documentUrl: string;
  onError: (error: string) => void;
  onDone: () => void;
}) {
  const manager = useManager();

  // Use refs for callbacks so the effect doesn't re-run when parent re-renders
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Keep repo/adapter in refs so they survive StrictMode's mount → cleanup →
  // remount without creating a second repo on the same IndexedDB database.
  // A fire-and-forget shutdown of the first repo would race with the second
  // repo's writes, corrupting the synced data.
  const repoRef = useRef<Repo | null>(null);
  const adapterRef = useRef<BrowserWebSocketClientAdapter | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Cancel any deferred cleanup from a StrictMode unmount.
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    const databaseName = `tasks-ws-${workspaceId}`;

    // Reuse repo/adapter from a previous StrictMode mount if available.
    if (!repoRef.current) {
      repoRef.current = createWorkspaceRepo(databaseName);
    }
    const repo = repoRef.current;

    if (!adapterRef.current) {
      const protocol = serverValues.useTls ? "wss" : "ws";
      const wsUrl = `${protocol}://${serverValues.host.trim()}:${serverValues.port}/v1/sync/${workspaceId}/data?token=${encodeURIComponent(serverValues.accessToken.trim())}`;

      try {
        adapterRef.current = new BrowserWebSocketClientAdapter(wsUrl);
        repo.networkSubsystem.addNetworkAdapter(adapterRef.current);
      } catch (err) {
        if (!cancelled) onErrorRef.current(err instanceof Error ? err.message : "Connection failed");
        return;
      }
    }

    repo.find<Workspace>(documentUrl as AnyDocumentId)
      .then((handle) => handle.whenReady().then(() => handle))
      .then(async (handle) => {
        if (cancelled) return;

        const doc = handle.doc();
        if (!doc || typeof doc.name !== "string") {
          onErrorRef.current("Workspace document could not be loaded from server.");
          return;
        }

        manager.saveWorkspaceDocUrl(workspaceId, handle.url);

        const projectNames = Object.values(doc.projects).map((p: { title: string }) => p.title);

        manager.addWorkspaceEntry({
          workspaceId,
          databaseName,
          name: workspaceName,
          lastAccessedAt: Date.now(),
          projectNames,
        });

        manager.saveWorkspaceLocalSettings(workspaceId, {
          servers: [{
            id: generateId(),
            name: serverValues.name.trim() || serverValues.host.trim(),
            host: serverValues.host.trim(),
            port: serverValues.port,
            useTls: serverValues.useTls,
            accessToken: serverValues.accessToken.trim(),
            syncMode: "automatic",
          }],
          cloudSyncEnabled: false,
        });

        // Disconnect the WebSocket adapter but keep the repo alive — park it
        // so WorkspaceProvider can reuse the already-initialised repo/IndexedDB
        // connection instead of opening a new one (which can race and fail).
        try { adapterRef.current?.disconnect(); } catch { /* ignore */ }
        adapterRef.current = null;
        parkRepo(databaseName, repo);
        repoRef.current = null;

        if (cancelled) return;

        manager.setActiveWorkspaceId(workspaceId);
        onDoneRef.current();
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          onErrorRef.current(err instanceof Error ? err.message : "Failed to sync workspace document.");
        }
      });

    const overallTimeout = setTimeout(() => {
      if (cancelled) return;
      onErrorRef.current("Sync timed out — no workspace document received from server.");
      cancelled = true;
    }, SYNC_TIMEOUT_MS);

    return () => {
      clearTimeout(overallTimeout);
      cancelled = true;
      // Defer cleanup: StrictMode remount cancels this timer and reuses the
      // repo/adapter. A real unmount lets the timer fire and cleans up.
      cleanupTimerRef.current = setTimeout(() => {
        try { adapterRef.current?.disconnect(); } catch { /* ignore */ }
        adapterRef.current = null;
        try { repoRef.current?.shutdown(); } catch { /* ignore */ }
        repoRef.current = null;
      }, 0);
    };
  }, [workspaceId, workspaceName, documentUrl, serverValues, manager]);

  const { t } = useTranslation("projects");

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("syncingWorkspace")}</DialogTitle>
        <DialogDescription>{t("syncingFromServer", { name: workspaceName })}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 size={32} className="animate-spin text-[var(--accent-purple)]" />
        <p className="text-sm text-[var(--text-muted)]">{t("receivingData")}</p>
      </div>
    </>
  );
}

// --- Import in progress step ---

function ImportInProgressContent() {
  const { t } = useTranslation("projects");

  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <Loader2 size={32} className="animate-spin text-[var(--accent-purple)]" />
      <p className="text-sm text-[var(--text-muted)]">{t("importingData")}</p>
    </div>
  );
}

// --- Import result step ---

function ImportResultContent({
  success,
  summary,
  error,
}: {
  success: boolean;
  summary?: ReactNode;
  error?: string;
}) {
  const { t } = useTranslation("projects");

  return success ? (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={20} className="text-[var(--success-text)]" />
        <span className="text-sm font-medium">{t("importComplete")}</span>
      </div>
      {summary}
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <XCircle size={20} className="text-error" />
        <span className="text-sm font-medium">{t("importFailed")}</span>
      </div>
      <p className="text-sm text-[var(--text-muted)] break-words">{error}</p>
    </div>
  );
}

// --- Cloud workspace list step ---

function CloudWorkspaceListStep({
  onBack,
  onSync,
}: {
  onBack: () => void;
  onSync: (workspaceId: string, workspaceName: string, documentUrl: string) => void;
}) {
  const { t } = useTranslation("projects");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<ServerWorkspaceEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const manager = useManager();
  const localWorkspaces = useStore(manager.workspaces);
  const localIds = localWorkspaces.map((w) => w.workspaceId);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getCloudSyncAuth();
      if (!auth) {
        setError("Not signed in to cloud sync.");
        return;
      }
      if (!auth.cloudSyncUrl) {
        setError("Cloud sync URL not available. Please sign in again.");
        return;
      }
      const res = await fetch(`${auth.cloudSyncUrl}/v1/cloud/workspaces`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        const status = res.status;
        setError(status === 401 ? "Authentication failed. Please sign in again." : `Server returned ${status}`);
        return;
      }
      const data = await res.json();
      setWorkspaces(data.workspaces ?? []);
    } catch {
      setError("Could not reach the cloud server. Try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const selectedWs = workspaces.find((w) => w.workspaceId === selectedId);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          {t("selectCloudWorkspace")}
        </DialogTitle>
        <DialogDescription>{t("chooseCloudWorkspaceToSync")}</DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={24} className="animate-spin text-[var(--accent-purple)]" />
          <p className="text-sm text-[var(--text-muted)]">{t("loadingCloudWorkspaces")}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col gap-3 py-4">
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-error shrink-0" />
            <p className="text-sm text-error">{error}</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm self-start" onClick={fetchWorkspaces}>
            {t("retryButton", { ns: "common" })}
          </button>
        </div>
      ) : (
        <WorkspaceListPicker
          workspaces={workspaces}
          localWorkspaceIds={localIds}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      <DialogFooter>
        <button type="button" className="btn btn-outline" onClick={onBack}>{t("backButton", { ns: "common" })}</button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!selectedWs || localIds.includes(selectedWs.workspaceId) || !selectedWs.documentUrl}
          onClick={() => { if (selectedWs?.documentUrl) onSync(selectedWs.workspaceId, selectedWs.name, selectedWs.documentUrl); }}
        >
          {t("syncNowButton", { ns: "common" })}
        </button>
      </DialogFooter>
    </>
  );
}

// --- Cloud sync in progress step ---

function CloudSyncInProgressStep({
  workspaceId,
  workspaceName,
  documentUrl,
  onError,
  onDone,
}: {
  workspaceId: string;
  workspaceName: string;
  documentUrl: string;
  onError: (error: string) => void;
  onDone: () => void;
}) {
  const manager = useManager();

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const repoRef = useRef<Repo | null>(null);
  const adapterRef = useRef<BrowserWebSocketClientAdapter | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    const auth = getCloudSyncAuth();
    if (!auth) {
      onErrorRef.current("Not signed in to cloud sync.");
      return;
    }

    const databaseName = `tasks-ws-${workspaceId}`;

    if (!repoRef.current) {
      repoRef.current = createWorkspaceRepo(databaseName);
    }
    const repo = repoRef.current;

    if (!adapterRef.current) {
      if (!auth.cloudSyncUrl) {
        if (!cancelled) onErrorRef.current("Cloud sync URL not available. Please sign in again.");
        return;
      }
      const cloudSyncHost = auth.cloudSyncUrl.replace(/^https?:\/\//, "");
      const protocol = auth.cloudSyncUrl.startsWith("https") ? "wss" : "ws";
      const wsUrl = `${protocol}://${cloudSyncHost}/v1/sync/${workspaceId}/data?token=${encodeURIComponent(auth.accessToken)}`;

      try {
        adapterRef.current = new BrowserWebSocketClientAdapter(wsUrl);
        repo.networkSubsystem.addNetworkAdapter(adapterRef.current);
      } catch (err) {
        if (!cancelled) onErrorRef.current(err instanceof Error ? err.message : "Connection failed");
        return;
      }
    }

    repo.find<Workspace>(documentUrl as AnyDocumentId)
      .then((handle) => handle.whenReady().then(() => handle))
      .then(async (handle) => {
        if (cancelled) return;

        const doc = handle.doc();
        if (!doc || typeof doc.name !== "string") {
          onErrorRef.current("Workspace document could not be loaded from cloud.");
          return;
        }

        manager.saveWorkspaceDocUrl(workspaceId, handle.url);

        const projectNames = Object.values(doc.projects).map((p: { title: string }) => p.title);

        manager.addWorkspaceEntry({
          workspaceId,
          databaseName,
          name: workspaceName,
          lastAccessedAt: Date.now(),
          projectNames,
        });

        // Enable cloud sync for the imported workspace
        manager.saveWorkspaceLocalSettings(workspaceId, {
          servers: [],
          cloudSyncEnabled: true,
        });

        try { adapterRef.current?.disconnect(); } catch { /* ignore */ }
        adapterRef.current = null;
        parkRepo(databaseName, repo);
        repoRef.current = null;

        if (cancelled) return;

        manager.setActiveWorkspaceId(workspaceId);
        onDoneRef.current();
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          onErrorRef.current(err instanceof Error ? err.message : "Failed to sync workspace document.");
        }
      });

    const overallTimeout = setTimeout(() => {
      if (cancelled) return;
      onErrorRef.current("Sync timed out — no workspace document received from cloud.");
      cancelled = true;
    }, SYNC_TIMEOUT_MS);

    return () => {
      clearTimeout(overallTimeout);
      cancelled = true;
      cleanupTimerRef.current = setTimeout(() => {
        try { adapterRef.current?.disconnect(); } catch { /* ignore */ }
        adapterRef.current = null;
        try { repoRef.current?.shutdown(); } catch { /* ignore */ }
        repoRef.current = null;
      }, 0);
    };
  }, [workspaceId, workspaceName, documentUrl, manager]);

  const { t } = useTranslation("projects");

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("syncingWorkspace")}</DialogTitle>
        <DialogDescription>{t("syncingFromServer", { name: workspaceName })}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 size={32} className="animate-spin text-[var(--accent-purple)]" />
        <p className="text-sm text-[var(--text-muted)]">{t("receivingData")}</p>
      </div>
    </>
  );
}

// --- Main wizard dialog ---

export function WorkspaceWizardDialog({ open, onOpenChange, forceOpen }: WorkspaceWizardDialogProps) {
  const { t } = useTranslation("projects");
  const [step, setStep] = useState<WizardStep>({ type: "choose-path" });
  const manager = useManager();

  // Reset step when dialog opens
  useEffect(() => {
    if (open) setStep({ type: "choose-path" });
  }, [open]);

  const handleClose = () => {
    if (!forceOpen) onOpenChange(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value && forceOpen) return;
    onOpenChange(value);
  };

  // --- Import logic ---

  const triggerImport = useCallback((importType: "json" | "kanri") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    let handled = false;

    input.addEventListener("change", async () => {
      handled = true;
      const file = input.files?.[0];
      if (!file) return;

      setStep({ type: "import-in-progress", importType });

      const workspaceId = generateId();
      const databaseName = `tasks-ws-${workspaceId}`;

      try {
        const result = importType === "json"
          ? await processJsonFile(workspaceId, file)
          : await processKanriFile(workspaceId, file);

        if (!result.success) {
          setStep({ type: "import-result", importType, success: false, error: result.error });
          return;
        }

        // Determine workspace name and theme
        let wsName = "Imported Workspace";
        let wsTheme: ThemeSettings | undefined;
        const lastUsedTheme = manager.getLastUsedTheme();

        if (importType === "json" && "workspaceMeta" in result && result.workspaceMeta) {
          wsName = result.workspaceMeta.name;
          wsTheme = result.workspaceMeta.theme;
        } else if (importType === "kanri" && "suggestedTheme" in result && result.suggestedTheme) {
          wsTheme = { theme: result.suggestedTheme };
        }

        if (!wsTheme) {
          wsTheme = lastUsedTheme.customColors
            ? { theme: lastUsedTheme.theme, customColors: lastUsedTheme.customColors }
            : { theme: lastUsedTheme.theme };
        }

        // Create workspace with imported projects
        const repo = createWorkspaceRepo(databaseName);
        const { handle, url } = createWorkspaceDoc(repo, wsName, wsTheme);

        // Determine default view from imported metadata
        const wsDefaultView = importType === "json" && "workspaceMeta" in result && result.workspaceMeta?.defaultView
          ? result.workspaceMeta.defaultView
          : undefined;

        handle.change((doc) => {
          result.projects.forEach((project, index) => {
            project.sortOrder = index;
            doc.projects[project.id] = project;
          });
          if (wsDefaultView) {
            doc.defaultView = wsDefaultView;
          }
          doc.updatedAt = Date.now();
        });

        manager.saveWorkspaceDocUrl(workspaceId, url);

        manager.addWorkspaceEntry({
          workspaceId,
          databaseName,
          name: wsName,
          lastAccessedAt: Date.now(),
          projectNames: result.projects.map((p) => p.title),
          defaultView: wsDefaultView,
        });

        repo.shutdown();

        let summary: ReactNode = null;
        if (importType === "json" && "stats" in result && "logosImported" in result.stats) {
          summary = renderJsonImportSummary(result.stats);
        } else if (importType === "kanri" && "stats" in result && "type" in result.stats) {
          summary = renderKanriImportSummary(result.stats);
        }

        setStep({ type: "import-result", importType, success: true, summary, workspaceId });
      } catch (err) {
        setStep({
          type: "import-result",
          importType,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    });

    // Detect file picker cancellation via focus event
    const handleFocus = () => {
      setTimeout(() => {
        if (!handled && !input.files?.length) {
          // User cancelled, stay on choose-path
        }
        window.removeEventListener("focus", handleFocus);
      }, 300);
    };
    window.addEventListener("focus", handleFocus);

    input.click();
  }, [manager]);

  // --- Render ---

  const renderStep = () => {
    switch (step.type) {
      case "choose-path":
        return (
          <>
            <DialogHeader>
              <DialogTitle>{t("newWorkspace")}</DialogTitle>
              <DialogDescription>{t("chooseSetupMethod")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <PathOptionRow
                icon={<Plus size={18} />}
                label={t("createNewWorkspace")}
                description={t("startWithEmptyWorkspace")}
                onClick={() => setStep({ type: "create-new" })}
              />
              <PathOptionRow
                icon={<Globe size={18} />}
                label={t("syncFromServer")}
                description={t("syncFromServerDescription")}
                onClick={() => setStep({ type: "sync-server-form" })}
              />
              {isCloudSyncSignedIn() ? (
                <PathOptionRow
                  icon={<Cloud size={18} />}
                  label={t("importFromCloud")}
                  description={t("importFromCloudDescription")}
                  onClick={() => setStep({ type: "cloud-workspace-list" })}
                />
              ) : null}
              <PathOptionRow
                icon={<Copy size={18} />}
                label={t("cloneWorkspace")}
                description={t("cloneWorkspaceDescription")}
                onClick={() => setStep({ type: "clone-select-workspace" })}
              />
              <PathOptionRow
                icon={<Download size={18} />}
                label={t("importFromJsonWizard")}
                description={t("importFromJsonWizardDescription")}
                onClick={() => triggerImport("json")}
              />
              <PathOptionRow
                icon={<RefreshCw size={18} />}
                label={t("importFromKanriWizard")}
                description={t("importFromKanriWizardDescription")}
                onClick={() => triggerImport("kanri")}
              />
            </div>
            {forceOpen ? null : (
              <DialogFooter>
                <button type="button" className="btn btn-outline" onClick={handleClose}>{t("cancelButton", { ns: "common" })}</button>
              </DialogFooter>
            )}
          </>
        );

      case "create-new":
        return (
          <CreateNewStep
            onBack={() => setStep({ type: "choose-path" })}
            onCreated={handleClose}
          />
        );

      case "sync-server-form":
        return (
          <SyncServerFormStep
            initialValues={step.serverValues}
            onBack={() => setStep({ type: "choose-path" })}
            onNext={(values) => setStep({ type: "sync-workspace-list", serverValues: values })}
          />
        );

      case "sync-workspace-list":
        return (
          <SyncWorkspaceListStep
            serverValues={step.serverValues}
            onBack={() => setStep({ type: "sync-server-form", serverValues: step.serverValues })}
            onSync={(id, name, url) => setStep({ type: "sync-in-progress", serverValues: step.serverValues, workspaceId: id, workspaceName: name, documentUrl: url })}
          />
        );

      case "sync-in-progress":
        return (
          <SyncInProgressStep
            serverValues={step.serverValues}
            workspaceId={step.workspaceId}
            workspaceName={step.workspaceName}
            documentUrl={step.documentUrl}
            onError={(error) => setStep({ type: "sync-error", serverValues: step.serverValues, error })}
            onDone={handleClose}
          />
        );

      case "sync-error":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button type="button" onClick={() => setStep({ type: "sync-workspace-list", serverValues: step.serverValues })} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
                  <ArrowLeft size={18} />
                </button>
                {t("syncFailed")}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <div className="flex items-center gap-2">
                <XCircle size={18} className="text-error shrink-0" />
                <p className="text-sm text-error">{step.error}</p>
              </div>
            </div>
            <DialogFooter>
              <button type="button" className="btn btn-outline" onClick={() => setStep({ type: "sync-workspace-list", serverValues: step.serverValues })}>
                {t("backButton", { ns: "common" })}
              </button>
            </DialogFooter>
          </>
        );

      case "cloud-workspace-list":
        return (
          <CloudWorkspaceListStep
            onBack={() => setStep({ type: "choose-path" })}
            onSync={(id, name, url) => setStep({ type: "cloud-sync-in-progress", workspaceId: id, workspaceName: name, documentUrl: url })}
          />
        );

      case "cloud-sync-in-progress":
        return (
          <CloudSyncInProgressStep
            workspaceId={step.workspaceId}
            workspaceName={step.workspaceName}
            documentUrl={step.documentUrl}
            onError={(error) => setStep({ type: "cloud-sync-error", error })}
            onDone={handleClose}
          />
        );

      case "cloud-sync-error":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button type="button" onClick={() => setStep({ type: "cloud-workspace-list" })} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
                  <ArrowLeft size={18} />
                </button>
                {t("syncFailed")}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <div className="flex items-center gap-2">
                <XCircle size={18} className="text-error shrink-0" />
                <p className="text-sm text-error">{step.error}</p>
              </div>
            </div>
            <DialogFooter>
              <button type="button" className="btn btn-outline" onClick={() => setStep({ type: "cloud-workspace-list" })}>
                {t("backButton", { ns: "common" })}
              </button>
            </DialogFooter>
          </>
        );

      case "clone-select-workspace":
        return (
          <CloneSelectWorkspaceStep
            onBack={() => setStep({ type: "choose-path" })}
            onSelect={(entry) => setStep({ type: "clone-select-projects", sourceEntry: entry })}
          />
        );

      case "clone-select-projects":
        return (
          <CloneSelectProjectsStep
            sourceEntry={step.sourceEntry}
            onBack={() => setStep({ type: "clone-select-workspace" })}
            onNext={(selectedIds) =>
              setStep({ type: "clone-configure", sourceEntry: step.sourceEntry, selectedProjectIds: selectedIds })
            }
          />
        );

      case "clone-configure":
        return (
          <CloneConfigureStep
            sourceEntry={step.sourceEntry}
            selectedProjectIds={step.selectedProjectIds}
            onBack={() => setStep({ type: "clone-select-projects", sourceEntry: step.sourceEntry })}
            onDone={handleClose}
          />
        );

      case "import-in-progress":
        return (
          <>
            <DialogHeader>
              <DialogTitle>{t("importing")}</DialogTitle>
            </DialogHeader>
            <ImportInProgressContent />
          </>
        );

      case "import-result":
        return (
          <>
            <DialogHeader>
              <DialogTitle>{step.success ? t("importResult") : t("importError")}</DialogTitle>
            </DialogHeader>
            <ImportResultContent success={step.success} summary={step.summary} error={step.error} />
            <DialogFooter>
              {step.success ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (step.workspaceId) manager.setActiveWorkspaceId(step.workspaceId);
                    handleClose();
                  }}
                >
                  {t("doneButton", { ns: "common" })}
                </button>
              ) : (
                <button type="button" className="btn btn-outline" onClick={() => setStep({ type: "choose-path" })}>
                  {t("backButton", { ns: "common" })}
                </button>
              )}
            </DialogFooter>
          </>
        );
    }
  };

  const isBusy = step.type === "import-in-progress" || step.type === "sync-in-progress" || step.type === "cloud-sync-in-progress";
  const showCloseButton = !forceOpen && !isBusy;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        onPointerDownOutside={(e) => { if (forceOpen || isBusy) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (forceOpen || isBusy) e.preventDefault(); }}
      >
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
