This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Important

- Do not use `npm install` or `pnpm install` for installing any packages. Only use `npx expo install` to install a dependency.
- For dev dependencies use `npx expo install <pkg> -- -D` (pnpm rejects `--dev`).

## Linting and formatting

ESLint (`eslint-config-expo` + Prettier) and Prettier (with `prettier-plugin-organize-imports` and `prettier-plugin-tailwindcss` for NativeWind classes) are configured. Run both checks before finishing any code change; both must pass.

- `pnpm lint` — ESLint; also reports Prettier formatting issues as errors.
- `pnpm lint:fix` — ESLint with auto-fix.
- `pnpm format` — format all files with Prettier.
- `pnpm format:check` — verify formatting without writing.
- `pnpm typecheck` — TypeScript, no emit. Must pass too.
- CI (`.github/workflows/ci.yml`) runs `lint`, `format:check`, `typecheck` and the unit tests on every PR and push to `master`.
- Use `pnpm exec prettier <args>` for one-off Prettier runs, not `npx prettier` (`npx` always requires approval in this repo).

## Development Rules

- Performance is very important in this app as this will be used on low end android devices. Please make sure to keep performance as top priority in every iteration.
- Every UI code must exist in src folder only. Which includes Components files, Utils, constants, types, hooks etc.
- folder src/components/ui is for reusable components.
- If a component grows more than 300 lines, create a folder for the component and break the component in smaller components, or move out util files in `<folder>/utils`, types in `<folder>/utils` types in `<folder>/types`
- Please use tailwind css. Use React native StyleSheet only places where NativeWind does not provide support.
- All pages and modals must be wrapped under SafeAreaView, directly or indirectly.

## Testing rules

- tests should exists adjacent to files
- tests should focus on covering important flows and edge cases rather than number of lines and branches.
- if a bug is reported, after fixing it, a test must be added so that it does not break again.
