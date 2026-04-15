import { spawnSync } from "node:child_process";
import { assertVersionsMatch, normalizeVersion } from "./release-utils.mjs";

const inputVersion = process.argv[2];

if (!inputVersion) {
  console.error("Usage: node scripts/tag-release.mjs <version>");
  process.exit(1);
}

function run(command, args, options = {}) {
  const resolvedCommand =
    process.platform === "win32" && command === "git" ? "git.exe" : command;
  const result = spawnSync(resolvedCommand, args, {
    encoding: "utf8",
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
    process.exit(result.status ?? 1);
  }

  return result.stdout?.trim() ?? "";
}

try {
  const version = normalizeVersion(inputVersion);
  const currentVersion = assertVersionsMatch();

  if (version !== currentVersion) {
    throw new Error(`Version mismatch: requested ${version}, repository is ${currentVersion}`);
  }

  const worktreeState = run("git", ["status", "--porcelain"]);
  if (worktreeState.length > 0) {
    throw new Error("Git worktree is not clean");
  }

  const tagName = `v${version}`;
  const existingTag = run("git", ["tag", "--list", tagName]);
  if (existingTag === tagName) {
    throw new Error(`Tag ${tagName} already exists`);
  }

  run("git", ["tag", "-a", tagName, "-m", `Release ${tagName}`], { stdio: "inherit" });
  console.log(`Created tag ${tagName}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
