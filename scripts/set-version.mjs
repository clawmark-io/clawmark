import { setVersion } from "./release-utils.mjs";

const version = process.argv[2];

if (!version) {
  console.error("Usage: node scripts/set-version.mjs <version>");
  process.exit(1);
}

try {
  const normalizedVersion = setVersion(version);
  console.log(`Updated repository version to ${normalizedVersion}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
