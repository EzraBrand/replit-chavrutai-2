---
name: Validation commands can hijack the Run button
description: Registering a validation command may rewrite .replit's Project run-button workflow
---
Registering a validation command (setValidationCommand) can add a `Project` workflow to `.replit` that ONLY runs the validation and sets `runButton = "Project"`, breaking the normal Run action.

**Why:** Happened when adding the `shared-drift` validation (Aug 2026); completion review rejected twice until fixed.

**How to apply:** After registering any validation command, check `.replit` — the Run button's `Project` workflow must still start the artifact services (`workflow.run` on "artifacts/chavrutai: web" and "artifacts/api-server: API Server") in parallel, with the validation workflow kept separate under `isValidation = true`. Edit via temp file + `verifyAndReplaceDotReplit`.
