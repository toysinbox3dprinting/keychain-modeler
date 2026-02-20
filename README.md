# Keychain Modeler

Web-based 3D keychain designer for generating OBJ/STL/X3G outputs.

## What this repo contains
- `src/ui/`: React UI pages, editor components, styles, and UI assets/fonts.
- `src/core/`: modeling logic, geometry primitives/adapters, and vendored CSG.
- `src/infra/`: external integrations (slicing/convert API client and config).
- `src/app/`: app bootstrap, router, and app-level config.
- `scripts/`: build and artifact packaging scripts.
- `docs/`: architecture and build-target documentation.

## Development
- `npm ci`: install dependencies exactly from `package-lock.json` (recommended for release builds).
- `npm run dev`: run local Vite development server.
- `npm start`: alias of `npm run dev`.
- `npm run dev:web`: explicit web dev server command.
- `npm run dev:desktop`: run Vite + Electron desktop app in development mode.
- `npm test`: run test runner.
- `npm run typecheck`: run TypeScript checks.
- `npm run typecheck:desktop`: run Electron TypeScript checks.
- `npm run lint`: run lint checks.
- `npm run generate:adapters`: regenerate ESM adapter bundles for vendored CSG/earcut.
- `npm run verify:adapters`: fail if committed adapter bundles are stale.

## Build targets
- `npm run build:web`
  - Standard web build to `build/`.
- `npm run build:prod`
  - Production web build with deploy config.
  - Reads `APP_BASE_PATH` (or `REACT_APP_BASE_PATH`) for router/public path.
- `npm run build:artifact`
  - Produces deploy artifact (`client.zip`) from production output.
- `npm run build:desktop`
  - Builds Electron renderer (`build/`) and Electron main/preload (`dist-electron/`).
- `npm run pack:desktop:macos`
  - Produces unpacked macOS desktop app output with `electron-builder`.
- `npm run pack:desktop:windows`
  - Produces unpacked Windows desktop app output with `electron-builder`.
- `npm run build:desktop:macos`
  - Produces unsigned macOS desktop installers (`dmg`, `zip`).
- `npm run build:desktop:windows`
  - Produces unsigned Windows desktop installer (`nsis`).

Desktop packaging is explicit per target OS; there is no auto-detect command.
Build macOS targets on macOS and Windows targets on Windows for reliable tooling/signing behavior.

## Environment variables
- `APP_BASE_PATH` or `REACT_APP_BASE_PATH` (example: `/hellomunchkins/client`)
- `REACT_APP_ENABLE_BASE_PATH_IN_DEV=true` (optional; keeps base path enabled during local dev)
- `REACT_APP_API_BASE_URL` (default: `https://slicing-www.asunder.co`)
- `REACT_APP_WS_BASE_URL` (default: `wss://slicing-wss.asunder.co`)
- `BUILD_ARTIFACT_NAME` (default: `client.zip`)
- `BUILD_ARTIFACT_DIR_NAME` (default: `client`)

## Example production build
```bash
APP_BASE_PATH=/hellomunchkins/client npm run build:prod
APP_BASE_PATH=/hellomunchkins/client npm run build:artifact
```

## Adapter bundles
- Runtime imports `src/core/vendor/csg/dist/*.esm.js` and `src/core/geometry/earcut.esm.js`.
- These are generated from:
  - `src/core/vendor/csg/api.js`
  - `src/core/vendor/csg/csg.js`
  - `src/core/geometry/earcut.js`
- Regenerate after changes to those source files:
```bash
npm run generate:adapters
npm run verify:adapters
```

## Electron
- Electron sources live in `electron/` (`main.ts`, `preload.ts`, `ipc/*`).
- Renderer remains the existing Vite React app (`src/*`).
- Desktop file export uses IPC (`file:save`) through a preload bridge (`window.desktop`).
- Desktop save failures fall back to browser-style download behavior.
- Release builds are currently unsigned; signing/notarization is a separate release step.
