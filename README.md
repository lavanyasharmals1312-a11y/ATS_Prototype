# ProEx Labs ATS (Applicant Tracking System)

![ProEx Labs ATS](https://img.shields.io/badge/Status-Prototype-blue) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white) ![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black) ![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-316192?logo=postgresql&logoColor=white)

A modern, high-performance Applicant Tracking System built for ProEx Labs. Designed to streamline the recruitment process through advanced resume parsing, intelligent duplicate detection, and a seamless recruiter experience.

## 🌟 Key Features

* **Advanced Candidate Management:** Centralized hub for recruiters to view, filter, edit, and manage candidate profiles.
* **Intelligent Resume Parsing:** Upload candidate resumes (PDF, DOCX) and automatically extract key information such as skills, experience, and contact details (supports both rule-based and AI-assisted extraction via Gemini).
* **Duplicate Detection Engine:** Automatically flags potential duplicate candidate entries based on matching algorithms (email, phone, name similarities) and provides a dedicated UI for recruiters to resolve conflicts.
* **Bulk Data Import:** Easily import candidate data from legacy systems or spreadsheets (CSV/Excel) with robust error handling and duplicate checking.
* **Real-time Analytics Dashboard:** Visual insights into recruitment metrics, candidate pipeline volume, and system health.
* **Secure Role-Based Access Control (RBAC):** Distinct privileges for `admin` and `recruiter` roles.
* **Team Management:** Dedicated admin dashboard to provision accounts and deactivate former employees.
* **Password Recovery:** Secure, token-based "Forgot Password" workflow.

## 🏗️ Architecture & Tech Stack

The system is built on a modern, decoupled client-server architecture to ensure scalability, type safety, and a premium user experience.

### Backend (Python / FastAPI)
* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) for high-performance, asynchronous REST APIs.
* **Database:** PostgreSQL 16 (Managed via Docker).
* **ORM & Migrations:** SQLAlchemy 2.0 (Async) and Alembic.
* **Authentication:** JWT (JSON Web Tokens) using `python-jose` and bcrypt password hashing via `passlib`.
* **Rate Limiting:** `slowapi` to prevent API abuse.

### Frontend (React / TypeScript)
* **Framework:** React 18 with [Vite](https://vitejs.dev/) for lightning-fast builds.
* **Language:** TypeScript for end-to-end type safety.
* **State Management:** 
  * [Zustand](https://zustand-demo.pmnd.rs/) for global client state (Auth, UI).
  * [TanStack React Query](https://tanstack.com/query/latest) for async server state, caching, and data fetching.
* **Styling & UI:** Tailwind CSS combined with [shadcn/ui](https://ui.shadcn.com/) components for a beautiful, accessible, and highly customizable design system.
* **Animations:** Framer Motion for premium micro-interactions.
* **Routing:** React Router v6.

## 🚀 Getting Started

The project relies on Docker for the database and requires Python and Node.js for the backend and frontend, respectively. 

For a complete, step-by-step walkthrough on how to configure environment variables, initialize the database, create your first admin user, and start the development servers, please refer to the comprehensive **[Startup Guide](STARTUP_GUIDE.md)**.

### Quick Start Summary
1. Start the database: `docker-compose up -d`
2. Start the backend: `cd backend && source venv/bin/activate && uvicorn app.main:app --reload`
3. Start the frontend: `cd frontend/react && npm run dev`

## 📁 Project Structure

```text
ATS_Prototype_1/
├── STARTUP_GUIDE.md           # Step-by-step setup instructions
├── docker-compose.yml         # Database and pgAdmin infrastructure
├── backend/
│   ├── app/
│   │   ├── api/               # API Router modules (candidates, resumes, auth, etc.)
│   │   ├── models/            # SQLAlchemy Database Models
│   │   ├── schemas/           # Pydantic schemas for request/response validation
│   │   ├── services/          # Core business logic (parsing, deduplication, etc.)
│   │   └── main.py            # FastAPI application entry point
│   ├── alembic/               # Database migration scripts
│   └── scripts/               # Utility scripts (e.g., create_admin.py)
└── frontend/
    └── react/
        ├── src/
        │   ├── components/    # Reusable UI components (shadcn/ui & layout)
        │   ├── pages/         # Top-level route components (Dashboard, Candidates, etc.)
        │   ├── services/      # Axios API client integrations
        │   ├── store/         # Zustand global state
        │   └── types/         # Shared TypeScript interfaces
        └── package.json
```

## 🔐 Security & Access

- **Internal Tool Architecture:** As an internal corporate tool, there is no public sign-up page. All recruiter accounts must be provisioned by an Administrator via the **Team Management** dashboard.
- **Data Protection:** Passwords are never stored in plaintext. Session management is strictly handled via expiring HTTP Bearer tokens.

## 🤝 Contributing

When contributing to this project:
1. Ensure all new backend routes are protected by the `get_current_user` or `require_admin` dependency where applicable.
2. Maintain strict TypeScript types for all new frontend API responses.
3. Use the existing `shadcn/ui` components for consistency in design.

---
*Built with ❤️ for ProEx Labs.*
