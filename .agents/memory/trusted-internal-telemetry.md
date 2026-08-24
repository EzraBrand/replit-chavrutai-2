---
name: Trusted internal telemetry
description: How to distinguish internal server traffic from public bot traffic without trusting spoofable headers.
---

Internal SSR and proxy traffic must be authenticated with a short-lived signature over the request identity. A recognizable user-agent is useful for debugging but is not a trust signal; unsigned lookalikes belong in the public bot bucket.

**Why:** Public endpoints accept caller-controlled headers. User-agent-only attribution lets any external caller contaminate internal traffic measurements and makes cost analysis unreliable.

**How to apply:** Whenever a new internal server-to-server request needs its own telemetry class, sign its kind, timestamp, method, and normalized path with the shared server secret, enforce a short freshness window, and verify with a constant-time comparison.