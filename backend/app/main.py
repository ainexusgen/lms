from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .bootstrap import bootstrap
from .routers import auth, books, members, circulation, rfid, settings, reports

app = FastAPI(title="TechNexusGen UHF RFID Library Management System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    bootstrap()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "lms-backend"}


for r in (auth, books, members, circulation, rfid, settings, reports):
    app.include_router(r.router, prefix="/api")
