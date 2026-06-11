---
name: project-startup-state
description: Observed startup patterns and recurring pass/fail history across sessions
metadata:
  type: project
---

## Session: 2026-06-11 (Run 1)

All 6 Getting Started points passed on this run. Both servers were already running when checked — no manual start was required.

Smoke test results:
- `GET /api/applications` returned HTTP 200 with 1 application record (SoftUni / Software Engineer, APPLIED, 2026-06-11).
- `GET /api/stats` returned HTTP 200: total=1, activeCount=1, offerCount=0, rejectedCount=0.

Frontend `node_modules` was present — `npm install` not needed.

## Session: 2026-06-11 (Run 2)

All 6 Getting Started points passed again. All three services still running from previous session:
- PostgreSQL (PID 7784, port 5433) — up, `job_tracker` DB confirmed with all 3 tables (job_applications, notes, attachments).
- Backend Java process (PID 10432, port 8080) — up.
- Frontend Node process (PID 13092, port 5173) — up.

Runtime versions confirmed unchanged: Java 25.0.3, Node v26.2.0, npm 11.13.0.
application.properties: datasource URL `jdbc:postgresql://localhost:5433/job_tracker`, server.port=8080 — correctly configured.
Frontend `node_modules` present — `npm install` not needed.

**Recurring notes:**
- Both servers tend to already be running between sessions on this machine.
- PostgreSQL consistently up on port 5433.
- `java -version` always triggers a PowerShell NativeCommandError (stderr redirect artefact) — not a real error.
- All 3 Hibernate-managed tables (job_applications, notes, attachments) confirmed present in job_tracker DB.

**How to apply:** On future runs, probe both ports first before deciding whether to launch processes.
