import { assertVersionsMatch, normalizeVersion } from "./release-utils.mjs";

const inputTag = process.argv[2];

if (!inputTag) {
  console.error("Usage: node scripts/verify-tag-version.mjs <tag>");
  process.exit(1);
}

try {
  const currentVersion = assertVersionsMatch();
  const tagVersion = normalizeVersion(inputTag);

  if (currentVersion !== tagVersion) {
    throw new Error(`Tag ${inputTag} does not match repository version ${currentVersion}`);
  }

  console.log(`Tag ${inputTag} matches repository version ${currentVersion}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
