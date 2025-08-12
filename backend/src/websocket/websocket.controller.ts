import { Controller, Post, Get, Delete, Logger } from '@nestjs/common';
import { WebSocketService } from './websocket.service';

@Controller('websocket')
export class WebSocketController {
  private readonly logger = new Logger(WebSocketController.name);

  constructor(private readonly webSocketService: WebSocketService) {}

  @Post('monitoring/start')
  async startMonitoring() {
    try {
      await this.webSocketService.startMonitoring();
      return { success: true, message: 'Monitoring started successfully' };
    } catch (error) {
      this.logger.error('Failed to start monitoring:', error);
      return { success: false, error: error.message };
    }
  }

  @Delete('monitoring/stop')
  async stopMonitoring() {
    try {
      await this.webSocketService.stopMonitoring();
      return { success: true, message: 'Monitoring stopped successfully' };
    } catch (error) {
      this.logger.error('Failed to stop monitoring:', error);
      return { success: false, error: error.message };
    }
  }

  @Get('monitoring/status')
  async getMonitoringStatus() {
    return {
      isMonitoring: this.webSocketService.isMonitoringActive(),
      isBlockchainConnected: this.webSocketService.isBlockchainConnected(),
      timestamp: new Date().toISOString()
    };
  }
}
