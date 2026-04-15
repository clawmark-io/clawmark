# Releases

Clawmark uses two release channels:

- `main` produces preview releases automatically
- version tags produce stable releases manually

The `main` branch must always contain the next planned stable version. After each stable release, bump `main` immediately to the next version line.

Example:

1. `0.2.0` is released as stable
2. `main` is bumped to `0.3.0`
3. every merge to `main` produces `0.3.0-beta.N`
4. `0.3.0` is released as stable

## How It Works

- The source version is kept in sync across `package.json`, `package-lock.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`
- `npm run release:prepare -- <version>` updates the version and runs validation
- `npm run release:tag -- <version>` creates the matching Git tag `v<version>`
- pushes to `main` create GitHub pre-releases
- pushes of tags like `v0.3.0` create GitHub stable releases

## Major Release

A major release starts the next planned feature line, for example `0.3.0` after `0.2.0`.

Typical flow:

1. on `main`, prepare the release version: `npm run release:prepare -- 0.3.0`
2. commit the version change
3. create the tag: `npm run release:tag -- 0.3.0`
4. push the branch and tag
5. after release, bump `main` to the next planned major version with `npm run release:next major`

In this project, `release:next major` increments the minor component and resets the patch component.

## Revision Release

A revision release is a stable patch release on the current line, for example `0.3.1` after `0.3.0`.

Typical flow:

1. on `main`, prepare the revision version: `npm run release:prepare -- 0.3.1`
2. commit the version change
3. create the tag: `npm run release:tag -- 0.3.1`
4. push the branch and tag
5. after release, bump `main` to the next planned revision version with `npm run release:next revision`

In this project, `release:next revision` increments the patch component.

## Preview Release

Preview releases are automatic pre-releases built from `main`.

- the version in source stays as the next planned stable version, for example `0.3.0`
- each push to `main` is rewritten in CI to `0.3.0-beta.N`
- `N` comes from the GitHub Actions run number
- preview releases are published as GitHub pre-releases for all supported Tauri desktop targets

Maintainers do not tag preview releases manually.
