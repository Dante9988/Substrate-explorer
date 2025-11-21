import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [IndexerService],
  exports: [IndexerService],
})
export class IndexerModule {}

