import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BlockchainWebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { WebSocketController } from './websocket.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    BlockchainModule
  ],
  controllers: [WebSocketController],
  providers: [BlockchainWebSocketGateway, WebSocketService],
  exports: [WebSocketService]
})
export class WebSocketModule {}
