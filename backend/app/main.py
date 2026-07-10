from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .migrations import run_migrations
from .routers import attendance, courses, exports, projects, students

Base.metadata.create_all(bind=engine)
run_migrations(engine)

app = FastAPI(title="体育课现场记录 MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(courses.router)
app.include_router(students.router)
app.include_router(attendance.router)
app.include_router(projects.router)
app.include_router(exports.router)


@app.get("/")
def root():
    return {"name": "体育课现场记录 MVP", "status": "ok"}
