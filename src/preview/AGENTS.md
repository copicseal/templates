## OVERVIEW

Preview UI components for template preview and settings management.

## WHERE TO LOOK

- Sidebar.vue - Main sidebar navigation component
- PreviewPanel.vue - Central preview display area that renders mock content
- PreviewSettings.vue - UI for adjusting preview options
- PropsPanel.vue - Properties editor for preview elements
- co-render.vue - Rendering helper that composes the preview output
- SettingsModal.vue - Modal for global preview settings
- EmptyState.vue - Placeholder UI shown when no preview is available

## CONVENTIONS

- Vue 3 composition API + `<script setup>` + TypeScript
- Define props via `defineProps` and emit events with `defineEmits`
- Use `<style scoped>` to limit CSS leakage
- Do not mutate props; emit events to request changes
- Keep business logic out of templates; move to the script section

## ANTI-PATTERNS

- Avoid coupling UI components directly to data-layer services
- Do not duplicate shared state across components
- Avoid mutating props; rely on explicit emits
- Refrain from heavy computations inside template literals; debounce or memoize in script
