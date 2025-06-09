// frontend/src/utils/url.js

// URL нашего бэкенда для изображений
const FULL_API_URL = process.env.REACT_APP_FULL_API_URL || 'http://localhost:3000';

/**
 * Создает полный URL для изображения на основе относительного пути.
 * @param {string | null} relativePath - Относительный путь к файлу (например, /uploads/avatars/123.jpg).
 * @returns {string | null} Полный URL или null, если путь не предоставлен.
 */
export const constructImageUrl = (relativePath) => {
  // Если пути нет, возвращаем null (или можно вернуть путь к заглушке)
  if (!relativePath) {
    return null;
  }

  // Если это 'blob:' URL (для локального предпросмотра), возвращаем его как есть.
  if (relativePath.startsWith('blob:')) {
    return relativePath;
  }

  // В остальных случаях строим полный URL
  return `${FULL_API_URL}${relativePath}`;
};