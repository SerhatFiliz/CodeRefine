# code-refine-backend-main/Dockerfile

FROM python:3.10-slim
WORKDIR /app

# Önce bağımlılıkları kur
COPY requirements.txt .
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Sonra tüm proje kodunu kopyala
COPY . .

# Hata buradaydı. Doğru yol 'app.main' olmalı.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

