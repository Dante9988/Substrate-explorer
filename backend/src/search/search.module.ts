import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [BlockchainModule, CacheModule],
  controllers: [SearchController],
})
export class SearchModule {}
