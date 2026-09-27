---
name: review
description: Review the current diff against the project checklist — performance first, then code placement, types, accessibility, tests and the merge checks. Reports findings and changes nothing. Runs each area in a subagent and keeps only their short reports in the main conversation.
argument-hint: '[base-ref]'
disable-model-invocation: true
model: inherit
---

# Review

Review the current work against `.claude/skills/review/checklist.md`. You are the coordinator: delegate every area to a subagent with the Agent tool and act only on their reports. Do not read the diff or run checks yourself — that keeps this conversation clean. Nobody edits files during a review.

## Scope

- Uncommitted changes and untracked files (`git status --porcelain`, `git diff HEAD`).
- If a base ref was given (`$ARGUMENTS`), also everything committed since it (`git diff $ARGUMENTS...HEAD`).

Collect the changed file list once. If it is empty, say there is nothing to review and stop.

## Reviewer rules

Include these rules in every subagent prompt, with the changed file list and base ref:

- Do not set a `model`; subagents inherit the current model.
- Do not edit, create or delete any file, and do not run git commands that change state.
- Read `AGENTS.md` and `.claude/skills/review/checklist.md` first, then read the diff yourself (`git diff HEAD`, plus `git diff <base>...HEAD` if given; read untracked files in full). Read surrounding code and `src/components/ui/bottom-sheet/` when you need the reference pattern.
- Review only what the diff adds or changes. Flag existing code only when the diff makes it worse.
- Report only findings you can point to a line for. If unsure, mark it `question`.
- End with a report of at most 40 lines in exactly this shape, and nothing else:

  ```
  AREA: <area name>
  FINDINGS:
  - [blocker|major|minor|question] file:line — checklist item — problem and why it matters here — suggested fix
  (or "none")
  ```

## Reviewers — all in parallel

Spawn all four subagents in a single message.

1. **Performance** — checklist §1. Any change that adds work on every frame, render or tab visit is at least `major`; UI-thread work moved to JavaScript is a `blocker`.
2. **Structure, types and correctness** — checklist §2 and §3. Also look for plain logic bugs in the changed code.
3. **Accessibility and tests** — checklist §4 and §5. A changed component without a matching test update, or a bug fix without a regression test, is `major`.
4. **Merge checks** — checklist §6. Run the four commands, report each as a finding only if it fails (quote the first error lines, max 5 per command). This subagent reviews no code.

## Verdict

- Merge the four reports, drop duplicates, and order findings by checklist section (performance first), then by severity.
- Verdict is **Changes requested** if there is any `blocker`, any failing merge check, or any `major` performance finding. Otherwise **Approve**, with `major` and `minor` items as follow-ups.

Reply to the user with the verdict on the first line, then the findings grouped by section as `severity — file:line — problem — fix`. Skip empty sections. No praise, no restating the checklist. End by offering to fix the findings.
