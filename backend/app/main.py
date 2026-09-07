from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    auth,
    calendar,
    dashboard,
    departments,
    experiments,
    focus,
    goals,
    milestones,
    projects,
    resources,
    roadmap_items,
    roadmaps,
    skills,
    tasks,
    time_sessions,
)
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="LifeOS API", version="0.3.0")

# Only relevant for direct cross-origin API access (e.g. tools hitting the API without the dev proxy).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(departments.router)
app.include_router(goals.router)
app.include_router(focus.router)
app.include_router(dashboard.router)
app.include_router(roadmaps.router)
app.include_router(roadmap_items.router)
app.include_router(skills.router)
app.include_router(milestones.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(resources.router)
app.include_router(experiments.router)
app.include_router(time_sessions.router)
app.include_router(calendar.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
