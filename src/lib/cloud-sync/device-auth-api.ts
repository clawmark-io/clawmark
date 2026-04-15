import { config } from "@/lib/config";

const TIMEOUT_MS = 10_000;

export class TokenRejectedError extends Error {
  constructor() {
    super("Token rejected");
    this.name = "TokenRejectedError";
  }
}

export type DeviceCodeResponse = {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
};

export type DeviceTokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  cloudSyncUrl: string;
};

export type DeviceTokenPollResult =
  | { status: "pending" }
  | { status: "complete"; data: DeviceTokenResponse }
  | { status: "expired" };

export type RefreshTokenResponse = {
  accessToken: string;
  expiresAt: number;
};

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await fetch(`${config.authUrl}/api/auth/device/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return res.json();
}

export async function pollDeviceToken(deviceCode: string): Promise<DeviceTokenPollResult> {
  const res = await fetch(`${config.authUrl}/api/auth/device/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceCode }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (res.status === 202) return { status: "pending" };
  if (res.status === 410) return { status: "expired" };
  if (!res.ok) throw new Error(`Server returned ${res.status}`);

  const data: DeviceTokenResponse = await res.json();
  return { status: "complete", data };
}

export async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const res = await fetch(`${config.authUrl}/api/auth/device/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (res.status === 401 || res.status === 403) {
    throw new TokenRejectedError();
  }
  if (!res.ok) throw new Error(`Server returned ${res.status}`);

  return res.json();
}
