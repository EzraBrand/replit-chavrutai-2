# Project Review — August 1, 2026

A full health check after four major changes landed in quick succession: the pnpm
monorepo migration, the ChavrutAI → Bekiut rebrand, the ParchmentScholar redesign,
and the new Replit workspace (tasks/board) workflow.

**TL;DR:** The foundation is solid — the big migrations actually completed, type
checks pass, and the shared-code duplication trap is fixed. The recurring "technical
issues" are mostly operational friction (stale processes after task merges, port
collisions) plus a small backlog of known-failing tests and dead code. Nothing
structural is broken.

---

## The Good

**1. The monorepo consolidation genuinely worked.**
The dangerous duplication between the web app and API server (text-processing rules,
number parser, term replacements — 13 duplicated modules) is gone. Both services now
import from single-source packages: `lib/text-processing` and `lib/shared-data`.
A one-sided edit can no longer silently break production. This was the biggest
structural risk in the codebase and it's resolved.

**2. Type safety is green across the board.**
`pnpm run typecheck` passes for all packages (libs + 3 artifacts + scripts) with
project references set up correctly. That's a strong signal the migration didn't
leave hidden breakage.

**3. The rebrand is complete where it matters.**
Domain (`bekiut.com` canonical everywhere), 301 redirects from chavrutai.com (verified
live, homepage + deep links), SEO/OG tags, sitemap, robots.txt, GitHub links, contact
email, README. The remaining "ChavrutAI" references are *intentional*: the Twitter
handle (@ChavrutAI still owns the account), the legacy-redirect host allowlist, and
historical changelog/blog entries.

**4. Both apps run and serve correctly.**
Web app returns 200, API server builds and responds. The production deployment is
serving traffic steadily (deployment logs show healthy Sefaria fetches and sub-second
response times, no errors).

---

## The Bad

**1. Stale-process port collisions after task merges.** *(the most likely source of
the "issues keep cropping up" feeling)*
Today both dev workflows were down: `EADDRINUSE` on ports 8080 and 23737 — orphaned
processes from before the task merges kept the ports, so the restarted workflows
crashed on boot. I killed the stale processes and both are running again. This is a
recurring hazard of the merge → post-merge-setup → restart cycle: the restart doesn't
always wait for the old process to release its port.
→ *Suggested dev:* make the API server retry binding briefly on EADDRINUSE (or add a
kill-stale-listener step to `scripts/post-merge.sh`). Low effort, removes the most
common failure mode.

**2. Three known-failing tests (pre-existing).**
`artifacts/chavrutai/src/lib/text-processing.test.ts`: 103 pass, 3 fail — two Hebrew
quote-splitting expectations and one case-sensitivity check (`RABBI` → `R'`). These
predate the recent changes (task #30 to fix them was cancelled). Failing tests that
everyone learns to ignore eventually mask real regressions.
→ *Suggested dev:* either fix the 3 expectations or explicitly mark them as known-
broken (`it.fails`/`it.skip` with a comment), so a *new* failure is visible again.

**3. Tests are hard to run and not wired into anything.**
- Running vitest requires manually setting `PORT` and `BASE_PATH` env vars because
  `vite.config.ts` throws without them — nobody will run tests that need incantations.
- There's no `test` script in any package.json and no root-level test command, so
  `pnpm -r test` silently runs nothing.
→ *Suggested dev:* add a `test` script to `artifacts/chavrutai` (with the env defaults
baked in, e.g. a separate `vitest.config.ts` that doesn't require PORT), and a root
`pnpm test` that runs all suites. Then register it as a validation step. (Note from
project memory: registering validations previously rewrote the Run button workflow —
verify Run still starts both services afterward.)

**4. Test coverage is thin for how much logic exists.**
One test file covers the text-processing pipeline; the number parser, BDB abbreviation
expansion, Yerushalmi/Mishnah tweaks, and SEO/SSR server have no tests despite being
the most frequently edited (and most frequently bug-reported) areas.
→ *Suggested dev:* when a display bug is fixed (like yesterday's "ten thousands" →
"10,000s"), add the case to a regression suite in `lib/text-processing`. Cheap habit,
compounds fast.

---

## The Ugly

**1. Dead directory: `artifacts/chavrutai-overview/`.**
Contains only `node_modules`, an empty `src/data`, and a stale `.tsbuildinfo`. Not in
`pnpm-workspace.yaml`, referenced nowhere. Leftover from some earlier task.
→ *Suggested dev:* delete it.

**2. Unused component: `src/components/layout/header-navigation.tsx`.**
No importers since the redesign standardized on `PageShell`. Dead code that will
confuse the next redesign pass.
→ *Suggested dev:* delete (it's in git history if ever needed).

**3. `.replit` port mappings look stale.**
Mappings exist for local ports 5174→3002 and 23636→3000, which don't match what the
artifacts actually bind (they use the assigned `PORT` env). Harmless but misleading
when debugging "port in use" issues — which is exactly the failure we keep hitting.
→ *Suggested dev:* prune unused port mappings next time `.replit` is touched (via the
artifact tooling, not hand-edits).

**4. Near-duplicate ordinal logic still exists.**
`artifacts/api-server/src/lib/bible-text-processing.ts` and the web app's
`src/lib/text-processing.ts` both import the shared package but each keeps local
ordinal/number glue. It's Bible-specific vs. Talmud-specific so it's *defensible*,
but it's the same pattern that caused the original drift bug.
→ *Suggested dev:* low priority; if a Bible ordinal bug ever gets fixed in one place,
move `convertOrdinals` into `lib/text-processing` at that moment.

---

## Suggested Development Priorities

| # | Item | Effort | Payoff |
|---|------|--------|--------|
| 1 | Port-retry / stale-process cleanup in post-merge | Small | Kills the most common "app is down in dev" failure |
| 2 | Make tests runnable with one command (`pnpm test`) + wire as validation | Small | Every future task merge gets checked automatically |
| 3 | Fix or explicitly mark the 3 failing tests | Small | Restores signal — a red test means something again |
| 4 | Delete dead code (`chavrutai-overview/`, `header-navigation.tsx`) | Trivial | Less confusion for future work |
| 5 | Regression-test habit for text-processing fixes | Ongoing | The most bug-reported area gains a safety net |
| 6 | Consolidate Bible ordinal logic into `lib/text-processing` | Medium | Closes the last drift-shaped hole |

Items 1–4 together are roughly one short task's worth of work.

---

## Notes on the Replit workspace changes (tasks/board)

Not a code issue, but relevant to why things felt bumpy: several recent incidents were
merge-cycle artifacts, not bugs — overlapping tasks (#27/#28/#29/#31 partly redid each
other's work: one added a drift-check script, the next removed it in favor of full
consolidation), and stale processes after merges. Two habits that help:
- Sequence related tasks with explicit dependencies instead of running them in
  parallel when they touch the same files.
- After a task merge, if the preview is down, the first suspect is a port collision —
  a workflow restart (or asking me) fixes it in seconds.
