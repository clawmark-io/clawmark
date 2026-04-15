import { assertVersionsMatch, readVersions } from "./release-utils.mjs";

const plain = process.argv.includes("--plain");

try {
  const version = assertVersionsMatch();

  if (plain) {
    process.stdout.write(version);
  } else {
    console.log(`Versions are in sync: ${version}`);
  }
} catch (error) {
  console.error(error.message);

  if (!plain) {
    const versions = readVersions();
    for (const [file, version] of Object.entries(versions)) {
      console.error(`${file}: ${version}`);
    }
  }

  process.exit(1);
}
