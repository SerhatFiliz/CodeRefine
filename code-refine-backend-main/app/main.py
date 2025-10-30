from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 'analysis' router'ını buraya import ediyoruz
from app.api.routers import auth, users, analysis

app = FastAPI(title="CodeRefine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])

# YENİ EKLENEN SATIR: Analiz router'ını uygulamaya dahil et
# Bu, /analysis/ adresini aktif hale getirecek
app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
