# LifeOS — Handoff Document

Purpose: bring a new agent (or a future session) up to speed on what's built, what decisions were locked in,
and exactly what to build next. No code in this document — implementation only.

---

## 1. What LifeOS is (one paragraph)

A personal development system that connects long-term goals → roadmaps → skills → milestones → daily actions →
time invested → actual behavior → progress → review → next action. The core hook is "Where was I?" — when the
user returns after a distraction, the system restores context immediately instead of making them reconstruct
their plan from memory. This must never collapse into a generic task manager or CRUD dashboard.

---

## 2. Status: Phase 1, Phase 2, and Phase 3 are DONE and verified. Phase 4 is NOT started.

The project is split into 8 phases.
- **Phase 1 (Core Foundation)**: DONE and verified.
- **Phase 2 (Roadmaps/Skills/Milestones/Projects/Tasks/Resources/Experiments)**: DONE and verified.
- **Phase 3 (Timer/TimeSession, Live HUD, Aggregations, Context Capture)**: DONE and verified.
- **Phase 4 (Daily Tracking / Logs / Habits / Reviews)**: NOT started.

### Verified working:
- `docker compose up --build` starts db + backend + frontend cleanly.
- Backend: **69/69** pytest tests passing, including cross-user authorization tests on time sessions and entity start validation.
- Alembic migrations apply and reverse cleanly (`8d6720d5a933_phase3_time_sessions`).
- Frontend TypeScript build passes without warnings or errors (`tsc -b && vite build`).
- Global Timer state, topbar `LiveTimerHUD`, `StopSessionModal`, `ManualSessionModal`, and dashboard `InlineTimerWidget` are fully connected to real backend endpoints.
- End-to-end smoke test passed through the Vite dev proxy: register → create department → create goal →
  dashboard correctly resolves current focus and timer tracks deep work sessions.
- Host ports are remapped in `docker-compose.yml` to **5434** (Postgres) and **8010** (backend API) to avoid
  clashing with other local Docker projects on this machine. Frontend stays on 5173. Container-internal ports
  are still the standard 5432/8000, so this only affects host-side URLs.

---

## 3. Stack (locked — do not change without a concrete technical reason)

- Backend: FastAPI, SQLAlchemy 2.0 **async**, PostgreSQL, Alembic, Pydantic v2, Argon2 password hashing, JWT
  (short-lived access token in memory on the frontend + httpOnly revocable refresh-token cookie).
- Frontend: React + Vite + TypeScript. No extra state/data-fetching library (no Redux/TanStack Query) —
  plain `useState`/`useEffect` + a small hand-written `api` client. Keep it that way unless it becomes a real
  pain point.
- Infra: Docker Compose (db/backend/frontend services), `uv` for Python dependency management.
- Testing: pytest (backend). No frontend test framework set up yet (not required for Phase 1/2).
- Architecture: **Route → Service → Repository**. Repositories are plain async function modules per entity
  (no class hierarchies/interfaces — avoid over-engineering). Business logic lives in services, never in route
  handlers. Ownership/authorization is enforced in the service/repository layer (every query scoped by
  `user_id`), never relies on frontend filtering. Unauthorized access to another user's resource must return
  **404, never 403** (don't leak existence).

---

## 4. What's already built (Phase 1) — file map

```
LifeOS/
  docker-compose.yml, .env.example, README.md
  backend/
    pyproject.toml, Dockerfile, alembic.ini, alembic/env.py, alembic/versions/4d172aeeab91_initial_schema.py
    db-init/001-create-test-db.sql       # creates `lifeos_test` DB on first Postgres init, used by pytest
    app/
      main.py                            # FastAPI app factory, CORS, routers, /health
      core/config.py                     # pydantic-settings (DATABASE_URL, JWT secrets, cookie_secure, CORS)
      core/security.py                   # argon2 hash/verify, JWT encode/decode (access + refresh w/ jti)
      database/base.py                   # DeclarativeBase, __mapper_args__ = {"eager_defaults": True}
      database/session.py                # async engine/session factory (NullPool toggle for tests)
      models/
        user.py, refresh_token.py
        department.py, department_change.py
        goal.py, goal_change.py
        current_focus.py                 # relational-FK-only design (see Decisions below)
      schemas/                           # pydantic request/response models mirroring the above
      api/deps.py                        # get_db, get_current_user (Bearer JWT)
      api/routes/auth.py                 # register/login/refresh/logout/me
      api/routes/departments.py          # CRUD + /reorder + /changes
      api/routes/goals.py                # CRUD (nested under /departments/{id}/goals) + /changes
      api/routes/focus.py                # GET/PATCH /api/focus, DELETE /api/focus/override
      api/routes/dashboard.py            # GET /api/dashboard/overview
      services/                          # auth_service, department_service, goal_service, focus_service,
                                          # dashboard_service, change_history.py (generic diff+record helper)
      repositories/                      # user_repo, refresh_token_repo, department_repo, goal_repo, focus_repo
    tests/
      conftest.py                        # test DB setup, NullPool env-var toggle, register_user() helper
      test_auth.py, test_departments.py, test_goals.py, test_focus.py, test_authorization.py
  frontend/
    package.json, vite.config.ts (proxies /api → backend), tsconfig.json, Dockerfile
    src/
      theme/tokens.css                   # dark-first design tokens
      api/client.ts                      # fetch wrapper, 401→silent refresh, in-memory access token
      api/types.ts                       # TS interfaces mirroring backend schemas
      auth/AuthContext.tsx, auth/ProtectedRoute.tsx
      layout/AppShell.tsx                # sidebar + topbar
      pages/Login.tsx, Register.tsx, Dashboard.tsx, DepartmentList.tsx, DepartmentDetail.tsx, GoalForm.tsx
      features/onboarding/Onboarding.tsx
      features/focus/FocusEditor.tsx
      App.tsx, main.tsx
```

### Data model actually in the database right now (Phase 1)
- `User(id, email, hashed_password, created_at)`
- `RefreshToken(id, user_id, token_hash, revoked, expires_at, created_at)` — stores a SHA-256 hash of the
  refresh token's `jti`, never the token itself.
- `Department(id, user_id, name, description, purpose, long_term_goal, priority, status, current_phase,
  secondary_purpose, created_at, updated_at)`
- `DepartmentChange(id, department_id, user_id, field_name, previous_value, new_value, reason, changed_at)` —
  append-only, never updated/overwritten.
- `Goal(id, department_id, name, description, why, success_definition, priority, target_date, status,
  created_at, updated_at)`
- `GoalChange(id, goal_id, user_id, field_name, previous_value, new_value, reason, changed_at)` — append-only.
- `CurrentFocus(id, user_id [unique], department_id FK nullable, goal_id FK nullable, note nullable,
  is_manual_override, updated_at)`

### API routes implemented
```
POST   /api/auth/register | /login | /refresh | /logout      GET /api/auth/me
GET    /api/departments                POST /api/departments
GET    /api/departments/{id}           PATCH /api/departments/{id}      DELETE /api/departments/{id}
PATCH  /api/departments/reorder        GET /api/departments/{id}/changes
GET    /api/departments/{id}/goals     POST /api/departments/{id}/goals
GET    /api/goals/{id}                 PATCH /api/goals/{id}            DELETE /api/goals/{id}
GET    /api/goals/{id}/changes
GET    /api/focus                      PATCH /api/focus                 DELETE /api/focus/override
GET    /api/dashboard/overview
```

---

## 5. Key design decisions Antigravity must respect (don't relitigate these)

1. **CurrentFocus stores relational FKs, not duplicated text.** `current_phase` is read via a join to
   `Department.current_phase`, never copied onto `CurrentFocus`. Only a genuine free-text `note` field exists
   for user commentary. Focus is only ever changed by explicit user action — never by analytics/AI.
2. **Change history (`DepartmentChange`/`GoalChange`) is append-only.** Editing a goal/department inserts new
   rows; it never overwrites or deletes prior history. Both tables share the same shape:
   `(entity_id FK, user_id FK ["changed_by"], field_name, previous_value, new_value, reason nullable, changed_at)`.
3. **RoadmapItem must stay fully generic** (no `kind`/type column) — usable for concepts, skills, learning
   objectives, or project requirements without hardcoding a taxonomy. `Milestone` and `Skill` are separate
   models that reference `RoadmapItem`s via many-to-many, rather than `RoadmapItem` trying to represent
   milestones itself.
4. **RoadmapItem prerequisites are a separate self-referential association table**
   (`roadmap_item_prerequisite(roadmap_item_id, prerequisite_item_id)`), not reused from `parent_id` — the tree
   (`parent_id`) and the prerequisite graph are different relationships.
5. **Experiment.status is a single 5-value enum**: `exploring / continue / pause / reject / promote`. There is
   no separate `decision` column (it was in the original request but overlapped with `status` — resolved by
   merging to avoid two competing enums). `result` is a free-text field for what was learned. Promoting an
   experiment (`status → promote`) only flips the status — creating the actual `RoadmapItem` is a **separate,
   explicit, manual action** by the user. Never auto-link.
6. **TimeSession (Phase 3) is forward-designed but NOT built.** Do not create the table yet — Phase 3 is
   explicitly deferred. The target shape is documented in section 7 below so Phase 3 won't require a redesign.
7. **Every new entity needs ownership enforcement + a 404 (not 403) authorization test**, following the exact
   pattern already used for Department/Goal (see `test_authorization.py`).
8. Do not add a frontend state library or ORM changes beyond what's listed here without a concrete blocking
   reason — keep the codebase practical, not over-engineered.

---

## 6. PHASE 2 — what to build next (in this exact order)

Target data model (add these SQLAlchemy models + Alembic migration):

- `Roadmap(id, department_id, goal_id nullable, name)`
- `RoadmapItem(id, roadmap_id, parent_id nullable FK->self, name, description, status
  [not_started/in_progress/completed/blocked], progress, estimated_hours, sort_order, created_at, updated_at)`
- `RoadmapItemPrerequisite(roadmap_item_id, prerequisite_item_id)` — self-referential M2M association table
- `Skill(id, department_id, name, purpose, prerequisite_text, status, progress)` + `skill_roadmap_item` assoc
- `Milestone(id, department_id, goal_id nullable, name, description, completion_criteria, status, progress,
  completion_date nullable)` + `milestone_skill`, `milestone_project` assoc tables
- `Project(id, department_id, goal_id nullable, name, purpose, status, progress, start_date, end_date,
  repo_url, deployment_url, notes)` + `project_required_skill` assoc table
- `Task(id, project_id, name, status, due_date nullable)`
- `Resource(id, type [url/video/article/book/document/course/note], title, url_or_path, department_id
  nullable, goal_id nullable, skill_id nullable, roadmap_item_id nullable, project_id nullable)` — nullable
  FK columns, not a polymorphic association (kept simple deliberately)
- `Experiment(id, user_id, department_id nullable, name, description, purpose, time_budget_hours nullable,
  status [exploring/continue/pause/reject/promote], result nullable text, created_at, completed_at nullable)`

Target API routes to add:
```
GET/POST   /api/departments/{id}/roadmap          (tree fetch / create)
PATCH      /api/roadmap-items/{id}                (status/progress/etc.)
POST/DELETE /api/roadmap-items/{id}/prerequisites
CRUD under /api/departments/{id}/skills and /api/skills/{id}
CRUD under /api/departments/{id}/milestones and /api/milestones/{id}
CRUD under /api/departments/{id}/projects and /api/projects/{id}
CRUD under /api/projects/{id}/tasks and /api/tasks/{id}
CRUD for resources (attachable via optional FK query params)
GET/POST   /api/experiments      GET/PATCH/DELETE /api/experiments/{id}
POST       /api/experiments/{id}/status   (transition; `promote` only flips status, no auto roadmap creation)
```

Build order (each step depends on the previous):
1. Roadmap model + CRUD
2. RoadmapItem tree (model, parent_id, prerequisites assoc, tree-fetch/status endpoints)
3. Skills (model + CRUD + skill_roadmap_item assoc)
4. Milestones (model + CRUD + milestone_skill/milestone_project assoc)
5. Projects (model + CRUD + project_required_skill assoc)
6. Tasks (model + CRUD under project)
7. Resources (model + CRUD, optional FK attachment)
8. Experiments (model + CRUD + status transition endpoint) — only depends on Phase 1 (department_id nullable)
9. Current milestone and next action: **ALTER** `CurrentFocus` to add `milestone_id` (FK Milestone, nullable)
   and `next_action_roadmap_item_id` (FK RoadmapItem, nullable) — additive columns, not a redesign
10. Roadmap UI (tree view: expand/collapse, status shown via color **and** label/icon, never color-only)
11. Skill UI
12. Milestone UI
13. Project UI
14. Task UI
15. Experiment UI
16. Extend onboarding wizard to optionally seed initial roadmap/skills

Verification checklist for Phase 2 (mirror the Phase 1 approach):
- Alembic migration for all Phase 2 tables applies and reverses cleanly.
- pytest coverage per new entity (CRUD + ownership), plus authorization-matrix additions: user B must get 404
  on user A's roadmap, roadmap item (including attaching a prerequisite that points at A's item), skill,
  milestone, project, task, resource, experiment, and on experiment status transitions.
- Roadmap tree UI: status is legible without relying on color alone (label/icon required).
- Experiment "promote" flow requires a separate, explicit manual step to create a roadmap item — never
  automatic.

Phase 3 (Timer/TimeSession) stays deferred — do not build it as part of Phase 2.

---

## 7. Phase 3 (Timer & TimeSession) — BUILT AND VERIFIED

- **Model**: `TimeSession(id, user_id, department_id, goal_id, roadmap_item_id, skill_id, project_id, task_id, start_time, end_time, last_paused_at, duration_seconds, pause_duration_seconds, status, note, created_at)`
- **Migration**: `8d6720d5a933_phase3_time_sessions.py` (applied and verified reversible).
- **Enforced Rules**:
  1. Single active session per user constraint (starting a new timer auto-completes any existing active session).
  2. Auto-fill from `CurrentFocus` when entity parameters are omitted.
  3. Dynamic SQL derivations only: all aggregations (`today_seconds`, `week_seconds`, `by_department`) are computed via `SUM()` and `GROUP BY` at query time. No static aggregate columns stored.
  4. Context preservation: on session stop, user is prompted for an accomplishment note with the option to update `CurrentFocus.note`.
  5. Strict ownership: cross-user authorization tests return 404.
- **Frontend Components**:
  - `TimerContext.tsx`: Global state, live ticking interval, lifecycle actions.
  - `LiveTimerHUD.tsx`: Sleek topbar indicator with pause, resume, finish, and discard controls.
  - `StopSessionModal.tsx`: Session accomplishment logger & focus note sync.
  - `ManualSessionModal.tsx`: Retroactive time logger for offline work.
  - `Dashboard.tsx`: Connected `InlineTimerWidget`, hero session launcher, and time allocation breakdown.
  - Shortcut tracking buttons on Roadmap items and Project tasks.

---

## 8. Phase 4 Target — Daily Tracking / Logs / Habits / Reviews (What to build next)

- Daily Log / Check-in entries (morning planning, evening reflection, daily energy / focus ratings).
- Habit tracker & recurrence loops connected to departments and identity goals.
- Weekly review mechanism synthesizing completed tasks, roadmap progress, experiments, and time session summaries.

---

## 8. Known gotchas (avoid re-discovering these the hard way)

- SQLAlchemy async + server-side `onupdate=func.now()` needs `__mapper_args__ = {"eager_defaults": True}` on
  `Base`, or accessing the column right after commit raises `MissingGreenlet`. Already set in `database/base.py`
  — keep it when adding new models.
- pytest-asyncio creates a new event loop per test; the async engine's connection pool must use `NullPool`
  during tests (already wired via a `SQLALCHEMY_NULLPOOL` env var set in `tests/conftest.py`) or you'll hit
  `InterfaceError: another operation is in progress`.
- `pydantic[email]` (the `email-validator` package) is required for `EmailStr` — already in `pyproject.toml`.
- FastAPI route ordering: register static-path routes (e.g. `PATCH /departments/reorder`) **before**
  parameterized routes (`PATCH /departments/{department_id}`) on the same router.
- Host ports are remapped (5434 Postgres, 8010 backend) to avoid clashing with other local Docker projects —
  see `docker-compose.yml`. Don't "fix" these back to 5432/8000 without checking for conflicts first.
- `create_file`-style tools generally can't overwrite existing files — use a string-replace/edit tool instead.

---

## 9. How to run everything

```
cp .env.example .env
docker compose up --build
docker compose exec backend uv run alembic upgrade head
docker compose exec backend uv run pytest -q
```
Frontend: http://localhost:5173 · API docs: http://localhost:8010/docs
