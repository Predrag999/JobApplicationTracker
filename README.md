# Job Application Tracker

A personal, full-stack web application for tracking job applications through every stage of the hiring process — from initial application to offer or rejection. Built as a SoftUni Academy course project.

---

## Features

### Application Management
- Create, view, edit, and delete job applications
- Track company name, job title, job URL, applied date, and optional deadline
- Status workflow: **Applied → Phone Screen → Interview → Technical Test → Offer → Rejected / Withdrawn**
- Filter applications by status and search by company or role name
- Server-side pagination and sorting

### Notes
- Add multiple timestamped notes per application
- Delete individual notes
- Notes displayed in reverse-chronological order

### File Attachments
- Attach files (resumes, cover letters, etc.) to any application
- Files stored on the local filesystem under `./uploads/`
- Download or delete attachments at any time
- 10 MB file size limit per upload

### Dashboard
- Overview cards: total applications, active, offers, rejected
- Status breakdown pie chart (Recharts)
- Quick list of the 5 most recently added applications

### Search
- Global command-palette search accessible from any page via the search bar or **Ctrl+K** / **Cmd+K**
- Live results as you type — filters by company name or job title
- Status filter chips inside the search overlay (All, Applied, Interview, Offer, etc.)
- Click any result to navigate directly to that application

### Settings & Personalization
- **Theme**: Light / Dark mode toggle — preference persisted in `localStorage`
- **Language**: Switch the entire UI between English, Deutsch, and Bulgarian — preference persisted in `localStorage`
- Settings accessible via the gear icon in the page header

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend language | Java 21 (compiled with Java 25 runtime) |
| Backend framework | Spring Boot 3.3.4 |
| ORM | Spring Data JPA + Hibernate 6.5 |
| Database | PostgreSQL 18 |
| Build tool | Maven (wrapper included) |
| Frontend language | TypeScript |
| Frontend framework | React 18 |
| Build / dev server | Vite 5 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| UI components | Shadcn/UI (inline) |
| Data fetching | TanStack Query v5 |
| HTTP | Native `fetch` (no axios) |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Internationalization | i18next + react-i18next |

---

## Project Structure

```
JobApplicationTracker/
│
├── backend/                              # Spring Boot REST API
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd                   # Maven wrapper
│   └── src/main/
│       ├── java/com/jobtracker/
│       │   ├── JobTrackerApplication.java
│       │   ├── config/
│       │   │   ├── CorsConfig.java       # Allows localhost:5173
│       │   │   └── FileStorageConfig.java
│       │   ├── controller/
│       │   │   ├── ApplicationController.java
│       │   │   ├── NoteController.java
│       │   │   ├── AttachmentController.java
│       │   │   └── StatsController.java
│       │   ├── service/
│       │   │   ├── ApplicationService.java
│       │   │   ├── NoteService.java
│       │   │   ├── AttachmentService.java
│       │   │   └── StatsService.java
│       │   ├── repository/
│       │   │   ├── ApplicationRepository.java
│       │   │   ├── NoteRepository.java
│       │   │   └── AttachmentRepository.java
│       │   ├── entity/
│       │   │   ├── JobApplication.java
│       │   │   ├── Note.java
│       │   │   └── Attachment.java
│       │   ├── dto/
│       │   │   ├── request/   CreateApplicationRequest, UpdateApplicationRequest, CreateNoteRequest
│       │   │   └── response/  ApplicationResponse, NoteResponse, AttachmentResponse, StatsResponse, PagedResponse
│       │   ├── enums/
│       │   │   └── ApplicationStatus.java
│       │   └── exception/
│       │       ├── GlobalExceptionHandler.java
│       │       └── ResourceNotFoundException.java
│       └── resources/
│           └── application.properties
│
└── frontend/                             # React + TypeScript SPA
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    ├── components.json                   # Shadcn/UI config
    ├── public/
    │   └── favicon.svg                   # Briefcase icon favicon
    └── src/
        ├── main.tsx                      # Entry point + all providers
        ├── App.tsx                       # Router + Layout
        ├── index.css                     # Tailwind v4 + CSS variables (light + dark)
        ├── types/index.ts                # Shared TypeScript interfaces
        ├── api/                          # fetch-based API client
        │   ├── client.ts
        │   ├── applications.ts
        │   ├── notes.ts
        │   ├── attachments.ts
        │   └── stats.ts
        ├── hooks/                        # TanStack Query hooks
        │   ├── useApplications.ts
        │   ├── useNotes.ts
        │   ├── useAttachments.ts
        │   └── useStats.ts
        ├── context/
        │   ├── ThemeContext.tsx           # Light/dark theme + localStorage
        │   ├── LanguageContext.tsx        # i18n language selection + localStorage
        │   └── ModalContext.tsx           # Global open/close state for Search & Settings
        ├── i18n/
        │   ├── index.ts                  # i18next initialisation
        │   └── locales/
        │       ├── en.ts                 # English translations
        │       ├── de.ts                 # German translations
        │       └── bg.ts                 # Bulgarian translations
        ├── components/
        │   ├── Layout.tsx                # Sidebar nav + Ctrl+K handler
        │   ├── ThemeToggle.tsx           # Light/dark toggle button (sidebar footer)
        │   ├── StatusBadge.tsx           # Color-coded status pill
        │   ├── SearchButton.tsx          # Pill-shaped search trigger with Ctrl+K hint
        │   ├── SearchModal.tsx           # Command-palette search overlay
        │   ├── SettingsModal.tsx         # Settings overlay (theme + language)
        │   └── ui/                       # Button, Card, Input, Select, Badge, Label, Textarea
        └── pages/
            ├── Dashboard.tsx
            ├── ApplicationList.tsx
            ├── ApplicationForm.tsx       # Shared create / edit form
            └── ApplicationDetail.tsx     # Detail + notes + attachments
```

---

## Data Model

### `job_applications`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| company_name | VARCHAR | Required |
| job_title | VARCHAR | Required |
| job_url | VARCHAR | Optional |
| status | VARCHAR (enum) | `APPLIED`, `PHONE_SCREEN`, `INTERVIEW`, `TECHNICAL_TEST`, `OFFER`, `REJECTED`, `WITHDRAWN` |
| applied_date | DATE | Required |
| deadline_date | DATE | Optional |
| created_at | TIMESTAMP | Auto-set by Hibernate |
| updated_at | TIMESTAMP | Auto-updated by Hibernate |

### `notes`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| job_application_id | UUID | FK → job_applications |
| content | TEXT | Required |
| created_at | TIMESTAMP | Auto-set |

### `attachments`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| job_application_id | UUID | FK → job_applications |
| original_file_name | VARCHAR | Original filename from upload |
| stored_file_name | VARCHAR | UUID-prefixed filename on disk |
| content_type | VARCHAR | MIME type |
| file_size_bytes | BIGINT | |
| created_at | TIMESTAMP | Auto-set |

> Tables are auto-created/updated by Hibernate (`ddl-auto=update`). No migration scripts needed.

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Java (JDK) | 21+ |
| PostgreSQL | 15+ |
| Node.js | 18+ |
| npm | 9+ |

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd JobApplicationTracker
```

### 2. Create the PostgreSQL database

```sql
CREATE DATABASE job_tracker;
```

If your PostgreSQL runs on a non-default port, note it for step 3.

### 3. Configure the backend

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5433/job_tracker
spring.datasource.username=postgres
spring.datasource.password=your_password

app.file.upload-dir=./uploads

spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

server.port=8080
```

### 4. Start the backend

```bash
cd backend
./mvnw spring-boot:run        # macOS / Linux
mvnw.cmd spring-boot:run      # Windows
```

The API will be available at `http://localhost:8080`.  
Hibernate will auto-create all tables on first run.

### 5. Install frontend dependencies

```bash
cd frontend
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Reference

All endpoints are prefixed with `/api`.

### Applications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/applications` | List all applications (paginated) |
| `POST` | `/applications` | Create a new application |
| `GET` | `/applications/{id}` | Get a single application |
| `PUT` | `/applications/{id}` | Update an application |
| `DELETE` | `/applications/{id}` | Delete an application (cascades notes & files) |

**Query parameters for `GET /applications`:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `status` | enum | — | Filter by status |
| `search` | string | — | Search company name or job title |
| `page` | int | `0` | Page number (0-indexed) |
| `size` | int | `20` | Page size |
| `sortBy` | string | `appliedDate` | Field to sort by |
| `sortDir` | string | `desc` | `asc` or `desc` |

### Notes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/applications/{id}/notes` | List notes for an application |
| `POST` | `/applications/{id}/notes` | Add a note |
| `DELETE` | `/applications/{id}/notes/{noteId}` | Delete a note |

### Attachments

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/applications/{id}/attachments` | List attachment metadata |
| `POST` | `/applications/{id}/attachments` | Upload a file (`multipart/form-data`, field: `file`) |
| `GET` | `/attachments/{id}/download` | Download a file |
| `DELETE` | `/attachments/{id}` | Delete a file |

### Statistics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stats` | Returns totals, counts by status, active/offer/rejected counts |

---

## Architecture Notes

- **No authentication** — the app is designed for single-user local use.
- **Layered architecture**: Controller → Service → Repository. DTOs are Java records; no entity objects are exposed directly.
- **File storage**: Files are stored on the local filesystem at `./uploads/` (relative to where the backend process runs). The directory is auto-created on startup.
- **CORS**: The backend allows `http://localhost:5173` on all `/api/**` routes.
- **Java records for DTOs**: All request and response DTOs are Java records. Lombok was intentionally removed for compatibility with Java 25.
- **Theming**: Dark/light mode is implemented via a `.dark` CSS class toggled on `<html>`. The active theme is stored in `localStorage` and read on startup before the first render to avoid flash.
- **i18n**: All UI strings are managed through `i18next`. Translations live in `src/i18n/locales/`. The active language is stored in `localStorage`. Adding a new language only requires a new locale file and a button in `SettingsModal`.
- **Modal state**: `ModalContext` holds the open/close state for the Search and Settings overlays so any component can trigger them without prop drilling. The Ctrl+K shortcut is wired in `Layout.tsx`.

---

## Available Scripts

### Backend

| Command | Description |
|---|---|
| `./mvnw spring-boot:run` | Start the development server |
| `./mvnw clean package` | Build a production JAR |
| `./mvnw test` | Run unit tests |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |

---

## Known Limitations

- No user authentication — anyone with access to the machine can use the app.
- Files are stored on the local filesystem; no cloud storage integration.
- No email or push notifications for deadlines (deadline date is stored but not acted on).
- No status history — only the current status is stored.
- Language support is limited to English, Deutsch, and Bulgarian; adding more requires a new locale file in `src/i18n/locales/`.
