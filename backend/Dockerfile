FROM node:20-alpine AS development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=development
COPY . .
CMD ["npm", "run", "start:dev"]

FROM node:20-alpine AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
# Обратите внимание, что мы копируем dist из development, а не из deps.
# Это может потребовать доработки, если вы будете делать прод-сборку.
COPY --from=development /usr/src/app/dist ./dist
CMD ["node", "dist/main"]