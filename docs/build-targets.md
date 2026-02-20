# Build Targets

Prerequisite for reproducible release builds:
```bash
npm ci
```

## `build:web`
Purpose: produce a standard static web build for local/prod hosting.

Command:
```bash
npm run build:web
```

Output:
- `build/`

## `build:prod`
Purpose: produce a production-configured web build.

Command:
```bash
APP_BASE_PATH=/hellomunchkins/client npm run build:prod
```

Config behavior:
- Sets `REACT_APP_BASE_PATH` for router basename and Vite `base`.
- Normalizes base path (`/x/y` style input, emitted assets use `/x/y/`).

Output:
- `build/`

## `build:artifact`
Purpose: package production output as deliverable artifact.

Command:
```bash
APP_BASE_PATH=/hellomunchkins/client npm run build:artifact
```

Output:
- `client.zip`
- archive root folder name defaults to `client`.

## `build:desktop`
Purpose: build desktop runtime artifacts for Electron.

Command:
```bash
npm run build:desktop
```

Output:
- `build/` (desktop renderer assets, Vite base `./`)
- `dist-electron/` (Electron main/preload bundles)
- This command is platform-neutral compile only; packaging is explicit by target OS.

## `pack:desktop:macos`
Purpose: package unpacked macOS desktop app output.

Command:
```bash
npm run pack:desktop:macos
```

Output:
- unpacked macOS app files under `release/`

## `pack:desktop:windows`
Purpose: package unpacked Windows desktop app output.

Command:
```bash
npm run pack:desktop:windows
```

Output:
- unpacked Windows app files under `release/`

## `build:desktop:macos`
Purpose: produce installable macOS desktop artifacts.

Command:
```bash
npm run build:desktop:macos
```

Output:
- macOS: unsigned `dmg` and `zip`

## `build:desktop:windows`
Purpose: produce installable Windows desktop artifacts.

Command:
```bash
npm run build:desktop:windows
```

Output:
- Windows: unsigned `nsis`

## Target selection policy
- Desktop packaging commands are explicit per OS target (`macos` or `windows`); no auto-detect packaging command exists.
- For reliable signing/tooling behavior, run macOS packaging on macOS and Windows packaging on Windows.
- Artifacts are unsigned by default; add platform-specific signing/notarization in your release pipeline.

## Non-goals
- No build command modifies `package.json`, router source files, or other tracked source files.

## Runtime notes
- Dev server defaults to root routing (`/`) even when `REACT_APP_BASE_PATH` is set.
- Enable base path during dev only when needed via `REACT_APP_ENABLE_BASE_PATH_IN_DEV=true`.
- Electron desktop builds force relative base (`./`) so assets resolve under `file://`.

## Adapter maintenance
- The app runtime uses generated ESM adapters for vendored CSG/earcut.
- Regenerate and verify adapters after modifying those sources:
```bash
npm run generate:adapters
npm run verify:adapters
```
