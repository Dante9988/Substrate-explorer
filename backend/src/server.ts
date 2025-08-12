import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BlockchainService } from './blockchain/blockchain.service';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const logger = new Logger('Server');
  
  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS for frontend communication
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });
    
    // Use Socket.IO adapter for WebSocket support
    app.useWebSocketAdapter(new IoAdapter(app));
    
    // Start the application
    const port = process.env.PORT || 3001;
    await app.listen(port);
    
    logger.log(`🚀 NestJS application is running on: http://localhost:${port}`);
    logger.log(`🔌 WebSocket server is ready for connections`);
    
    // Get the blockchain service and check connection
    const blockchainService = app.get(BlockchainService);
    
    // Wait a bit for the service to be fully initialized
    setTimeout(async () => {
      try {
        // Check if blockchain service is connected
        if (blockchainService.isConnected()) {
          logger.log('✅ Blockchain service is connected and ready');
          logger.log('🔄 WebSocket monitoring will start automatically when clients connect');
        } else {
          logger.warn('⚠️ Blockchain service not connected, monitoring will start when connection is established');
        }
      } catch (error) {
        logger.error('❌ Error checking blockchain service status:', error);
      }
    }, 2000);
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  const logger = new Logger('Server');
  logger.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  const logger = new Logger('Server');
  logger.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

bootstrap();
