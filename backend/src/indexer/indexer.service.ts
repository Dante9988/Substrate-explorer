import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DatabaseService } from '../database/database.service';

interface BlockData {
  number: number;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  timestamp: number;
  author?: string;
}

interface ExtrinsicData {
  hash: string;
  blockNumber: number;
  blockHash: string;
  extrinsicIndex: number;
  section: string;
  method: string;
  signer?: string;
  nonce?: number;
  args: any[];
  signature?: string;
  isSigned: boolean;
  success: boolean;
  events: EventData[];
}

interface EventData {
  blockNumber: number;
  blockHash: string;
  extrinsicHash?: string;
  extrinsicIndex?: number;
  eventIndex: number;
  section: string;
  method: string;
  data: any[];
}

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);
  private isIndexing = false;

  constructor(private readonly db: DatabaseService) {}

  /**
   * Index a new block with all its extrinsics and events
   */
  @OnEvent('block.new')
  async onNewBlock(blockData: BlockData) {
    try {
      // Check if block already exists
      const exists = await this.db.blockExists(blockData.number);
      if (exists) {
        this.logger.debug(`Block #${blockData.number} already indexed, skipping`);
        return;
      }

      this.logger.log(`📦 Indexing block #${blockData.number}`);

      await this.db.block.create({
        data: {
          number: blockData.number,
          hash: blockData.hash,
          parentHash: blockData.parentHash,
          stateRoot: blockData.stateRoot,
          extrinsicsRoot: blockData.extrinsicsRoot,
          timestamp: new Date(blockData.timestamp),
          author: blockData.author || null,
          extrinsicsCount: 0,
          eventsCount: 0,
        },
      });

      this.logger.log(`✅ Indexed block #${blockData.number}`);
    } catch (error) {
      this.logger.error(`Failed to index block #${blockData.number}:`, error);
    }
  }

  /**
   * Index block details with extrinsics and events
   */
  @OnEvent('block.details')
  async onBlockDetails(data: { blockNumber: number; extrinsics: ExtrinsicData[] }) {
    try {
      const { blockNumber, extrinsics } = data;

      if (extrinsics.length === 0) {
        return;
      }

      this.logger.log(`📊 Indexing ${extrinsics.length} extrinsics for block #${blockNumber}`);

      for (const ext of extrinsics) {
        await this.indexExtrinsic(ext);
      }

      // Update block extrinsics count
      await this.db.block.update({
        where: { number: blockNumber },
        data: {
          extrinsicsCount: extrinsics.length,
          eventsCount: extrinsics.reduce((sum, e) => sum + e.events.length, 0),
        },
      });

      this.logger.log(`✅ Indexed ${extrinsics.length} extrinsics for block #${blockNumber}`);
    } catch (error) {
      this.logger.error(`Failed to index block details for #${data.blockNumber}:`, error);
    }
  }

  /**
   * Index a single extrinsic with its events
   */
  private async indexExtrinsic(ext: ExtrinsicData) {
    try {
      // Check if extrinsic already exists
      const existing = await this.db.extrinsic.findUnique({
        where: { hash: ext.hash },
      });

      if (existing) {
        this.logger.debug(`Extrinsic ${ext.hash} already indexed, skipping`);
        return;
      }

      // Create extrinsic
      const extrinsic = await this.db.extrinsic.create({
        data: {
          hash: ext.hash,
          blockNumber: ext.blockNumber,
          blockHash: ext.blockHash,
          extrinsicIndex: ext.extrinsicIndex,
          section: ext.section,
          method: ext.method,
          signer: ext.signer || null,
          nonce: ext.nonce || null,
          args: JSON.stringify(ext.args),
          signature: ext.signature || null,
          isSigned: ext.isSigned,
          success: ext.success,
        },
      });

      // Create events
      if (ext.events && ext.events.length > 0) {
        await this.db.event.createMany({
          data: ext.events.map((event) => ({
            blockNumber: event.blockNumber,
            blockHash: event.blockHash,
            extrinsicHash: ext.hash,
            extrinsicIndex: ext.extrinsicIndex,
            eventIndex: event.eventIndex,
            section: event.section,
            method: event.method,
            data: JSON.stringify(event.data),
          })),
        });
      }

      // Index address relationships
      await this.indexAddressRelationships(ext);

      this.logger.debug(`Indexed extrinsic ${ext.hash.substring(0, 10)}...`);
    } catch (error) {
      this.logger.error(`Failed to index extrinsic ${ext.hash}:`, error);
    }
  }

  /**
   * Extract and index address relationships from an extrinsic
   */
  private async indexAddressRelationships(ext: ExtrinsicData) {
    const addresses = new Set<string>();

    // Add signer
    if (ext.signer) {
      addresses.add(ext.signer);
    }

    // Extract addresses from args
    this.extractAddressesFromArgs(ext.args, addresses);

    // Extract addresses from events
    for (const event of ext.events) {
      this.extractAddressesFromArgs(event.data, addresses);
    }

    // Index each address
    for (const address of addresses) {
      await this.indexAddress(address, ext);
    }
  }

  /**
   * Recursively extract addresses from arguments
   */
  private extractAddressesFromArgs(args: any, addresses: Set<string>) {
    if (!args) return;

    if (typeof args === 'string' && this.isSubstrateAddress(args)) {
      addresses.add(args);
    } else if (Array.isArray(args)) {
      for (const arg of args) {
        this.extractAddressesFromArgs(arg, addresses);
      }
    } else if (typeof args === 'object') {
      for (const value of Object.values(args)) {
        this.extractAddressesFromArgs(value, addresses);
      }
    }
  }

  /**
   * Check if a string is a valid Substrate address
   */
  private isSubstrateAddress(str: string): boolean {
    // Simple check: Substrate addresses typically start with '1', '5', or other prefixes and are 47-48 chars
    return typeof str === 'string' && str.length >= 47 && str.length <= 48 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(str);
  }

  /**
   * Index an address and link it to an extrinsic
   */
  private async indexAddress(address: string, ext: ExtrinsicData) {
    try {
      // Upsert address
      const addressRecord = await this.db.address.upsert({
        where: { address },
        create: {
          address,
          firstSeenBlock: ext.blockNumber,
          lastSeenBlock: ext.blockNumber,
          transactionCount: 1,
        },
        update: {
          lastSeenBlock: ext.blockNumber,
          transactionCount: { increment: 1 },
        },
      });

      // Determine role
      let role = 'participant';
      if (ext.signer === address) {
        role = 'signer';
      }

      // Link address to extrinsic
      await this.db.addressExtrinsic.create({
        data: {
          addressId: addressRecord.id,
          extrinsicHash: ext.hash,
          blockNumber: ext.blockNumber,
          role,
        },
      });

      this.logger.debug(`Indexed address ${address.substring(0, 10)}... for extrinsic ${ext.hash.substring(0, 10)}...`);
    } catch (error) {
      // Ignore unique constraint errors (address-extrinsic already exists)
      if (!error.message?.includes('Unique constraint')) {
        this.logger.error(`Failed to index address ${address}:`, error);
      }
    }
  }

  /**
   * Get indexer statistics
   */
  async getStats() {
    const [blockCount, extrinsicCount, addressCount, lastBlock] = await Promise.all([
      this.db.block.count(),
      this.db.extrinsic.count(),
      this.db.address.count(),
      this.db.getLastIndexedBlock(),
    ]);

    return {
      blocksIndexed: blockCount,
      extrinsicsIndexed: extrinsicCount,
      addressesIndexed: addressCount,
      lastIndexedBlock: lastBlock,
    };
  }
}

