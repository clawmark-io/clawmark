import { readFileSync, existsSync } from "node:fs";
import { parse } from "yaml";
import type { ServerConfig } from "./types.js";

const DEFAULTS: ServerConfig = {
  host: "0.0.0.0",
  port: 3030,
  storagePath: "./data",
  accessToken: "",
  workspaceIndex: {
    maxBackups: 100,
  },
  imageGc: {
    intervalHours: 24,
  },
};

export function loadConfig(): ServerConfig {
  const configPath = process.env.CONFIG_PATH ?? "./config.yaml";

  let fileConfig: Record<string, unknown> = {};

  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, "utf-8");
      const parsed = parse(raw) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") {
        fileConfig = parsed;
      }
    } catch {
      console.error(`Failed to read config file at: ${configPath}`);
      process.exit(1);
    }
  }

  const wi = fileConfig.workspaceIndex as Record<string, unknown> | undefined;

  // Layer: defaults → YAML file → env variables
  const host = process.env.HOST
    ?? (typeof fileConfig.host === "string" ? fileConfig.host : undefined)
    ?? DEFAULTS.host;

  const port = process.env.PORT
    ? Number.parseInt(process.env.PORT, 10)
    : typeof fileConfig.port === "number" ? fileConfig.port : DEFAULTS.port;

  const storagePath = process.env.STORAGE_PATH
    ?? (typeof fileConfig.storagePath === "string" ? fileConfig.storagePath : undefined)
    ?? DEFAULTS.storagePath;

  const accessToken = process.env.ACCESS_TOKEN
    ?? (typeof fileConfig.accessToken === "string" ? fileConfig.accessToken : undefined)
    ?? DEFAULTS.accessToken;

  const maxBackups = process.env.WORKSPACE_INDEX_MAX_BACKUPS
    ? Number.parseInt(process.env.WORKSPACE_INDEX_MAX_BACKUPS, 10)
    : (wi && typeof wi.maxBackups === "number") ? wi.maxBackups : DEFAULTS.workspaceIndex.maxBackups;

  const ig = fileConfig.imageGc as Record<string, unknown> | undefined;
  const imageGcIntervalHours = process.env.IMAGE_GC_INTERVAL_HOURS
    ? Number.parseInt(process.env.IMAGE_GC_INTERVAL_HOURS, 10)
    : (ig && typeof ig.intervalHours === "number") ? ig.intervalHours : DEFAULTS.imageGc.intervalHours;

  const errors: string[] = [];

  if (!host) {
    errors.push("'host' is required (string) — set HOST env or host in config.yaml");
  }
  if (!Number.isInteger(port)) {
    errors.push("'port' is required (integer) — set PORT env or port in config.yaml");
  }
  if (!storagePath) {
    errors.push("'storagePath' is required (string) — set STORAGE_PATH env or storagePath in config.yaml");
  }
  if (!accessToken) {
    errors.push("'accessToken' is required (string) — set ACCESS_TOKEN env or accessToken in config.yaml");
  }

  if (errors.length > 0) {
    console.error("Config validation failed:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  return {
    host,
    port,
    storagePath,
    accessToken,
    workspaceIndex: {
      maxBackups: maxBackups,
    },
    imageGc: {
      intervalHours: imageGcIntervalHours,
    },
  };
}
