---
name: Git index mutations blocked for the agent
description: The agent cannot untrack/stage/reset files via git; index-mutating git commands are hard-blocked even inside an assigned project task.
---

# Git index mutations are blocked for the agent

Any git command that acquires `.git/index.lock` (e.g. `git rm`, `git rm --cached`,
`git update-index --force-remove`, `git reset`, `git restore`, `git checkout <path>`,
`git commit`) fails with: *"Destructive git operations are not allowed in the main
agent. Use the project_tasks skill..."* — including from inside an **assigned project
task**. The block is at the lock level, not just the bash wrapper.

**Implication:** The agent cannot untrack already-committed files (the classic
`git rm -r --cached <path>` after adding to `.gitignore`). Adding a path to
`.gitignore` only stops *future untracked* files from being added; files already in
the index stay tracked and keep getting committed. Intermediate "Saved progress"
checkpoint commits do NOT drop gitignored-but-tracked files either.

**Why:** Replit guards destructive git so the agent can't corrupt history; the
sanctioned path is the privileged commit the platform makes at task completion / merge.

**How to apply:** To untrack files, set up the working tree + `.gitignore` correctly
and rely on the task-completion commit, or hand the exact command to the user to run
themselves (`git rm -r --cached <path> && git commit`). Do NOT try to bypass the guard
via another runtime (child_process, etc.) — that defeats the safety mechanism. Removing
files from prior commits already on a remote requires a separate history-rewrite, which
is out of scope for normal work.
