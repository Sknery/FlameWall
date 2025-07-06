docker-compose exec backend npm run typeorm -- --dataSource src/data-source.ts migration:generate src/migrations/FileName
docker-compose exec backend npm run migration:run
