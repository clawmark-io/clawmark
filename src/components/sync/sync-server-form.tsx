import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { FieldLabel } from "@/components/ui/field-label";

export type SyncServerFormValues = {
  name: string;
  host: string;
  port: number;
  useTls: boolean;
  accessToken: string;
};

type SyncServerFormProps = {
  values: SyncServerFormValues;
  onChange: (values: SyncServerFormValues) => void;
  showTestConnection?: boolean;
};

export const defaultSyncServerFormValues: SyncServerFormValues = {
  name: "",
  host: "",
  port: 3030,
  useTls: false,
  accessToken: "",
};

type TestStatus = "idle" | "testing" | "success" | "auth_error" | "network_error";

export async function testConnection(
  host: string,
  port: number,
  useTls: boolean,
  accessToken: string,
): Promise<TestStatus> {
  const protocol = useTls ? "https" : "http";
  const url = `${protocol}://${host}:${port}/v1/workspaces?token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return "success";
    if (res.status === 401) return "auth_error";
    return "network_error";
  } catch {
    return "network_error";
  }
}

export function isSyncServerFormValid(values: SyncServerFormValues): boolean {
  return !!(values.name.trim() && values.host.trim() && values.port > 0 && values.accessToken.trim());
}

export function SyncServerForm({ values, onChange, showTestConnection = true }: SyncServerFormProps) {
  const { t } = useTranslation("sync");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");

  const update = (partial: Partial<SyncServerFormValues>) => {
    onChange({ ...values, ...partial });
  };

  const handleTestConnection = async () => {
    setTestStatus("testing");
    const result = await testConnection(values.host.trim(), values.port, values.useTls, values.accessToken);
    setTestStatus(result);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t("name")}</FieldLabel>
        <input
          className="input input-bordered input-sm bg-[var(--surface-overlay)]"
          type="text"
          placeholder={t("mySyncServerPlaceholder")}
          value={values.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <FieldLabel>{t("host")}</FieldLabel>
          <input
            className="input input-bordered input-sm bg-[var(--surface-overlay)]"
            type="text"
            placeholder={t("hostPlaceholder")}
            value={values.host}
            onChange={(e) => update({ host: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5 w-24">
          <FieldLabel>{t("port")}</FieldLabel>
          <input
            className="input input-bordered input-sm bg-[var(--surface-overlay)] text-center"
            type="number"
            min={1}
            max={65535}
            value={values.port}
            onChange={(e) => update({ port: parseInt(e.target.value) || 3030 })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <FieldLabel>{t("useTls")}</FieldLabel>
        <Switch
          size="sm"
          checked={values.useTls}
          onCheckedChange={(checked) => update({ useTls: checked === true })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t("accessToken")}</FieldLabel>
        <input
          className="input input-bordered input-sm bg-[var(--surface-overlay)]"
          type="password"
          placeholder={t("accessTokenPlaceholder")}
          value={values.accessToken}
          onChange={(e) => update({ accessToken: e.target.value })}
        />
      </div>

      {showTestConnection ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleTestConnection}
            disabled={!values.host.trim() || !values.port || !values.accessToken.trim() || testStatus === "testing"}
          >
            {t(testStatus === "testing" ? "testing" : "testConnection")}
          </button>
          {testStatus === "success" ? (
            <span className="text-xs text-success">{t("connectionSuccessful")}</span>
          ) : null}
          {testStatus === "auth_error" ? (
            <span className="text-xs text-error">{t("authenticationFailed")}</span>
          ) : null}
          {testStatus === "network_error" ? (
            <span className="text-xs text-error">{t("couldNotReachServer")}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
