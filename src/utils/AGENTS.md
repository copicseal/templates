## OVERVIEW

Distinguishing utilities for rendering templates, managing template data, packaging bundles, and validating templates.

## WHERE TO LOOK

- render.ts — Template rendering logic used by the build/render pipeline.
- template.ts — Core template management primitives and data structures.
- template-local.ts — Local template handling and path resolution.
- template-zip.ts — ZIP bundle creation for distribution.
- validator.ts — Validation rules and checks to ensure templates meet constraints.
- sandbox.ts — Sandbox utilities for isolated execution and testing.

## CONVENTIONS

- TypeScript with strict mode and ES module syntax.
- Named exports preferred; avoid large default exports to keep usage explicit.
- Functions have explicit input/output contracts via TypeScript types and JSDoc where helpful.
- No heavy side effects at module scope; keep functions pure, or clearly documented if side effects are intentional.

## ANTI-PATTERNS

- Don't mutate module-scoped state across calls; prefer pure functions with clear inputs and outputs.
- Avoid synchronous long-running I/O in hot paths; defer to asynchronous operations and proper await/Promise usage.
- Don't bypass type checks or skip validations; failing inputs should throw or be handled gracefully.
- Refrain from coupling rendering logic to filesystem specifics; keep such concerns in dedicated adapters.
