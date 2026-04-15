import {
  assertVersionsMatch,
  formatVersion,
  parseStableVersion,
  setVersion,
} from "./release-utils.mjs";

const releaseType = process.argv[2];

if (!releaseType || !["major", "revision"].includes(releaseType)) {
  console.error("Usage: node scripts/bump-next-version.mjs <major|revision>");
  process.exit(1);
}

try {
  const currentVersion = assertVersionsMatch();
  const parsed = parseStableVersion(currentVersion);

  const nextVersion =
    releaseType === "major"
      ? formatVersion({
          major: parsed.major,
          minor: parsed.minor + 1,
          patch: 0,
        })
      : formatVersion({
          major: parsed.major,
          minor: parsed.minor,
          patch: parsed.patch + 1,
        });

  setVersion(nextVersion);
  console.log(`Bumped repository version to ${nextVersion}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
