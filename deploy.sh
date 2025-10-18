#!/bin/bash
set -e # Скрипт остановится, если любая команда вернет ошибку

# --- 1. Определение команды Docker Compose ---
# Проверяем, доступна ли команда 'docker compose' (новый синтаксис)
if docker compose version &>/dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
# Если нет, проверяем 'docker-compose' (старый синтаксис)
elif docker-compose version &>/dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
# Если ни одна из команд не найдена, выходим с ошибкой
else
    echo "❌ Ошибка: Не удалось найти ни 'docker compose', ни 'docker-compose'."
    echo "Пожалуйста, убедитесь, что Docker Compose установлен на сервере."
    exit 1
fi
echo "✅ Используется команда: '$DOCKER_COMPOSE_CMD'"


# --- 2. Проверка аргумента ---
if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh [pull | build]"
    echo ""
    echo "  pull  - Скачать готовые образы из Docker Hub (быстрое развертывание)."
    echo "  build - Собрать образы из исходного кода прямо на сервере (для разработки)."
    exit 1
fi

MODE=$1

# --- Загрузка переменных ---
export $(grep -v '^#' .env | xargs)

# --- Вход в Docker Hub ---
echo "🔐 Вход в Docker Hub для скачивания приватных образов..."
echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin

echo "🚀 Запуск развертывания в режиме '$MODE'..."

# --- 3. Скачиваем последние изменения из Git ---
echo "🔄 Получение последних изменений из Git..."
git pull origin main
git submodule sync --recursive
git submodule update --init --remote --merge

# --- 4. Обработка Docker-образов в зависимости от режима ---
if [ "$MODE" == "pull" ]; then
    echo "🔽 Скачивание новых Docker-образов из Docker Hub..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml pull
elif [ "$MODE" == "build" ]; then
    echo "🛠️  Сборка всех образов из исходного кода (игнорируя кеш)..."
    # Добавляем --no-cache, чтобы принудительно пересобрать все слои
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml build --no-cache
else
    echo "❌ Неверный режим: '$MODE'. Пожалуйста, используйте 'pull' или 'build'."
    exit 1
fi

# --- 5. Применяем миграции (если есть новые) ---
echo "🔄 Применение миграций базы данных..."
# Образ backend уже был собран на шаге выше, поэтому команда run сработает
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml run --rm backend npm run migration:run:prod

# --- 6. Принудительно удаляем старый контейнер Nginx ---
# Это гарантирует, что он подхватит новый конфиг, если он изменился
echo "🔨 Принудительное пересоздание контейнера Nginx..."
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml rm -s -f nginx || true

# --- 7. Запускаем все сервисы ---
echo "🚀 Запуск всех сервисов..."
# Флаг --build больше не нужен, так как мы уже всё собрали явно
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d

echo "✅ Развертывание успешно завершено!"
