# Job Application Tracker

A personal, full-stack web application for tracking job applications through every stage of the hiring process. Built as a SoftUni course project.

---

## Features

- **Google login** — sign in with your Google account; all data is scoped to your account and persists across sessions
- **Application management** — create, view, edit, and delete applications; track company, role, URL, dates, and status
- **Status workflow** — Applied → Phone Screen → Interview → Technical Test → Offer → Rejected / Withdrawn
- **Search & filter** — global command-palette search (Ctrl+K) with live results and status filter chips
- **Notes** — multiple timestamped notes per application with **AI generation** (scrapes the job URL and calls Claude Haiku to produce a 2–3 sentence summary, pre-filled for review)
- **URL Autofill** — paste a job listing URL to auto-extract company name and job title (JSON-LD → OpenGraph → CSS selectors → Playwright headless fallback for JS-rendered pages; detects bot protection and prompts manual entry)
- **File attachments** — upload resumes, cover letters, etc. (10 MB limit); stored on the local filesystem
- **Dashboard** — overview cards and a status breakdown pie chart
- **Export data** — download all your applications as a **CSV** or **Excel (.xlsx)** file via the Export Data button
- **Theme & language** — light/dark toggle and English/Bulgarian switch, both persisted in `localStorage`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.3.4, Spring Data JPA, PostgreSQL |
| Auth | Spring Security 6, OAuth2 Client (Google OIDC) |
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
- A Google Cloud project with an OAuth 2.0 Client ID ([instructions below](#google-oauth-setup))

### 1. Clone
```bash
git clone https://github.com/Predrag999/JobApplicationTracker.git
cd JobApplicationTracker
```

### 2. Create the database
```sql
CREATE DATABASE job_tracker;
```

### 3. Configure the backend

Edit `backend/src/main/resources/application.properties` and set your database password:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5433/job_tracker
spring.datasource.username=postgres
spring.datasource.password=your_password
```

Everything else (ports, file storage, OAuth endpoints) is already configured. Do **not** put secrets directly in this file — use environment variables instead (see steps 4 and 5).

### 4. Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID** → Application type: **Web application**
3. Under **Authorized redirect URIs** add exactly:
   ```
   http://localhost:8080/login/oauth2/code/google
   ```
4. Copy the **Client ID** and **Client Secret**

Set them as environment variables in the terminal you will use to start the backend:

```powershell
# Windows PowerShell
$env:GOOGLE_CLIENT_ID     = "your-client-id.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET = "your-client-secret"
```
```bash
# macOS / Linux
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
```

> **Security note:** Never paste credentials into `application.properties` or commit them to version control. The app reads them from environment variables only.

### 5. Set the Anthropic API key *(required for AI note generation)*

```powershell
# Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
```
```bash
# macOS / Linux
export ANTHROPIC_API_KEY="sk-ant-..."
```

> Must be set in the **same terminal session** as the backend. Without it, the rest of the app works normally but the **Generate with AI** button returns a "not configured" error.
>
> Get a key at [console.anthropic.com](https://console.anthropic.com/). Each click costs ≈ $0.0003 using Claude Haiku.

### 6. Start the backend
```bash
cd backend
./mvnw spring-boot:run        # macOS / Linux
mvnw.cmd spring-boot:run      # Windows
```
API available at `http://localhost:8080`. Hibernate auto-creates all tables on first run.

### 7. Start the frontend
```bash
cd frontend
npm install
npm run dev
```
App available at `http://localhost:5173`.

Open the URL, click **Continue with Google**, and sign in. Your applications are stored under your Google account and will be waiting the next time you log in.

---

## API Reference

All endpoints are prefixed with `/api`. All application/notes/attachments/stats endpoints require an active session (cookie set after Google login). Unauthenticated requests receive `401`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/me` | Returns the current user (`id`, `email`, `name`, `pictureUrl`), or `401` if not logged in |
| `POST` | `/auth/logout` | Invalidates the server session and clears the session cookie |

Login is initiated by navigating the browser to `http://localhost:8080/oauth2/authorization/google` (the frontend login button does this automatically).

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
| `GET` | `/stats` | Totals and counts by status for the logged-in user |

---

## Known Limitations

- Files are stored on the local filesystem; no cloud storage.
- No deadline notifications — deadline date is stored but not acted on.
- No status history — only the current status is tracked.
- Autofill does not work with bot-protected sites (DataDome, Cloudflare challenges). Works best with **[dev.bg](https://dev.bg/)**.
- AI note generation requires a funded Anthropic account (`ANTHROPIC_API_KEY`).
