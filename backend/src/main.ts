import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get allowed origins from environment variables or use defaults
  const allowedOriginsList = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'http://localhost:3000', 
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:5173',
        'http://localhost:8080', 
        'http://127.0.0.1:5173',
        'https://substrate-explorer-production.up.railway.app',
        'https://substrate-explorer-frontend.vercel.app',
      ];

  // Enable CORS with function to handle Vercel preview deployments
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in the allowed list
      if (allowedOriginsList.includes(origin)) {
        return callback(null, true);
      }

      // Allow all Vercel preview deployments (*.vercel.app)
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // Allow all Vercel production deployments (exact match or subdomain)
      if (origin.includes('vercel.app')) {
        return callback(null, true);
      }

      // Reject other origins
      callback(new Error('Not allowed by CORS'));
    },
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
    .addServer('https://substrate-explorer-production.up.railway.app', 'Production Server')
    .addServer('http://localhost:8080', 'Local Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8080;
  const host = process.env.HOST || '0.0.0.0';
  
  // Debug logging to see what we're actually binding to
  console.log(`🔧 Binding to host: ${host}, port: ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 CORS configured - allowing: ${allowedOriginsList.join(', ')}, and all *.vercel.app domains`);
  
  await app.listen(port, host);
  
  // Log the actual binding
  console.log(`✅ Successfully bound to ${host}:${port}`);
  
  // Use Railway URL for production, localhost for development
  const serverUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : process.env.NODE_ENV === 'production'
    ? 'https://substrate-explorer-production.up.railway.app'
    : `http://localhost:${port}`;
    
  console.log(`🚀 Blockchain Explorer API is running on: ${serverUrl}`);
  console.log(`📚 API Documentation available at: ${serverUrl}/api/docs`);
  console.log(`🔗 Internal binding: ${host}:${port}`);
}

bootstrap();
