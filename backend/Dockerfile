FROM python:3.10-slim

WORKDIR /app

# Установка зависимостей для работы с postgres
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./backend

# Скрипт запуска
CMD python -m backend.seed && uvicorn backend.main:app --host 0.0.0.0 --port 8000

