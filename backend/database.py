import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool

# Получаем URL базы данных из переменных окружения
# Если переменной нет, используем SQLite как заглушку
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./queue.db")

# Фикс для Supabase / Render / Heroku postgres:// -> postgresql://
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
if SQLALCHEMY_DATABASE_URL.startswith("postgresql://") and not SQLALCHEMY_DATABASE_URL.startswith("postgresql+psycopg2://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # NullPool идеален для Serverless (Vercel) и Transaction Pooler Supabase (порт 6543)
    connect_args = {}
    if ("supabase.co" in SQLALCHEMY_DATABASE_URL or "pooler.supabase.com" in SQLALCHEMY_DATABASE_URL) and "sslmode" not in SQLALCHEMY_DATABASE_URL:
        connect_args["sslmode"] = "require"

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        poolclass=NullPool,
        connect_args=connect_args
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Зависимость для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

