import { Injectable, Logger } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface BlockUpdate {
  blockNumber: number;
  blockHash: string;
  timestamp: string;
}

export interface TransactionUpdate {
  blockNumber: number;
  blockHash: string;
  extrinsicIndex: number;
  extrinsicHash: string;
  section: string;
  method: string;
  signer: string;
  timestamp: string;
}

export interface AddressUpdate {
  blockNumber: number;
  blockHash: string;
  extrinsicIndex: number;
  extrinsicHash: string;
  section: string;
  method: string;
  timestamp: string;
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private isMonitoring = false;

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Start real-time blockchain monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      this.logger.warn('Blockchain monitoring already started');
      return;
    }

    // Wait for blockchain service to be connected
    let retries = 0;
    const maxRetries = 10;
    
    while (!this.blockchainService.isConnected() && retries < maxRetries) {
      this.logger.log(`Waiting for blockchain connection... (attempt ${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries++;
    }

    if (!this.blockchainService.isConnected()) {
      this.logger.error('Blockchain service not connected after multiple attempts, cannot start monitoring');
      throw new Error('Blockchain service not connected');
    }

    try {
      this.logger.log('Starting real-time blockchain monitoring...');
      
      // Get the API instance from blockchain service
      const api = (this.blockchainService as any).api;
      if (!api) {
        throw new Error('Blockchain API not available');
      }
      
      this.logger.log('Blockchain API available, setting up subscriptions...');
      
      // Subscribe to new block headers
      const unsubscribeNewHeads = await api.rpc.chain.subscribeNewHeads((header: any) => {
        try {
          const blockNumber = header.number.toNumber();
          const blockHash = header.hash.toHex();
          
          this.logger.log(`🆕 New block #${blockNumber} detected: ${blockHash}`);
          
          // Emit block update event
          this.eventEmitter.emit('blockchain.newBlock', {
            blockNumber,
            blockHash,
            timestamp: new Date().toISOString()
          });
          
          // Get detailed block information
          this.processBlockDetails(blockNumber, blockHash);
        } catch (error) {
          this.logger.error('Error processing new block header:', error);
        }
      });
      
      // Subscribe to finalized blocks
      const unsubscribeFinalizedHeads = await api.rpc.chain.subscribeFinalizedHeads((header: any) => {
        try {
          const blockNumber = header.number.toNumber();
          const blockHash = header.hash.toHex();
          
          this.logger.log(`✅ Block #${blockNumber} finalized: ${blockHash}`);
          
          // Emit finalized block event
          this.eventEmitter.emit('blockchain.blockFinalized', {
            blockNumber,
            blockHash,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          this.logger.error('Error processing finalized block header:', error);
        }
      });
      
      this.isMonitoring = true;
      this.logger.log('✅ Real-time blockchain monitoring started successfully');
      
      // Store unsubscribe functions for cleanup
      (this as any).unsubscribeNewHeads = unsubscribeNewHeads;
      (this as any).unsubscribeFinalizedHeads = unsubscribeFinalizedHeads;
      
    } catch (error) {
      this.logger.error('Failed to start blockchain monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop real-time blockchain monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      this.logger.warn('Blockchain monitoring not started');
      return;
    }

    this.logger.log('Stopping blockchain monitoring...');
    
    try {
      // Unsubscribe from RPC calls
      if ((this as any).unsubscribeNewHeads) {
        await (this as any).unsubscribeNewHeads();
        this.logger.log('Unsubscribed from new heads');
      }
      
      if ((this as any).unsubscribeFinalizedHeads) {
        await (this as any).unsubscribeFinalizedHeads();
        this.logger.log('Unsubscribed from finalized heads');
      }
      
      this.isMonitoring = false;
      this.logger.log('✅ Blockchain monitoring stopped successfully');
      
    } catch (error) {
      this.logger.error('Error stopping blockchain monitoring:', error);
      // Still mark as stopped even if cleanup fails
      this.isMonitoring = false;
    }
  }

  /**
   * Process block details and emit transaction events
   */
  private async processBlockDetails(blockNumber: number, blockHash: string): Promise<void> {
    try {
      this.logger.log(`Processing block details for #${blockNumber}: ${blockHash}`);
      
      // Get block extrinsics
      const blockExtrinsics = await this.blockchainService.getBlockExtrinsics(blockHash);
      
      this.logger.log(`getBlockExtrinsics result for block #${blockNumber}:`, {
        hasResult: !!blockExtrinsics,
        resultType: typeof blockExtrinsics,
        hasExtrinsics: blockExtrinsics?.extrinsics ? 'yes' : 'no',
        extrinsicsType: typeof blockExtrinsics?.extrinsics,
        isArray: Array.isArray(blockExtrinsics?.extrinsics),
        extrinsicsLength: blockExtrinsics?.extrinsics?.length
      });
      
      if (!blockExtrinsics) {
        this.logger.warn(`No block extrinsics returned for block #${blockNumber}`);
        return;
      }
      
      if (!blockExtrinsics.extrinsics || !Array.isArray(blockExtrinsics.extrinsics)) {
        this.logger.warn(`Invalid extrinsics data for block #${blockNumber}:`, blockExtrinsics);
        return;
      }
      
      const extrinsicsCount = blockExtrinsics.extrinsics.length;
      this.logger.log(`Block #${blockNumber} has ${extrinsicsCount} extrinsics`);
      
      // Emit block details event
      this.eventEmitter.emit('blockchain.blockDetails', {
        blockNumber,
        blockHash,
        extrinsicsCount,
        timestamp: new Date().toISOString()
      });
      
      // Process each extrinsic and emit transaction events
      for (const extrinsic of blockExtrinsics.extrinsics) {
        try {
          // Emit new transaction event
          this.eventEmitter.emit('blockchain.newTransaction', {
            blockNumber,
            blockHash,
            extrinsicIndex: extrinsic.index,
            extrinsicHash: extrinsic.hash,
            section: extrinsic.section,
            method: extrinsic.method,
            signer: extrinsic.signer || 'N/A',
            timestamp: new Date().toISOString()
          });
          
          // Emit address-specific transaction event if signer is known
          if (extrinsic.signer && extrinsic.signer !== 'N/A') {
            this.eventEmitter.emit('blockchain.addressTransaction', {
              blockNumber,
              blockHash,
              extrinsicIndex: extrinsic.index,
              extrinsicHash: extrinsic.hash,
              section: extrinsic.section,
              method: extrinsic.method,
              timestamp: new Date().toISOString()
            });
          }
        } catch (extrinsicError) {
          this.logger.error(`Error processing extrinsic ${extrinsic.hash} in block #${blockNumber}:`, extrinsicError);
        }
      }
      
      this.logger.log(`Successfully processed ${extrinsicsCount} extrinsics for block #${blockNumber}`);
      
    } catch (error) {
      this.logger.error(`Failed to process block details for #${blockNumber}:`, error);
      
      // Still emit block details with 0 extrinsics if we can't get the details
      try {
        this.eventEmitter.emit('blockchain.blockDetails', {
          blockNumber,
          blockHash,
          extrinsicsCount: 0,
          timestamp: new Date().toISOString()
        });
      } catch (emitError) {
        this.logger.error(`Failed to emit fallback block details for #${blockNumber}:`, emitError);
      }
    }
  }

  /**
   * Get current monitoring status
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get blockchain connection status
   */
  isBlockchainConnected(): boolean {
    return this.blockchainService.isConnected();
  }
}
