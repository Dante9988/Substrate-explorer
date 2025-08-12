import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Blockchain Explorer API')
    .setDescription('A simple blockchain explorer for Substrate networks')
    .setVersion('1.0')
    .addTag('search', 'Search operations for addresses and blocks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Blockchain Explorer API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
