import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SearchModule } from './search/search.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { WebSocketModule } from './websocket/websocket.module';
import { DatabaseModule } from './database/database.module';
import { IndexerModule } from './indexer/indexer.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DatabaseModule,
    IndexerModule,
    SearchModule,
    BlockchainModule,
    WebSocketModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
