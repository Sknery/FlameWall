import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule, SwaggerCustomOptions } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// --- ДОБАВЛЕНО ---
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // --- ИЗМЕНЕНО: Указываем, что наше приложение - NestExpressApplication ---
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // --- ДОБАВЛЕНО: Настраиваем раздачу статичных файлов ---
  // Все файлы из папки 'uploads' будут доступны по URL /uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  app.enableCors(); 
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Flamewall API')
    .setDescription('API documentation for the Flamewall Minecraft server website')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  SwaggerModule.setup('api-docs', app, document, customOptions); 

  const port = configService.get<number>('API_PORT') || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation is available at: ${await app.getUrl()}/api-docs`);
}
bootstrap();