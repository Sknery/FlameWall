#!/bin/bash
set -e

# Замени sknery на свой логин в Docker Hub
DOCKER_USERNAME=sknery

# Загружаем переменные из .env файла
export $(grep -v '^#' .env | xargs)

echo "🔹 Logging in to Docker Hub..."
docker login -u "$DOCKER_USERNAME"

echo "🛠️ Building and pushing backend image..."
docker build -f backend/Dockerfile.prod -t $DOCKER_USERNAME/flamewall-backend:latest .
docker push $DOCKER_USERNAME/flamewall-backend:latest

echo "🛠️ Building and pushing frontend image..."
# Передаем переменную для Vite во время сборки
docker build --build-arg VITE_FULL_API_URL=$VITE_FULL_API_URL -f frontend/Dockerfile.prod -t $DOCKER_USERNAME/flamewall-frontend:latest .
docker push $DOCKER_USERNAME/flamewall-frontend:latest

echo "✅ All images pushed successfully!"