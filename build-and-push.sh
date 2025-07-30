#!/bin/bash
set -e

# Замени sknery на свой логин в Docker Hub
DOCKER_USERNAME=sknery

# Загружаем переменные из .env файла
set -a
source .env
set +a

echo "🔹 Logging in to Docker Hub..."

echo "🛠️ Building and pushing backend image..."
docker build -f backend/Dockerfile.prod -t $DOCKER_USERNAME/flamewall-backend:latest .
docker push $DOCKER_USERNAME/flamewall-backend:latest

echo "🛠️ Building and pushing frontend image..."
# [!code focus start]
# --- ДОБАВЛЯЕМ ФЛАГ --no-cache ---
docker build --no-cache -f frontend/Dockerfile.prod -t $DOCKER_USERNAME/flamewall-frontend:latest .
# [!code focus end]
docker push $DOCKER_USERNAME/flamewall-frontend:latest

echo "✅ All images pushed successfully!"