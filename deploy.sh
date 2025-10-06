#!/bin/bash
set -e # Скрипт остановится, если любая команда вернет ошибку

# --- 1. Проверка аргумента ---
if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh [pull | build]"
    echo ""
    echo "  pull  - Pull pre-built images from Docker Hub (faster deployment)."
    echo "  build - Build images from source directly on the server (for development)."
    exit 1
fi

MODE=$1

# --- Загрузка переменных ---
export $(grep -v '^#' .env | xargs)

# --- Вход в Docker Hub ---
echo "🔐 Logging in to Docker Hub to pull private images..."
echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin

echo "🚀 Starting deployment in '$MODE' mode..."

# 2. Скачиваем последние изменения из Git
echo "🔄 Pulling latest changes from Git..."
git pull origin main
git submodule sync --recursive
git submodule update --init --remote --merge

# --- 3. Обработка Docker-образов в зависимости от режима ---
if [ "$MODE" == "pull" ]; then
    echo "🔽 Pulling new Docker images from Docker Hub..."
    docker compose -f docker-compose.prod.yml pull
elif [ "$MODE" == "build" ]; then
    echo "🛠️  Building all images from source (ignoring cache)..."
    # Добавляем --no-cache, чтобы принудительно пересобрать все слои
    docker compose -f docker-compose.prod.yml build --no-cache
else
    echo "❌ Invalid mode: '$MODE'. Please use 'pull' or 'build'."
    exit 1
fi

# 4. Применяем миграции (если есть новые)
echo "🔄 Applying database migrations..."
# Образ backend уже был собран на шаге выше, поэтому команда run сработает
docker compose -f docker-compose.prod.yml run --rm backend npm run migration:run:prod

# 5. Принудительно удаляем старый контейнер Nginx, чтобы он гарантированно подхватил новый конфиг
echo "🔨 Forcing Nginx container recreation..."
docker compose -f docker-compose.prod.yml rm -s -f nginx || true

# 6. Запускаем все сервисы
echo "🚀 Starting all services..."
# Флаг --build больше не нужен, так как мы уже всё собрали явно
docker compose -f docker-compose.prod.yml up -d

echo "✅ Deployment finished successfully!"