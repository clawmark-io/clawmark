import { spawnSync } from "node:child_process";
import { setVersion } from "./release-utils.mjs";

const version = process.argv[2];
const skipLint = process.argv.includes("--skip-lint");
const skipBuild = process.argv.includes("--skip-build");

if (!version) {
  console.error("Usage: node scripts/prepare-release.mjs <version> [--skip-lint] [--skip-build]");
  process.exit(1);
}

function run(command, args) {
  const result =
    process.platform === "win32" && command === "npm"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", "npm", ...args], {
          stdio: "inherit",
          shell: false,
        })
      : spawnSync(command, args, {
          stdio: "inherit",
          shell: false,
        });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

try {
  const normalizedVersion = setVersion(version);
  console.log(`Prepared release version ${normalizedVersion}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

run("npm", ["run", "version:check"]);

if (!skipLint) {
  run("npm", ["run", "lint"]);
}

if (!skipBuild) {
  run("npm", ["run", "build"]);
}
