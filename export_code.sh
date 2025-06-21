#!/bin/bash

# --- КОНФИГУРАЦИЯ ---
OUTPUT_FILE="full_project_snapshot.txt"

DIRS_TO_EXPORT=(
    "backend/src"
    "frontend/src"
    "frontend/public"
    "frontend/nginx"
    "nginx"
)

FILES_TO_EXPORT=(
    ".env"
    "docker-compose.yml"
    "docker-compose.prod.yml"
    "backend/Dockerfile"
    "backend/Dockerfile.prod"
    "frontend/Dockerfile"
    "frontend/Dockerfile.prod"
    "package.json" 
    "frontend/package.json"
)

# --- ЛОГИКА СКРИПТА ---
> "$OUTPUT_FILE"
echo "Начинаю экспорт кода в файл $OUTPUT_FILE..."
echo "===============================================" >> "$OUTPUT_FILE"
echo "PROJECT SNAPSHOT CREATED ON: $(date)" >> "$OUTPUT_FILE"
echo "===============================================" >> "$OUTPUT_FILE"

# Функция для добавления содержимого папки
process_directory() {
    local dir_path="$1"
    if [ -d "$dir_path" ]; then
        echo "Обрабатываю папку: $dir_path"
        # --- ИЗМЕНЕНИЕ ЗДЕСЬ: Добавлен фильтр для исключения бинарных файлов ---
        find "$dir_path" -type f \
        -not \( \
            -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.ico" \
            -o -name "*.svg" -o -name "*.woff" -o -name "*.woff2" -o -name "*.eot" -o -name "*.ttf" \
            -o -name "*.otf" -o -name "*.DS_Store" \
        \) | sort | while read -r file; do
            echo -e "\n\n--- START FILE: $file ---\n" >> "$OUTPUT_FILE"
            cat "$file" >> "$OUTPUT_FILE"
            echo -e "\n--- END FILE: $file ---\n" >> "$OUTPUT_FILE"
        done
    else
        echo "Внимание: Папка '$dir_path' не найдена, пропускаю."
    fi
}

# Функция для добавления одного файла
process_file() {
    local file_path="$1"
    if [ -f "$file_path" ]; then
        echo "Обрабатываю файл: $file_path"
        echo -e "\n\n--- START FILE: $file_path ---\n" >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
        echo -e "\n--- END FILE: $file_path ---\n" >> "$OUTPUT_FILE"
    else
        echo "Внимание: Файл '$file_path' не найден, пропускаю."
    fi
}

# --- ВЫПОЛНЕНИЕ ---
for dir in "${DIRS_TO_EXPORT[@]}"; do
    process_directory "$dir"
done

for file in "${FILES_TO_EXPORT[@]}"; do
    process_file "$file"
done

echo "==============================================="
echo "Готово! Полный срез проекта сохранен в файл $OUTPUT_FILE"
