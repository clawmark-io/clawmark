import { assertVersionsMatch, setVersion } from "./release-utils.mjs";

const runNumber = process.argv[2];

if (!runNumber || !/^\d+$/.test(runNumber)) {
  console.error("Usage: node scripts/set-preview-version.mjs <run-number>");
  process.exit(1);
}

try {
  const stableVersion = assertVersionsMatch();
  if (stableVersion.includes("-")) {
    throw new Error(`Preview base version must be stable, received "${stableVersion}"`);
  }

  const previewVersion = `${stableVersion}-beta.${runNumber}`;
  setVersion(previewVersion);
  console.log(`Updated repository version to preview ${previewVersion}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
