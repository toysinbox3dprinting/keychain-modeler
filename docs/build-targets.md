# Build Targets

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

## Non-goals
- No build command modifies `package.json`, router source files, or other tracked source files.

## Runtime notes
- Dev server defaults to root routing (`/`) even when `REACT_APP_BASE_PATH` is set.
- Enable base path during dev only when needed via `REACT_APP_ENABLE_BASE_PATH_IN_DEV=true`.

## Adapter maintenance
- The app runtime uses generated ESM adapters for vendored CSG/earcut.
- Regenerate and verify adapters after modifying those sources:
```bash
npm run generate:adapters
npm run verify:adapters
```
