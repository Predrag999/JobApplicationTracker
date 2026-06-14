# Job Application Tracker

A personal, full-stack web application for tracking job applications through every stage of the hiring process. Built as a SoftUni Academy course project.

---

## Features

- **Application management** — create, view, edit, and delete applications; track company, role, URL, dates, and status
- **Status workflow** — Applied → Phone Screen → Interview → Technical Test → Offer → Rejected / Withdrawn
- **Search & filter** — global command-palette search (Ctrl+K) with live results and status filter chips
- **Notes** — multiple timestamped notes per application with **AI generation** (scrapes the job URL and calls Claude Haiku to produce a 2–3 sentence summary, pre-filled for review)
- **URL Autofill** — paste a job listing URL to auto-extract company name and job title (JSON-LD → OpenGraph → CSS selectors → Playwright headless fallback for JS-rendered pages; detects bot protection and prompts manual entry)
- **File attachments** — upload resumes, cover letters, etc. (10 MB limit); stored on the local filesystem
- **Dashboard** — overview cards and a status breakdown pie chart
- **Theme & language** — light/dark toggle and English/Bulgarian switch, both persisted in `localStorage`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.3.4, Spring Data JPA, PostgreSQL |
| Build | Maven wrapper |
| Frontend | React 18, TypeScript, Vite 5 |
| Styling | Tailwind CSS v4 |
| Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| i18n | i18next + react-i18next |
| Charts | Recharts |

---

## Getting Started

### Prerequisites
- Java 21+, Maven (wrapper included)
- PostgreSQL 15+
- Node.js 18+, npm 9+

### 1. Clone
```bash
git clone <your-repo-url>
cd JobApplicationTracker
```

### 2. Create the database
```sql
CREATE DATABASE job_tracker;
```

### 3. Configure the backend

Edit `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5433/job_tracker
spring.datasource.username=postgres
spring.datasource.password=your_password

app.file.upload-dir=./uploads
server.port=8080

spring.main.lazy-initialization=true
```

### 4. Set the Anthropic API key *(required for AI note generation)*

```powershell
# Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
```
```bash
# macOS / Linux
export ANTHROPIC_API_KEY="sk-ant-..."
```

> Must be set in the **same terminal session** before starting the backend. Without it, the rest of the app works normally but the **Generate with AI** button returns a "not configured" error.
>
> Get a key at [console.anthropic.com](https://console.anthropic.com/). Each click costs ≈ $0.0003 using Claude Haiku.

### 5. Start the backend
```bash
cd backend
./mvnw spring-boot:run        # macOS / Linux
mvnw.cmd spring-boot:run      # Windows
```
API available at `http://localhost:8080`. Hibernate auto-creates all tables on first run.

### 6. Start the frontend
```bash
cd frontend
npm install
npm run dev
```
App available at `http://localhost:5173`.

---

## API Reference

All endpoints are prefixed with `/api`.

### Applications
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/applications` | List (paginated: `page`, `size`, `sortBy`, `sortDir`, `status`, `search`) |
| `POST` | `/applications` | Create |
| `GET` | `/applications/{id}` | Get one |
| `PUT` | `/applications/{id}` | Update |
| `DELETE` | `/applications/{id}` | Delete (cascades notes & attachments) |
| `GET` | `/applications/autofill?url={url}` | Extract company + title from a job URL |

### Notes
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/applications/{id}/notes` | List notes |
| `POST` | `/applications/{id}/notes` | Add note |
| `DELETE` | `/applications/{id}/notes/{noteId}` | Delete note |
| `POST` | `/applications/{id}/notes/generate` | Generate AI summary (requires `ANTHROPIC_API_KEY`) |

### Attachments
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/applications/{id}/attachments` | List metadata |
| `POST` | `/applications/{id}/attachments` | Upload file (`multipart/form-data`, field: `file`) |
| `GET` | `/attachments/{id}/download` | Download |
| `DELETE` | `/attachments/{id}` | Delete |

### Statistics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stats` | Totals and counts by status |

---

## Known Limitations

- No authentication — single-user local use only.
- Files are stored on the local filesystem; no cloud storage.
- No deadline notifications — deadline date is stored but not acted on.
- No status history — only the current status is tracked.
- Autofill does not work with bot-protected sites (DataDome, Cloudflare challenges). Works best with **[dev.bg](https://dev.bg/)**.
- AI note generation requires a funded Anthropic account (`ANTHROPIC_API_KEY`).
