# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-26
**Commit:** (current working tree)
**Branch:** (current branch)

## OVERVIEW

Copicseal template builder. Vue 3 + Vite + TypeScript SPA for managing template presets. Generates downloadable zip bundles for Copicseal (an image sealing tool).

## STRUCTURE

```
./
├── index.html          # SPA entry
├── src/
│   ├── main.ts      # Vue bootstrap
│   ├── App.vue     # Root component
│   ├── templates/  # Template data (groups with manifest.json)
│   ├── preview/    # Preview panel UI components
│   └── utils/     # Build/render utilities
└── build/         # Build scripts (build-components, build-zip, create-template)
```

## WHERE TO LOOK

| Task            | Location         | Notes                                |
| --------------- | ---------------- | ------------------------------------ |
| Template groups | `src/templates/` | manifest.json + group folders        |
| Preview UI      | `src/preview/`   | Vue components                       |
| Build logic     | `build/*.js`     | Node scripts                         |
| Utils           | `src/utils/`     | render.ts, template.ts, validator.ts |

## CONVENTIONS

- **Vue 3** composition API + `<script setup>`
- **TypeScript** strict mode
- **ESLint**: @antfu/eslint-config
- **Template manifest**: `src/templates/manifest.json` for library-level config, per-group manifest in group folders

## ANTI-PATTERNS (THIS PROJECT)

- No explicit anti-patterns in comments found during scan
- `src/templates/` contains both Vue components AND manifest.json (dual responsibility)

## COMMANDS

```bash
pnpm dev      # Start Vite dev server
pnpm build    # Build Vue app
pnpm lint     # Run ESLint (ALWAYS run before commit)
pnpm build:tpl   # Build templates only
pnpm build:zip   # Create zip bundles
pnpm create-template  # Scaffold new template
```

## NOTES

- Template library lives at `src/templates/` - unusual for SPA (typically app code only)
- Groups: group1 (基础), group2 (高级), group3 (水印)
- Output: dist/ with manifest.json + template JSON bundles
- Template JSON format: `{id}.json` with fields: id, name, version, description, author, license, code, style, signature

## WORKFLOW

1. Make code changes
2. Run `npm run lint` to check for errors
3. Do NOT auto-commit - wait for user confirmation
4. User confirms → then commit
