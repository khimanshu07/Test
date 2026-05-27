# ESG Platform Deployment & Hosting Guide

This guide details instructions for hosting and deploying the ESG Ingestion & Audit Review Platform.

---

## Architecture Overview

The system consists of three main components:
1. **Frontend**: React (TypeScript + Vite) single-page application.
2. **Backend**: Django REST Framework serving API endpoints.
3. **Database**: PostgreSQL (relational database).

---

## 1. Deploying the Frontend (React + Vite)

The frontend can be built into static assets (`dist` folder) and hosted on serverless CDNs.

### Recommended Providers:
- **Vercel** (Highly recommended for Vite/React)
- **Netlify**
- **Render** (Static Sites)

### Steps to Deploy (Vercel/Netlify):
1. Connect your GitHub repository to the hosting provider.
2. Configure build settings:
   - **Build Command**: `npm run build` (runs `tsc -b && vite build`)
   - **Output Directory**: `dist`
3. Configure **Environment Variables**:
   - Create `VITE_API_URL` pointing to your deployed Backend API URL (e.g., `https://api.yourdomain.com`).
4. Set up rewrite rules for React Router (Single Page Application routing):
   - **Vercel (`vercel.json`)**:
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
     }
     ```
   - **Netlify (`_redirects`)**:
     ```text
     /*   /index.html   200
     ```

---

## 2. Deploying the Backend (Django REST Framework)

The backend needs a persistent runtime with Python 3.12+ support.

### Recommended Providers:
- **Render** (Web Service)
- **Railway**
- **AWS App Runner** or **Heroku**

### Steps to Deploy (Render/Railway):
1. Create a new **Web Service** pointing to the `/backend` folder.
2. Configure **Environment Variables**:
   - `DATABASE_URL`: Connection string to your PostgreSQL instance.
   - `SECRET_KEY`: A secure random secret key.
   - `DEBUG`: `False` (production mode).
   - `CORS_ALLOWED_ORIGINS`: Deployed frontend URL (e.g., `https://esg.yourdomain.com`).
3. Set the **Build Command**:
   - `pip install -r requirements.txt && python manage.py migrate`
4. Set the **Start Command**:
   - Run the WSGI server via Gunicorn: `gunicorn esg_backend.wsgi:application --bind 0.0.0.0:$PORT`

---

## 3. Database Setup (PostgreSQL)

You can provision a managed PostgreSQL database through:
- **Supabase** (Free-tier PostgreSQL)
- **Neon** (Serverless PostgreSQL)
- **Render Databases**

Ensure that you add your database URL to the backend `DATABASE_URL` environment variable. The database models will migrate automatically on deployment.

---

## 4. Seeding Production/Demo Data

Once the backend is deployed, you can access the container/terminal or run a one-time script command to populate the database with initial organizations, users, and emission factors:
```bash
python seed.py
```
This initializes the following credentials:
- **Admin**: `admin` / `admin123`
- **Analyst**: `analyst` / `analyst123`
- **Client**: `client` / `client123`
