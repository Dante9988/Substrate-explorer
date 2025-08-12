import { Module } from '@nestjs/common';
import { SearchModule } from './search/search.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [SearchModule, BlockchainModule, WebSocketModule],
})
export class AppModule {}
