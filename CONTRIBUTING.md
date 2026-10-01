# Contributing to ConsolX

Thank you for your interest in ConsolX! This guide explains how to set up the project, the rules
for code and commits, and how to submit your changes.

## License of contributions

ConsolX is licensed under the GNU GPLv3 with an additional permission for plugins (see
[LICENSE](LICENSE), [LICENSE-EXCEPTION](LICENSE-EXCEPTION) and [NOTICE](NOTICE)). The
`@consolx/plugin-api` package is licensed under the MIT License (see
[packages/plugin-api/LICENSE](packages/plugin-api/LICENSE)).

By contributing, you agree that your contribution is licensed under the license of the part of the
project you change.

## Developer Certificate of Origin (DCO)

Every commit must be signed off. By signing off, you certify that you wrote the change, or have
the right to submit it, under the project's license, as described in the
[Developer Certificate of Origin 1.1](https://developercertificate.org/).

Sign off with the `-s` option:

```bash
git commit -s
```

Git then adds this line at the end of the commit message, using the name and email of your Git
configuration:

```
Signed-off-by: Jane Doe <jane@example.com>
```

Use your real name. If you forgot to sign off:

- the last commit: `git commit --amend --no-edit -s`
- all the commits of your branch: `git rebase --signoff main`

## Getting started

Prerequisites:

- [Node.js](https://nodejs.org/) LTS (22.12 or later, 24 recommended), with npm
- [Git](https://git-scm.com/)
- On Windows, the Visual Studio Build Tools with "Desktop development with C++" may be needed to
  build native modules

Install and run:

```bash
git clone https://github.com/Pierrot-leFouduBus/ConsolX.git
cd ConsolX
npm install
npm run dev
```

`npm install` also downloads the Electron binary. `npm run dev` opens the app with hot reload.

### Scripts

Run them from the root of the repository.

| Script                 | What it does                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `npm run dev`          | Start the app in development mode.                                                     |
| `npm run build`        | Build all packages.                                                                    |
| `npm run typecheck`    | Check TypeScript types in all packages.                                                |
| `npm run lint`         | Check the code with ESLint.                                                            |
| `npm run format`       | Format all files with Prettier.                                                        |
| `npm run format:check` | Check that all files are formatted.                                                    |
| `npm test`             | Run the unit tests once.                                                               |
| `npm run test:watch`   | Run the unit tests again on each file change.                                          |
| `npm run test:e2e`     | Build the app, then run the end-to-end tests: Playwright starts ConsolX and drives it. |

## Project layout

```
apps/desktop/           Electron application (GPLv3)
  src/main/             main process: windows, shells, system access
  src/preload/          preload script: the only bridge between the UI and the system
  src/renderer/         user interface (React)
  src/shared/           types shared by the processes
  e2e/                  end-to-end tests (Playwright)
packages/plugin-api/    public types for plugins (MIT)
docs/user/              user guide
```

## Code guidelines

- All code is written in TypeScript.
- Prettier formats the code and ESLint checks it: both must pass.
- Comments are written in English and kept short and simple.
- Unit tests live next to the code they test, as `*.test.ts` files.
- The user interface never accesses the system directly: it goes through the API exposed by the
  preload script.
- Before adding a dependency, check that its license is compatible with the GPLv3 (for example
  MIT, BSD, ISC or Apache-2.0), and mention it in your pull request.

## Commit messages

Commit messages are written in English and follow
[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>

<body>

Signed-off-by: Jane Doe <jane@example.com>
```

- **Summary**: imperative mood ("add", not "added"), lowercase, no final period, 72 characters at
  most.
- **Body** (optional): what changed and why, wrapped at 72 characters.
- **One logical change per commit.**

### Types

| Type       | Use it for                                                 |
| ---------- | ---------------------------------------------------------- |
| `feat`     | A new feature.                                             |
| `fix`      | A bug fix.                                                 |
| `docs`     | Documentation only.                                        |
| `style`    | Code formatting only, with no change in behavior.          |
| `refactor` | A code change that neither fixes a bug nor adds a feature. |
| `perf`     | A performance improvement.                                 |
| `test`     | Adding or updating tests.                                  |
| `build`    | Build system, packaging or dependencies.                   |
| `ci`       | Continuous integration.                                    |
| `chore`    | Other maintenance tasks.                                   |
| `revert`   | Reverting a previous commit.                               |

### Scopes

The scope is optional. Use `desktop` for the application, `plugin-api` for the plugin API package
and `deps` for dependency updates. Leave it out for changes to the whole repository.

### Breaking changes

Add `!` after the type or scope, and describe the change in a `BREAKING CHANGE:` footer:

```
feat(plugin-api)!: rename "themes" to "colorThemes" in the manifest

BREAKING CHANGE: plugins must now declare their themes under
"contributes.colorThemes".
```

### Examples

```
feat(desktop): open a PowerShell terminal in the main window
fix(desktop): keep the window size after a restart
docs: explain how to install ConsolX
build(deps): update Electron to 44.5.0
```

## Branches, versions and pull requests

- `main` must always build and pass all checks.
- Work in a branch named after the change, for example `feat/split-panes` or `fix/tab-title`.
- Versions follow [Semantic Versioning](https://semver.org/) and are published as Git tags, such as
  `v0.1.0`.
- Before opening a pull request, run:

  ```bash
  npm run format:check
  npm run lint
  npm run typecheck
  npm test
  ```

- The pull request title follows the same format as a commit message.

## Releasing a version (maintainers)

Pushing a version tag starts the Release workflow: it builds the Windows installer and publishes it
as a GitHub Release. Installed apps find the new version at their next start, download it, and
install it when they quit.

```bash
# 1. Set the new version of the app
npm version 0.2.0 --workspace @consolx/desktop --no-git-tag-version

# 2. Commit it
git commit -s -am "chore(release): 0.2.0"

# 3. Tag the commit and push both
git tag v0.2.0
git push origin main v0.2.0
```

The tag must match the app version, otherwise the workflow stops before publishing.
