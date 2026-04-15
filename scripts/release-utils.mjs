import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const packageJsonPath = path.join(repoRoot, "package.json");
const packageLockPath = path.join(repoRoot, "package-lock.json");
const tauriConfigPath = path.join(repoRoot, "src-tauri", "tauri.conf.json");
const cargoTomlPath = path.join(repoRoot, "src-tauri", "Cargo.toml");

const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function normalizeVersion(input) {
  const version = input.trim().replace(/^v/, "");

  if (!versionPattern.test(version)) {
    throw new Error(`Invalid version "${input}"`);
  }

  return version;
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readCargoToml() {
  return fs.readFileSync(cargoTomlPath, "utf8");
}

function writeCargoToml(content) {
  fs.writeFileSync(cargoTomlPath, content);
}

function replaceCargoVersion(content, version) {
  const versionLinePattern = /^version = "([^"]+)"$/m;
  const match = content.match(versionLinePattern);

  if (!match) {
    throw new Error("Failed to find version in src-tauri/Cargo.toml");
  }

  if (match[1] === version) {
    return content;
  }

  const next = content.replace(versionLinePattern, `version = "${version}"`);

  if (next === content) {
    throw new Error("Failed to update version in src-tauri/Cargo.toml");
  }

  return next;
}

export function readVersions() {
  const packageJson = readJson(packageJsonPath);
  const packageLock = readJson(packageLockPath);
  const tauriConfig = readJson(tauriConfigPath);
  const cargoToml = readCargoToml();
  const cargoVersionMatch = cargoToml.match(/^version = "([^"]+)"$/m);

  if (!cargoVersionMatch) {
    throw new Error("Could not find version in src-tauri/Cargo.toml");
  }

  return {
    "package.json": packageJson.version,
    "package-lock.json": packageLock.version,
    "package-lock.json packages[\"\"]": packageLock.packages?.[""]?.version,
    "src-tauri/tauri.conf.json": tauriConfig.version,
    "src-tauri/Cargo.toml": cargoVersionMatch[1],
  };
}

export function assertVersionsMatch() {
  const versions = readVersions();
  const entries = Object.entries(versions);
  const expectedVersion = entries[0][1];
  const mismatches = entries.filter(([, version]) => version !== expectedVersion);

  if (mismatches.length > 0) {
    const details = entries.map(([file, version]) => `${file}: ${version}`).join("\n");
    throw new Error(`Version mismatch detected:\n${details}`);
  }

  return expectedVersion;
}

export function setVersion(version) {
  const normalizedVersion = normalizeVersion(version);

  const packageJson = readJson(packageJsonPath);
  packageJson.version = normalizedVersion;
  writeJson(packageJsonPath, packageJson);

  const packageLock = readJson(packageLockPath);
  packageLock.version = normalizedVersion;
  if (packageLock.packages?.[""]) {
    packageLock.packages[""].version = normalizedVersion;
  }
  writeJson(packageLockPath, packageLock);

  const tauriConfig = readJson(tauriConfigPath);
  tauriConfig.version = normalizedVersion;
  writeJson(tauriConfigPath, tauriConfig);

  const cargoToml = readCargoToml();
  writeCargoToml(replaceCargoVersion(cargoToml, normalizedVersion));

  return normalizedVersion;
}

export function parseStableVersion(version) {
  const normalizedVersion = normalizeVersion(version);
  if (normalizedVersion.includes("-")) {
    throw new Error(`Expected a stable version, received "${normalizedVersion}"`);
  }

  const [major, minor, patch] = normalizedVersion.split(".").map(Number);
  return { major, minor, patch };
}

export function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}
