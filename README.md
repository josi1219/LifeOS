# LifeOS

A personal development system that connects goals, roadmaps, skills, milestones, time investment, and actual
behavior — built to answer "what was I doing and why?" the moment you come back after a distraction.

This repo currently implements **Phase 1 (Core Foundation)**: authentication, departments, goals, priority,
change history, current focus, and a real dashboard. Roadmaps/skills/projects/experiments (Phase 2) and the
timer/time-tracking system (Phase 3) are designed but not yet built — see `docs` below.

## Stack
- Backend: FastAPI, SQLAlchemy 2.0 (async), PostgreSQL, Alembic, Pydantic v2, Argon2, JWT
- Frontend: React, Vite, TypeScript
- Infra: Docker Compose, uv

## Running locally

1. Copy the environment template:
   ```
   cp .env.example .env
   ```
2. Start everything:
   ```
   docker compose up --build
   ```
3. Apply database migrations (first run and after any model change):
   ```
   docker compose exec backend uv run alembic upgrade head
   ```
4. Open the app:
   - Frontend: http://localhost:5173
   - API docs (Swagger): http://localhost:8010/docs

Host ports are non-standard (`5434` for Postgres, `8010` for the API) to avoid clashing with other local
projects. Internally, containers still talk to each other on the standard `5432`/`8000` ports.

## Running the backend test suite

Tests run against a dedicated `lifeos_test` database (created automatically by `backend/db-init` on the
Postgres container's first startup — if you started the `db` volume before this existed, recreate it once with
`docker compose down -v`).

```
docker compose exec backend uv run pytest
```

## Project layout

```
backend/   FastAPI app (app/), Alembic migrations (alembic/), tests (tests/)
frontend/  React + Vite + TypeScript app (src/)
```

## Notes
- The frontend's dev server proxies `/api` to the backend container, so the browser only ever talks to one
  origin — this keeps the httpOnly refresh-token cookie same-site without extra CORS/cookie complexity.
- All data is scoped to the authenticated user at the repository/service layer; unauthorized access to another
  user's resources returns `404`, never `403`, to avoid leaking existence.
