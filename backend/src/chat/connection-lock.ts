// Этот Set будет общим для всего приложения и будет предотвращать двойную обработку подключения
export const processedSockets = new Set<string>();

// Этот Set будет временно хранить "отпечатки" сообщений, чтобы предотвратить их дублирование
export const recentMessageSignatures = new Set<string>();