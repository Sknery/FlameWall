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
# --- ИЗМЕНИТЕ ЭТУ СТРОКУ ---
# Мы берем переменную $VAPID_PUBLIC_KEY из корневого .env и передаем ее
# в сборку как аргумент с именем VITE_VAPID_PUBLIC_KEY
echo "--- DEBUG: Passing VAPID Key to build: $VAPID_PUBLIC_KEY ---"

docker build --no-cache \
  --build-arg VITE_VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY \
  -f frontend/Dockerfile.prod -t $DOCKER_USERNAME/flamewall-frontend:latest .
# [!code focus end]
docker push $DOCKER_USERNAME/flamewall-frontend:latest

echo "✅ All images pushed successfully!"