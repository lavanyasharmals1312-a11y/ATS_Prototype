# ProEx Labs ATS — Comprehensive Startup Guide

Welcome to the ProEx Labs ATS (Applicant Tracking System). This guide will walk you through the entire process of setting up the local development environment, database, backend server, and frontend React application.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your system:
- **Python 3.10+** (for the FastAPI backend)
- **Node.js (v18+) & npm** (for the React frontend)
- **Docker & Docker Compose** (for PostgreSQL database and pgAdmin)

---

## 🔐 1. Environment Configuration

The backend relies on environment variables for database connections, security, and optional AI integrations.

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd ATS_Prototype_1/backend
   ```
2. Copy the example `.env` file to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
3. *(Optional)* Open the new `.env` file and configure `GEMINI_API_KEY` and set `ENABLE_AI_PARSING=true` if you wish to use the AI extraction layer. Otherwise, the rule-based extractor will act as the default.

---

## 🗄️ 2. Database Setup (Docker)

The project uses PostgreSQL as its single source of truth, managed via Docker for ease of use.

1. Navigate to the root directory of the project:
   ```bash
   cd ../
   ```
2. Start the database and pgAdmin containers in the background:
   ```bash
   docker-compose up -d
   ```
   > **Note:** This starts the PostgreSQL database (`proex_ats_db` on port 5432) and pgAdmin (`proex_ats_pgadmin` on port 5050).

---

## ⚙️ 3. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - **Mac/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows:**
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the database migrations (Alembic) to create the schema (Tables: Users, Candidates, Resumes, etc.):
   ```bash
   alembic upgrade head
   ```
5. Create your first Admin user (so you can log into the frontend):
   ```bash
   PYTHONPATH=. python scripts/create_admin.py admin@proexlabs.com adminpassword
   ```
   *(You can change the email and password to whatever you prefer).*
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will now be running at **http://localhost:8000**.

---

## 💻 4. Frontend Setup (React)

Open a **new terminal window** (leave the backend server running) and follow these steps:

1. Navigate to the React frontend directory:
   ```bash
   cd ATS_Prototype_1/frontend/react
   ```
2. Install the Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will now be running at **http://localhost:5173**.

---

## 🚀 5. Accessing the Application

With everything running, you can now access the different layers of the application:

* **React Dashboard:** [http://localhost:5173](http://localhost:5173) 
  *(Log in using the admin credentials you created in Step 3.5)*
* **FastAPI Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
  *(Useful for testing API endpoints directly)*
* **pgAdmin (Database GUI):** [http://localhost:5050](http://localhost:5050)
  * **Email:** `admin@proexlabs.com`
  * **Password:** `admin`
  *(Connect to the server using hostname `db`, user `ats_user`, password `ats_password`, and db `proex_ats`)*

---

## 🛠️ Troubleshooting & Tips

* **Database Connection Issues:** If the backend throws a DB error, ensure Docker is running and the containers are healthy (`docker ps`).
* **Uploads Directory:** File uploads are stored locally in `backend/uploads/`. If you encounter write errors during resume upload, verify that this directory exists and has correct permissions.
* **Stopping the App:** 
  * To stop the frontend or backend, press `Ctrl + C` in their respective terminals.
  * To stop the database: `docker-compose down` (Add `-v` to wipe data).
