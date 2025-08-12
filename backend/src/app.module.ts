import { Module } from '@nestjs/common';
import { SearchModule } from './search/search.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { WebSocketModule } from './websocket/websocket.module';
import { AppController } from './app.controller';

@Module({
  imports: [SearchModule, BlockchainModule, WebSocketModule],
  controllers: [AppController],
})
export class AppModule {}
