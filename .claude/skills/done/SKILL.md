---
name: done
description: Finish a piece of work — fix lint and formatting, update tests for modified components, type check, and run the unit tests until they pass. Runs each task in a subagent and keeps only their short reports in the main conversation.
argument-hint: '[base-ref]'
disable-model-invocation: true
model: inherit
---

# Done

Run the completion checklist for the current work. You are the coordinator: delegate every task to a subagent with the Agent tool and act only on their reports. Do not run lint, format or tests yourself, and do not read their raw output — that is what keeps this conversation clean.

## Scope

The work being finished is:

- Uncommitted changes and untracked files (`git status --porcelain`).
- If a base ref was given (`$ARGUMENTS`), also everything committed since it: `git diff --name-only $ARGUMENTS...HEAD`.

Collect this file list once and pass it to each subagent. If it is empty, say there is nothing to finish and stop.

## Subagent rules

Include these rules in every subagent prompt:

- Do not set a `model`; subagents inherit the current model.
- Read `AGENTS.md` and `.claude/skills/review/checklist.md` first. Every change you make must meet that checklist — it is the single source for code, type and test conventions.
- Never use `git reset`, `git checkout`, `git stash` or `git commit`.
- Change only the files your task owns (listed below).
- End with a report of at most 15 lines in exactly this shape, and nothing else:

  ```
  STATUS: PASS | FIXED | FAIL | SKIPPED
  CHANGED: <files you edited, or "none">
  UNRESOLVED: <each remaining problem as file:line — message, or "none">
  NOTES: <one line, only if needed>
  ```

## Phase 1 — in parallel

Spawn both subagents in a single message.

**A. Lint and format** — owns the in-scope files that are not test files.

1. Run `pnpm exec prettier --write <files>` and `pnpm exec eslint --fix <files>` on its files.
2. Fix remaining errors by hand, restructuring the code as checklist §2 requires.
3. Re-run `pnpm exec eslint <files>` until clean.

**B. Update tests** — owns test files (`*.test.ts`, `*.test.tsx`, `__tests__/**`).

1. From the in-scope files, find components and logic that were added or modified under `src/`.
2. For each one, create or update its test following checklist §5, using `src/components/ui/bottom-sheet/` as the reference.
3. Run `pnpm exec prettier --write` and `pnpm exec eslint --fix` on the test files it touched.

## Phase 2 — in parallel, after both Phase 1 reports are in

Spawn both subagents in a single message.

**C. Run unit tests** — owns test files.

1. Run `pnpm exec jest --ci` (pnpm rejects `pnpm test --ci`; never use `test:watch`). The suite takes over a minute — wait for it.
2. For each failure, decide whether the test is outdated or the code is wrong. Fix outdated tests. Do not edit source files: list a source bug under UNRESOLVED with what the intended behaviour appears to be.
3. Re-run until everything passes, or until the only failures left are UNRESOLVED ones.
4. Run `pnpm exec prettier --write` and `pnpm exec eslint --fix` on the test files it touched.

**D. Type check** — owns the in-scope files that are not test files.

1. Run `pnpm exec tsc --noEmit` (it checks the whole project).
2. Fix type errors in its files as checklist §3 requires.
3. List type errors in test files or out-of-scope files under UNRESOLVED instead of fixing them.
4. Re-run until clean, then run `pnpm exec prettier --write` and `pnpm exec eslint --fix` on the files it touched.

## Phase 3 — resolve and verify

1. If any report has UNRESOLVED items, spawn one follow-up subagent with the same rules, give it only those items, and let it own the files they name. Fix a source bug only when the intended behaviour is clear; otherwise leave it for the user.
2. Then spawn a verification subagent that changes nothing. It runs the four checks in checklist §6 and reports `PASS`, or `FAIL` with each problem under UNRESOLVED.
3. If verification fails, repeat steps 1–2 once more. Stop after two rounds.
4. Never mark the work done while verification reports `FAIL`.

## Final summary

Reply to the user with one short table: task, status, files changed. Below it, list anything still unresolved and anything skipped, with the reason. Nothing else.
