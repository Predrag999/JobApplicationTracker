---
name: project-startup-state
description: Observed startup patterns and recurring pass/fail history across sessions
metadata:
  type: project
---

## Session: 2026-06-11

All 6 Getting Started points passed on this run. Both servers were already running when checked — no manual start was required.

Smoke test results:
- `GET /api/applications` returned HTTP 200 with 1 application record (SoftUni / Software Engineer, APPLIED, 2026-06-11).
- `GET /api/stats` returned HTTP 200: total=1, activeCount=1, offerCount=0, rejectedCount=0.

Frontend `node_modules` was present — `npm install` not needed.

**Recurring notes:**
- Both servers tend to already be running between sessions on this machine.
- PostgreSQL consistently up on port 5433.
- `java -version` always triggers a PowerShell NativeCommandError (stderr redirect artefact) — not a real error.

**How to apply:** On future runs, probe both ports first before deciding whether to launch processes.
