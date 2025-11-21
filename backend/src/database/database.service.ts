import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('📊 Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('📊 Database disconnected');
  }

  // Helper method to check if a block exists
  async blockExists(blockNumber: number): Promise<boolean> {
    const count = await this.block.count({
      where: { number: blockNumber }
    });
    return count > 0;
  }

  // Helper method to get the last indexed block
  async getLastIndexedBlock(): Promise<number | null> {
    const lastBlock = await this.block.findFirst({
      orderBy: { number: 'desc' },
      select: { number: true }
    });
    return lastBlock?.number || null;
  }

  // Helper method to get the first indexed block
  async getFirstIndexedBlock(): Promise<number | null> {
    const firstBlock = await this.block.findFirst({
      orderBy: { number: 'asc' },
      select: { number: true }
    });
    return firstBlock?.number || null;
  }

  // Get extrinsics for an address with full details
  async getAddressExtrinsics(address: string, limit: number = 100) {
    const addressRecord = await this.address.findUnique({
      where: { address },
      include: {
        extrinsics: {
          include: {
            extrinsic: {
              include: {
                events: true
              }
            }
          },
          orderBy: { blockNumber: 'desc' },
          take: limit
        }
      }
    });

    if (!addressRecord) {
      return [];
    }

    return addressRecord.extrinsics.map(ae => {
      try {
        return {
          ...ae.extrinsic,
          args: ae.extrinsic.args ? JSON.parse(ae.extrinsic.args) : [],
          events: (ae.extrinsic.events || []).map(e => ({
            ...e,
            data: e.data ? JSON.parse(e.data) : []
          }))
        };
      } catch (error) {
        // If JSON parsing fails, return with raw strings
        return {
          ...ae.extrinsic,
          args: ae.extrinsic.args || [],
          events: (ae.extrinsic.events || []).map(e => ({
            ...e,
            data: e.data || []
          }))
        };
      }
    });
  }

  // Get block by number with all relations
  async getBlockByNumber(blockNumber: number) {
    return this.block.findUnique({
      where: { number: blockNumber },
      include: {
        extrinsics: {
          include: {
            events: true
          }
        },
        events: true
      }
    });
  }

  // Get block by hash
  async getBlockByHash(hash: string) {
    return this.block.findUnique({
      where: { hash },
      include: {
        extrinsics: {
          include: {
            events: true
          }
        },
        events: true
      }
    });
  }

  // Get extrinsic by hash
  async getExtrinsicByHash(hash: string) {
    return this.extrinsic.findUnique({
      where: { hash },
      include: {
        block: true,
        events: true
      }
    });
  }

  // Update indexer state
  async setIndexerState(key: string, value: string) {
    return this.indexerState.upsert({
      where: { key },
      create: { key, value },
      update: { value }
    });
  }

  // Get indexer state
  async getIndexerState(key: string): Promise<string | null> {
    const state = await this.indexerState.findUnique({
      where: { key }
    });
    return state?.value || null;
  }
}

