// Этот Set будет существовать в единственном экземпляре на весь процесс Node.js,
// гарантируя, что он будет общим для всех возможных экземпляров ChatGateway.
export const processedSockets = new Set<string>();