import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get allowed origins from environment variables or use defaults
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'http://localhost:3000', 
        'http://127.0.0.1:3000', 
        'http://localhost:5173', 
        'http://127.0.0.1:5173',
        'https://substrate-explorer.onrender.com',
        'https://your-frontend-domain.netlify.app' // Update this with your actual frontend domain
      ];

  // Enable CORS
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Blockchain Explorer API')
    .setDescription('A simple blockchain explorer for Substrate networks')
    .setVersion('1.0')
    .addTag('search', 'Search operations for addresses and blocks')
    .addServer('https://substrate-explorer.onrender.com', 'Production Server')
    .addServer('http://localhost:3001', 'Local Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';
  
  await app.listen(port, host);
  
  const serverUrl = process.env.NODE_ENV === 'production' 
    ? 'https://substrate-explorer.onrender.com'
    : `http://localhost:${port}`;
    
  console.log(`🚀 Blockchain Explorer API is running on: ${serverUrl}`);
  console.log(`📚 API Documentation available at: ${serverUrl}/api/docs`);
}

bootstrap();
