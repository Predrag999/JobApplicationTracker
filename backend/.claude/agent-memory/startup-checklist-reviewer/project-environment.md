---
name: project-environment
description: Verified runtime versions and port assignments for this machine as of 2026-06-11
metadata:
  type: project
---

Java: OpenJDK 25.0.3 (Temurin-25.0.3+9) — satisfies the JDK 21+ requirement. `java -version` triggers a PowerShell NativeCommandError due to stderr output; this is cosmetic and does not indicate a real failure.

Node.js: v26.2.0 — satisfies 18+ requirement.
npm: 11.13.0 — satisfies 9+ requirement.

PostgreSQL: Runs on port 5433 (non-default). Database name: `job_tracker`. Username: `postgres`, password: `postgres`.
Backend datasource URL confirmed: `jdbc:postgresql://localhost:5433/job_tracker`

Backend port: 8080
Frontend port: 5173

**Why:** Non-default PostgreSQL port (5433 vs 5432) is the most likely misconfiguration trap for newcomers on this machine.
**How to apply:** Always verify port 5433 is open before declaring PostgreSQL ready.
