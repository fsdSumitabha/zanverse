# Coding Style

## Formatting
- Indent with 4 spaces. No tabs.
- No semicolons. Double quotes.
- Always wrap arrow params: `(x) => x`.
- Separate logical groups with one blank line.

## Naming
- Constants: UPPER_SNAKE_CASE, at the top of the file after imports.
- Types, interfaces, components, screens: PascalCase.
- Functions and variables: camelCase, starting with a verb (get, create, resolve, handle).
- Booleans start with is, has or was.
- Screen files end with `Screen` (`LeadsListScreen.tsx`); hooks start with `use`.

## Constants
- Every status, type and role is a number from `src/constants`, copied from the web app unchanged.
- Never store or compare text labels. Labels and colours live in the `_META` maps.
- Codes step by 10 inside a family; each family owns its range. Never renumber or reuse a code.
- No raw numbers in logic. Use `LEAD_STATUS.NEW`, `ENTITY_TYPE.LEAD`, `ROLE_GROUP.X`.

## Functions
- Use `function` declarations. Arrow functions only inline.
- Early returns first.
- More than 3 parameters: pass one typed object.
- Number the steps in long flows: `// 1. Verify token`.
- A helper used by one file stays in that file. Move it to `src/lib/` when a second file needs it.
- One main export per file. Split files over 250 lines.

## Types
- `interface` for objects, `type` for unions.
- Shared API types live in `src/types`, one file per entity.
- No `any`.

## Imports
- `@/` for other folders, `./` for the same folder. Never `../`.
- Named exports. Default export only for components and screens.

## React Native
- Styling is NativeWind `className`, with the same Tailwind strings the web uses. Reach for `StyleSheet` only where a
  class cannot express it (shadows, transforms, measured layout).
- `View`/`Text`/`Pressable` — every string sits inside a `<Text>`.
- Lists are `FlatList` with `keyExtractor`, `ListEmptyComponent` and pull-to-refresh. Never `.map()` a long list.
- Touch targets are at least 44dp. Hover states become pressed states.
- Respect the safe area: `useSafeAreaInsets()`, and floating buttons add the tab bar height.
- Every screen handles four states: loading, empty, error, content.
- Server calls go through `src/api/client.ts`. Screens never call `fetch` directly.

## Comments
- Short JSDoc on exported functions: what and why.
