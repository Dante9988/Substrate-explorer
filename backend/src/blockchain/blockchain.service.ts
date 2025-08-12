import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { EventRecord } from '@polkadot/types/interfaces';
import { Keyring } from '@polkadot/keyring';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { TxHit, SubstrateAccount, TransferResult, StakingResult, BatchTransferResult, BlockExtrinsics, BlockInfo } from '@blockchain-explorer/shared';
import { mnemonicGenerate, mnemonicValidate, cryptoWaitReady } from '@polkadot/util-crypto';
import { blockchainConfig } from '../config/blockchain.config';

// Temporary fix for MAX_BLOCKS_TO_SCAN import issue
const MAX_BLOCKS_TO_SCAN = 10000;

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private api: ApiPromise | null = null;
  private wsProvider: WsProvider | null = null;

  async onModuleInit() {
    await this.connect();
  }

  /**
   * Connects to the Substrate blockchain via WebSocket.
   */
  async connect(): Promise<void> {
    try {
      this.logger.log(`Connecting to Substrate blockchain at: ${blockchainConfig.rpcEndpoint}`);
      this.wsProvider = new WsProvider(blockchainConfig.rpcEndpoint);
      this.api = await ApiPromise.create({ 
        provider: this.wsProvider,
        throwOnConnect: true,
        noInitWarn: true,
      });
      
      this.logger.log('Connected to Substrate blockchain');
      
      // Listen for connection status
      this.api.on('connected', () => {
        this.logger.log('Connected to blockchain');
      });
      
      this.api.on('disconnected', () => {
        this.logger.warn('Disconnected from blockchain');
      });
      
      this.api.on('error', (error) => {
        this.logger.error('Blockchain connection error:', error);
      });
    } catch (error) {
      this.logger.error(`Failed to connect to blockchain at ${blockchainConfig.rpcEndpoint}:`, error);
      throw error;
    }
  }

  /**
   * Disconnects from the blockchain.
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
    if (this.wsProvider) {
      this.wsProvider.disconnect();
      this.wsProvider = null;
    }
    this.logger.log('Disconnected from blockchain');
  }

  /**
   * Gets the current connection status.
   */
  isConnected(): boolean {
    return this.api !== null && this.api.isConnected;
  }

  /**
   * Gets the current RPC endpoint.
   */
  getRpcEndpoint(): string {
    return blockchainConfig.rpcEndpoint;
  }

  /**
   * Changes the RPC endpoint and reconnects.
   */
  async changeRpcEndpoint(newEndpoint: string): Promise<void> {
    // Validate the endpoint format
    if (!newEndpoint.startsWith('wss://') && !newEndpoint.startsWith('ws://')) {
      throw new Error('Invalid RPC endpoint. Must start with wss:// or ws://');
    }

    this.logger.log(`Changing RPC endpoint from ${blockchainConfig.rpcEndpoint} to ${newEndpoint}`);
    
    // Disconnect from current endpoint
    if (this.api) {
      await this.disconnect();
    }

    // Update the configuration
    blockchainConfig.rpcEndpoint = newEndpoint;
    
    // Reconnect to new endpoint
    await this.connect();
  }

  /**
   * Searches for transactions and events related to a specific address using optimized Polkadot.js API methods.
   * This method combines efficient API calls with smart block scanning for comprehensive results.
   * @param address The address to search for.
   * @param blocksToScan The number of recent blocks to scan (default: 1000 for better coverage).
   * @param batchSize The number of blocks to process in each concurrent batch.
   * @returns A promise that resolves to an array of transaction hits.
   */
  async searchAddressInRecentBlocks(address: string, blocksToScan: number = 10000, batchSize: number = 100): Promise<TxHit[]> {
    if (!this.api) {
      throw new Error('API not initialized. Please call connect() first.');
    }

    // Validate input parameters to prevent hanging
    if (!address || typeof address !== 'string' || address.trim() === '') {
      throw new Error('Invalid address: address must be a non-empty string');
    }
    
    if (!Number.isInteger(blocksToScan) || blocksToScan <= 0 || blocksToScan > MAX_BLOCKS_TO_SCAN) {
      throw new Error(`Invalid blocksToScan: must be a positive integer <= ${MAX_BLOCKS_TO_SCAN}, got ${blocksToScan}`);
    }
    
    if (!Number.isInteger(batchSize) || batchSize <= 0 || batchSize > 100) {
      throw new Error(`Invalid batchSize: must be a positive integer <= 100, got ${batchSize}`);
    }

    // Log coverage warning for testing purposes
    const blocksPerEra = 120; // Creditcoin dryrun: 120 blocks per era
    const erasCovered = Math.floor(blocksToScan / blocksPerEra);
    const timeCoverage = Math.floor(erasCovered * 10); // 10 minutes per era
    const hoursCoverage = Math.floor(timeCoverage / 60);
    
    this.logger.warn(`⚠️ TESTING MODE: Address search in ${blocksToScan} blocks covers only ${erasCovered} eras (${timeCoverage} minutes = ~${hoursCoverage} hours)`);
    this.logger.warn(`⚠️ For production use, consider implementing a proper address indexer`);

    try {
      // Step 1: Get account information to see if the address exists and get current state
      const accountInfo = await this.api.query.system.account(address);
      const accountData = accountInfo.toHuman();
      
      this.logger.log(`Found account info for ${address}:`, accountData);
      
      // Step 2: Try to get recent events that might be related to this address
      // This is more efficient than scanning all blocks
      const latestHeader = await this.api.rpc.chain.getHeader();
      const lastBlock = latestHeader.number.toNumber();
      
      this.logger.log(`Starting search for address ${address} in ${blocksToScan} blocks from block #${lastBlock}`);
      
      // Step 3: Use events query to find address-related activity more efficiently
      // We'll check recent blocks for events first, then fall back to full extrinsic scanning
      const eventsResults = await this.searchAddressInEvents(address, Math.min(blocksToScan, 100));
      
      if (eventsResults.length > 0) {
        this.logger.log(`Found ${eventsResults.length} events for ${address} in recent blocks`);
        // If we found events, we can use them to identify which blocks to scan more thoroughly
        const blocksWithActivity = new Set(eventsResults.map(result => result.blockNumber));
        
        // Scan only blocks with confirmed activity + some surrounding blocks for context
        const blocksToScanOptimized = this.optimizeBlockScan(blocksWithActivity, lastBlock, blocksToScan);
        this.logger.log(`Optimized scan will check ${blocksToScanOptimized.length} blocks for address ${address}`);
        return await this.scanOptimizedBlocks(address, blocksToScanOptimized, batchSize);
      }
      
      this.logger.log(`No events found for ${address}, proceeding with full block scan`);
      
    } catch (error) {
      this.logger.log(`No account info found for ${address}, proceeding with full block scan`);
    }

    // Fall back to the efficient block scanning method if no events found
    this.logger.log(`Starting full scan from block #${await this.getLatestBlockNumber()} for ${blocksToScan} blocks with batch size ${batchSize}`);
    const results = await this.scanBlocksEfficiently(address, blocksToScan, batchSize);
    this.logger.log(`Full scan complete for address ${address}. Found ${results.length} results.`);
    return results;
  }

  /**
   * Searches for address-related events in recent blocks using Polkadot.js API events query.
   * This is more efficient than scanning all extrinsics.
   * @param address The address to search for.
   * @param blocksToScan Number of recent blocks to check for events.
   * @returns Array of transaction hits found through events.
   */
  private async searchAddressInEvents(address: string, blocksToScan: number): Promise<TxHit[]> {
    const results: TxHit[] = [];
    const latestBlock = await this.getLatestBlockNumber();
    
    for (let blockNumber = latestBlock; blockNumber >= Math.max(1, latestBlock - blocksToScan); blockNumber--) {
      try {
        const blockHash = await this.api.rpc.chain.getBlockHash(blockNumber);
        const events = await this.api.query.system.events.at(blockHash);
        
        // Check if any events are related to this address
        const addressEvents = (events as unknown as any[]).filter(event => {
          const eventData = event.event.data;
          // Check if the address appears in event data
          return eventData.some(data => 
            data.toString().includes(address) || 
            (typeof data === 'object' && data.toHuman && data.toHuman().toString().includes(address))
          );
        });
        
        if (addressEvents.length > 0) {
          // Found events related to this address, add to results
          for (const event of addressEvents) {
                       results.push({
             blockNumber,
             blockHash: blockHash.toHex(),
             extrinsicIndex: event.phase.isApplyExtrinsic ? event.phase.asApplyExtrinsic.toNumber() : -1,
             extrinsicHash: 'N/A', // We'll get this when scanning the block
             section: event.event.section,
             method: event.event.method,
             data: event.event.data.map(d => d.toHuman()),
           });
          }
        }
      } catch (error) {
        // Continue to next block if there's an error
        continue;
      }
    }
    
    return results;
  }

  /**
   * Optimizes block scanning by focusing on blocks with confirmed activity.
   * @param blocksWithActivity Set of block numbers with confirmed address activity.
   * @param latestBlock Latest block number.
   * @param maxBlocks Maximum number of blocks to scan.
   * @returns Optimized array of block numbers to scan.
   */
  private optimizeBlockScan(blocksWithActivity: Set<number>, latestBlock: number, maxBlocks: number): number[] {
    const blocksToScan = new Set<number>();
    
    // Add blocks with confirmed activity
    blocksWithActivity.forEach(blockNum => blocksToScan.add(blockNum));
    
    // Add surrounding blocks for context (e.g., ±2 blocks around each active block)
    blocksWithActivity.forEach(blockNum => {
      for (let i = Math.max(1, blockNum - 2); i <= Math.min(latestBlock, blockNum + 2); i++) {
        blocksToScan.add(i);
      }
    });
    
    // Add some recent blocks to ensure we don't miss anything
    for (let i = latestBlock; i >= Math.max(1, latestBlock - 50); i--) {
      blocksToScan.add(i);
    }
    
    // Convert to sorted array and limit to maxBlocks
    return Array.from(blocksToScan).sort((a, b) => b - a).slice(0, maxBlocks);
  }

  /**
   * Scans optimized blocks for address activity.
   * @param address Address to search for.
   * @param blockNumbers Array of block numbers to scan.
   * @param batchSize Batch size for processing.
   * @returns Array of transaction hits.
   */
  private async scanOptimizedBlocks(address: string, blockNumbers: number[], batchSize: number): Promise<TxHit[]> {
    let allResults: TxHit[] = [];
    
    for (let i = 0; i < blockNumbers.length; i += batchSize) {
      const batch = blockNumbers.slice(i, i + Math.min(batchSize, blockNumbers.length - i));
      this.logger.log(`Processing optimized batch of ${batch.length} blocks: from #${batch[0]} to #${batch[batch.length - 1]}`);
      
      const batchResults = await Promise.all(
        batch.map(blockNumber => this.processBlock(address, blockNumber))
      );
      
      const batchTotal = batchResults.reduce((sum, results) => sum + results.length, 0);
      this.logger.log(`Optimized batch ${Math.floor(i / batchSize) + 1} returned ${batchTotal} results for address ${address}`);
      
      allResults = allResults.concat(...batchResults);
    }
    
    this.logger.log(`Optimized scan complete for address ${address}. Found ${allResults.length} results.`);
    return allResults;
  }

  /**
   * Efficiently scans blocks for address activity using the original method.
   * @param address Address to search for.
   * @param blocksToScan Number of blocks to scan.
   * @param batchSize Batch size for processing.
   * @returns Array of transaction hits.
   */
  private async scanBlocksEfficiently(address: string, blocksToScan: number, batchSize: number): Promise<TxHit[]> {
    const latestHeader = await this.api.rpc.chain.getHeader();
    const lastBlock = latestHeader.number.toNumber();
    this.logger.log(`Starting efficient scan from block #${lastBlock} for ${blocksToScan} blocks with batch size ${batchSize}`);

    const blockNumbersToScan = Array.from({ length: blocksToScan }, (_, i) => lastBlock - i).filter(n => n > 0);

    let allResults: TxHit[] = [];
    for (let i = 0; i < blockNumbersToScan.length; i += batchSize) {
      const batch = blockNumbersToScan.slice(i, i + Math.min(batchSize, blockNumbersToScan.length - i));
      this.logger.log(`Processing batch of ${batch.length} blocks: from #${batch[0]} to #${batch[batch.length - 1]}`);
      
      const batchResults = await Promise.all(
        batch.map(blockNumber => this.processBlock(address, blockNumber))
      );
      
      const batchTotal = batchResults.reduce((sum, results) => sum + results.length, 0);
      this.logger.log(`Batch ${Math.floor(i / batchSize) + 1} returned ${batchTotal} results for address ${address}`);
      
      allResults = allResults.concat(...batchResults);
    }

    this.logger.log(`Efficient scan complete. Found ${allResults.length} results.`);
    return allResults;
  }

  /**
   * Processes a single block to find transactions and events related to a specific address.
   * @param address The address to search for.
   * @param blockNumber The block number to process.
   * @returns A promise that resolves to an array of transaction hits found in the block.
   */
  private async processBlock(address: string, blockNumber: number): Promise<TxHit[]> {
    if (!this.api) {
      throw new Error('API not initialized.');
    }
  
    const results: TxHit[] = [];
    try {
      const blockHash = await this.api.rpc.chain.getBlockHash(blockNumber);
      const signedBlock = await this.api.rpc.chain.getBlock(blockHash);
      const allRecords = await this.api.query.system.events.at(blockHash);
      
      this.logger.debug(`Processing block #${blockNumber} with ${signedBlock.block.extrinsics.length} extrinsics for address ${address}`);
  
      // Process extrinsics
      for (let extrinsicIndex = 0; extrinsicIndex < signedBlock.block.extrinsics.length; extrinsicIndex++) {
        const ex = signedBlock.block.extrinsics[extrinsicIndex];
        
        // Only include extrinsics that are related to the search address
        if (ex.isSigned && ex.signer.toString() === address) {
          this.logger.debug(`Found extrinsic for address ${address} in block #${blockNumber}: ${ex.method.section}.${ex.method.method}`);
          
          // Get events associated with this extrinsic
          const extrinsicEvents = (allRecords as unknown as EventRecord[]).filter((event) => {
            const phase = event.phase;
            return phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(extrinsicIndex);
          });
          
          const hit = {
            blockNumber: blockNumber,
            blockHash: blockHash.toHex(),
            section: ex.method.section,
            method: ex.method.method,
            data: ex.method.args.map(a => a.toHuman() as string),
            extrinsicHash: ex.hash.toHex(),
            extrinsicIndex,
            signer: ex.signer.toString(),
            nonce: ex.nonce?.toNumber() || 0,
            args: ex.method.args.map(a => a.toHuman()),
            events: extrinsicEvents.map(event => ({
              section: event.event.section,
              method: event.event.method,
              data: event.event.data.map(d => d.toHuman()),
            })),
          };
          
          this.logger.debug(`Created TxHit for extrinsic: ${JSON.stringify({
            section: hit.section,
            method: hit.method,
            extrinsicHash: hit.extrinsicHash,
            argsCount: hit.args.length,
            eventsCount: hit.events.length
          })}`);
          
          results.push(hit);
        }
      }
      
      // Also check events for the address (events not tied to extrinsics)
      (allRecords as unknown as EventRecord[]).forEach((record, eventIndex) => {
        const { event, phase } = record;
        const eventData = event.data.map(d => d.toHuman());
        
        // Check if any event data contains the search address
        if (eventData.some(d => typeof d === 'string' && d === address)) {
          this.logger.debug(`Found event for address ${address} in block #${blockNumber}: ${event.section}.${event.method}`);
          
          let extrinsicHash = 'N/A';
          let extrinsicIndex: number | undefined;
          
          if (phase.isApplyExtrinsic) {
            extrinsicIndex = phase.asApplyExtrinsic.toNumber();
            extrinsicHash = signedBlock.block.extrinsics[extrinsicIndex].hash.toHex();
          }
          
          const hit = {
            blockNumber: blockNumber,
            blockHash: blockHash.toHex(),
            section: event.section,
            method: event.method,
            data: eventData as string[],
            extrinsicHash,
            extrinsicIndex,
            eventIndex,
            signer: 'N/A', // Events don't have direct signer info
            nonce: 0, // Events don't have direct nonce info
            args: eventData as any[],
            events: [{
              section: event.section,
              method: event.method,
              data: eventData as any[]
            }],
          };
          
          results.push(hit);
        }
      });
      
      if (results.length > 0) {
        this.logger.debug(`Block #${blockNumber} returned ${results.length} results for address ${address}`);
      }
    } catch (error) {
      this.logger.error(`Error processing block #${blockNumber}:`, error);
    }
  
    return results;
  }

  /**
   * Gets information about a specific block.
   */
  async getBlockInfo(blockNumber: number) {
    if (!this.api) {
      throw new Error('API not initialized.');
    }

    try {
      const blockHash = await this.api.rpc.chain.getBlockHash(blockNumber);
      const signedBlock = await this.api.rpc.chain.getBlock(blockHash);
      const header = await this.api.rpc.chain.getHeader(blockHash);
      
      // Get events for this block to count them
      const allEvents = await this.api.query.system.events.at(blockHash);
      const eventsCount = (allEvents as any).length || 0;
      
      // Process extrinsics with their events
      const extrinsicsWithEvents = signedBlock.block.extrinsics.map((extrinsic, index) => {
        const extrinsicHash = extrinsic.hash.toHex();
        const extrinsicEvents = (allEvents as unknown as any[]).filter((event) => {
          const phase = event.phase;
          return phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index);
        });

        return {
          index,
          hash: extrinsicHash,
          section: extrinsic.method.section,
          method: extrinsic.method.method,
          signer: extrinsic.isSigned ? extrinsic.signer.toString() : 'N/A',
          nonce: extrinsic.nonce?.toNumber() || 0,
          args: extrinsic.method.args.map(arg => arg.toHuman()),
          events: extrinsicEvents.map(event => ({
            section: event.event.section,
            method: event.event.method,
            data: event.event.data.map(d => d.toHuman()),
          })),
        };
      });

      // Get standalone events (not associated with extrinsics)
      let standaloneEvents = [];
      try {
        standaloneEvents = (allEvents as unknown as any[]).filter((event) => {
          const phase = event.phase;
          return !phase.isApplyExtrinsic;
        }).map((event, index) => ({
          index: extrinsicsWithEvents.length + index,
          section: event.event.section,
          method: event.event.method,
          data: event.event.data.map(d => d.toHuman()),
          phase: event.phase.toHuman(),
          extrinsicIndex: null,
        }));
      } catch (error) {
        this.logger.warn(`Failed to process standalone events for block ${blockNumber}:`, error.message);
      }

      return {
        number: blockNumber,
        hash: blockHash.toHex(),
        parentHash: header.parentHash.toHex(),
        stateRoot: header.stateRoot.toHex(),
        extrinsicsRoot: header.extrinsicsRoot.toHex(),
        timestamp: Date.now(), // Current timestamp as fallback
        extrinsicsCount: signedBlock.block.extrinsics.length,
        eventsCount: eventsCount,
        extrinsics: extrinsicsWithEvents,
        events: standaloneEvents,
      };
    } catch (error) {
      // Check for specific blockchain errors
      if (error.message.includes('Unable to retrieve header') || 
          error.message.includes('Block not found') ||
          error.message.includes('Unable to retrieve header and parent')) {
        throw new Error('Block not found');
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Gets block information by block hash.
   * @param blockHash The hash of the block to retrieve.
   * @returns A promise that resolves to block information.
   */
  async getBlockInfoByHash(blockHash: string): Promise<BlockInfo> {
    if (!this.api) {
      throw new Error('API not initialized.');
    }

    // Validate block hash format
    if (!blockHash.startsWith('0x') || blockHash.length !== 66) {
      throw new Error('Invalid block hash format. Expected 0x-prefixed 64-character hex string.');
    }

    try {
      // Get the block header first to validate the hash
      const header = await this.api.rpc.chain.getHeader(blockHash);
      if (!header) {
        throw new Error('Block not found');
      }

      // Additional validation: ensure this is actually a block header
      // Block headers should have a number, parentHash, stateRoot, etc.
      if (!header.number || !header.parentHash || !header.stateRoot) {
        throw new Error('Invalid block header - missing required fields');
      }

      const blockNumber = header.number.toNumber();
      
      // Additional validation: block number should be reasonable
      if (blockNumber <= 0 || blockNumber > 1000000000) {
        throw new Error('Invalid block number in header');
      }
      
      // Get the signed block for extrinsics
      const signedBlock = await this.api.rpc.chain.getBlock(blockHash);
      if (!signedBlock) {
        throw new Error('Block not found');
      }

      // Additional validation: ensure this is actually a block
      if (!signedBlock.block || !signedBlock.block.extrinsics) {
        throw new Error('Invalid block structure - missing extrinsics');
      }

      // Get all events for this block
      const allEvents = await this.api.query.system.events.at(blockHash);
      const eventsCount = (allEvents as any).length || 0;

      // Process extrinsics with their events
      const extrinsicsWithEvents = signedBlock.block.extrinsics.map((extrinsic, index) => {
        const extrinsicHash = extrinsic.hash.toHex();
        const extrinsicEvents = (allEvents as unknown as any[]).filter((event) => {
          const phase = event.phase;
          return phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index);
        });

        return {
          index,
          hash: extrinsicHash,
          section: extrinsic.method.section,
          method: extrinsic.method.method,
          signer: extrinsic.isSigned ? extrinsic.signer.toString() : 'N/A',
          nonce: extrinsic.nonce?.toNumber() || 0,
          args: extrinsic.method.args.map(arg => arg.toHuman()),
          events: extrinsicEvents.map(event => ({
            section: event.event.section,
            method: event.event.method,
            data: event.event.data.map(d => d.toHuman()),
            phase: event.phase.toHuman(),
          })),
        };
      });

      // Get standalone events (not associated with extrinsics)
      let standaloneEvents = [];
      try {
        standaloneEvents = (allEvents as unknown as any[]).filter((event) => {
          const phase = event.phase;
          return !phase.isApplyExtrinsic;
        }).map((event, index) => ({
          index: extrinsicsWithEvents.length + index,
          section: event.event.section,
          method: event.event.method,
          data: event.event.data.map(d => d.toHuman()),
          phase: event.phase.toHuman(),
          extrinsicIndex: null,
        }));
      } catch (error) {
        this.logger.warn(`Failed to process standalone events for block ${blockHash}:`, error.message);
      }

      return {
        number: blockNumber,
        hash: blockHash,
        parentHash: header.parentHash.toHex(),
        stateRoot: header.stateRoot.toHex(),
        extrinsicsRoot: header.extrinsicsRoot.toHex(),
        timestamp: Date.now(), // Note: This is approximate, could be enhanced with actual block timestamp
        extrinsicsCount: signedBlock.block.extrinsics.length,
        eventsCount: eventsCount,
        extrinsics: extrinsicsWithEvents,
        events: standaloneEvents,
      };
    } catch (error) {
      // Log the actual error for debugging
      this.logger.error(`Error in getBlockInfoByHash for ${blockHash}:`, error);
      
      if (error.message.includes('Block not found') || 
          error.message.includes('Unable to retrieve header') ||
          error.message.includes('Invalid block header') ||
          error.message.includes('Invalid block structure')) {
        throw new Error('Block not found');
      }
      throw error;
    }
  }

  /**
   * Gets the latest block number.
   */
  async getLatestBlockNumber(): Promise<number> {
    if (!this.api) {
      throw new Error('API not initialized.');
    }

    const header = await this.api.rpc.chain.getHeader();
    return header.number.toNumber();
  }

  /**
   * Gets the latest block with detailed information.
   */
  async getLatestBlockInfo(): Promise<{
    number: number;
    hash: string;
    timestamp: number;
    extrinsicsCount: number;
    eventsCount: number;
  }> {
    if (!this.api) {
      throw new Error('API not initialized.');
    }

    try {
      const header = await this.api.rpc.chain.getHeader();
      const blockNumber = header.number.toNumber();
      const blockHash = header.hash.toHex();
      
      // Get the signed block for extrinsics count
      const signedBlock = await this.api.rpc.chain.getBlock(blockHash);
      const extrinsicsCount = signedBlock.block.extrinsics.length;
      
      // Get events count
      const allEvents = await this.api.query.system.events.at(blockHash);
      const eventsCount = (allEvents as any).length || 0;

      return {
        number: blockNumber,
        hash: blockHash,
        timestamp: Date.now(),
        extrinsicsCount,
        eventsCount,
      };
    } catch (error) {
      this.logger.error('Failed to get latest block info:', error);
      throw error;
    }
  }

  /**
   * Gets network information.
   */
  async getNetworkInfo() {
    if (!this.api) {
      throw new Error('API not initialized.');
    }

    try {
      const [chain, nodeName, nodeVersion, properties, currentEra, activeEra] = await Promise.all([
        this.api.rpc.system.chain(),
        this.api.rpc.system.name(),
        this.api.rpc.system.version(),
        this.api.rpc.system.properties(),
        this.api.query.staking.currentEra(),
        this.api.query.staking.activeEra(),
      ]);

      const latestBlock = await this.getLatestBlockNumber();

      // Calculate era information for Creditcoin dryrun
      let currentEraNumber = 0;
      let activeEraNumber = 0;
      let activeEraStart = 0;
      
      try {
        // Debug logging for era data
        this.logger.debug(`Raw currentEra data: ${JSON.stringify(currentEra)}`);
        this.logger.debug(`Raw activeEra data: ${JSON.stringify(activeEra)}`);
        
        // Try to get the current era start block more reliably
        let eraStartBlock = 0;
        try {
          // Query the current era start block directly from the blockchain (same as Polkadot.js)
          this.logger.debug(`Querying staking.erasStart(${currentEraNumber}) from blockchain...`);
          const currentEraStart = await this.api.query.staking.erasStart(currentEraNumber);
          this.logger.debug(`Raw erasStart response: ${JSON.stringify(currentEraStart)}`);
          
          if (currentEraStart && typeof (currentEraStart as any).toNumber === 'function') {
            eraStartBlock = (currentEraStart as any).toNumber();
            this.logger.debug(`Found era start block from blockchain erasStart(): ${eraStartBlock}`);
          } else if (currentEraStart && (currentEraStart as any).value !== undefined) {
            eraStartBlock = (currentEraStart as any).value;
            this.logger.debug(`Found era start block from blockchain erasStart().value: ${eraStartBlock}`);
          } else if (currentEraStart && typeof currentEraStart === 'number') {
            eraStartBlock = currentEraStart;
            this.logger.debug(`Found era start block from blockchain erasStart() directly: ${eraStartBlock}`);
          }
        } catch (eraStartError) {
          this.logger.debug(`Could not get era start from blockchain erasStart(): ${eraStartError}`);
        }
        
        // Handle currentEra data structure - exactly like Polkadot.js
        if (currentEra) {
          this.logger.debug(`Processing currentEra data: ${JSON.stringify(currentEra)}`);
          
          if (typeof (currentEra as any).toNumber === 'function') {
            currentEraNumber = (currentEra as any).toNumber();
          } else {
            currentEraNumber = currentEra as any;
          }
          this.logger.debug(`Got currentEra: ${currentEraNumber}`);
        }
        
        // Handle activeEra data structure (PalletStakingActiveEraInfo) - exactly like Polkadot.js
        if (activeEra) {
          this.logger.debug(`Processing activeEra data: ${JSON.stringify(activeEra)}`);
          
          // Get the index directly from the structure like Polkadot.js shows: { index: 102, start: 1,754,997,220,000 }
          if ((activeEra as any).index) {
            if (typeof (activeEra as any).index.toNumber === 'function') {
              activeEraNumber = (activeEra as any).index.toNumber();
            } else {
              activeEraNumber = (activeEra as any).index;
            }
            this.logger.debug(`Got activeEra.index: ${activeEraNumber}`);
          }
        }
        
        // Handle activeEra.start data structure - exactly like Polkadot.js shows
        if (activeEra && (activeEra as any).start) {
          this.logger.debug(`Processing activeEra.start data: ${JSON.stringify((activeEra as any).start)}`);
          
          // Get the start directly from the structure like Polkadot.js shows: { index: 102, start: 1,754,997,220,000 }
          if (typeof (activeEra as any).start.toNumber === 'function') {
            activeEraStart = (activeEra as any).start.toNumber();
          } else {
            activeEraStart = (activeEra as any).start;
          }
          this.logger.debug(`Got activeEra.start: ${activeEraStart}`);
        }
        
        // Use the most reliable era start block we can find
        if (eraStartBlock > 0) {
          activeEraStart = eraStartBlock;
          this.logger.debug(`Using blockchain era start block: ${activeEraStart}`);
        } else if (activeEraStart <= 0 || activeEraStart === latestBlock) {
          // Calculate the start block of the current era as fallback
          // Each era is 120 blocks, so find the start of the current era
          const currentEraStartBlock = Math.floor(latestBlock / 120) * 120;
          activeEraStart = currentEraStartBlock;
          this.logger.debug(`Calculated era start block: ${activeEraStart} from latest block: ${latestBlock}`);
        }
      } catch (eraError) {
        this.logger.warn('Could not parse era data, using defaults:', eraError);
        // Use block-based era calculation as fallback
        currentEraNumber = Math.floor(latestBlock / 120);
        activeEraNumber = currentEraNumber;
        // Calculate the start block of the current era
        activeEraStart = Math.floor(latestBlock / 120) * 120;
      }
      
      // Creditcoin dryrun specific constants
      const blockTime = 5; // 5 seconds per block
      const eraDuration = 10; // 10 minutes per era
      const blocksPerEra = (eraDuration * 60) / blockTime; // 120 blocks per era
      
      // Calculate current era progress and time remaining
      // Always use the calculated era start block for accurate timing
      const blocksSinceEraStart = latestBlock - activeEraStart;
      let currentBlockInEra = blocksSinceEraStart;
      let blocksRemainingInEra = blocksPerEra - blocksSinceEraStart;
      let timeRemainingInEra = blocksRemainingInEra * blockTime; // seconds
      let eraProgressPercentage = (blocksSinceEraStart / blocksPerEra) * 100;
      
      // Ensure values are within valid ranges
      if (currentBlockInEra < 0) {
        currentBlockInEra = 0;
        blocksRemainingInEra = blocksPerEra;
        timeRemainingInEra = blocksPerEra * blockTime;
        eraProgressPercentage = 0;
      } else if (currentBlockInEra >= blocksPerEra) {
        currentBlockInEra = blocksPerEra - 1;
        blocksRemainingInEra = 1;
        timeRemainingInEra = blockTime;
        eraProgressPercentage = 99.9;
      }
      
      // Debug logging for calculated values
      this.logger.debug(`Calculated era values: currentEra=${currentEraNumber}, activeEra=${activeEraNumber}, activeEraStart=${activeEraStart}`);
      this.logger.debug(`Era progress: ${currentBlockInEra}/${blocksPerEra} blocks, ${timeRemainingInEra}s remaining, ${eraProgressPercentage.toFixed(1)}% complete`);
      this.logger.debug(`Era timing: ${timeRemainingInEra}s remaining = ${Math.floor(timeRemainingInEra / 60)}m ${timeRemainingInEra % 60}s`);
      
      // Calculate how many eras different block ranges cover
      const blocks1000 = Math.floor(1000 / blocksPerEra);
      const blocks5000 = Math.floor(5000 / blocksPerEra); // Event search limit
      const blocks10000 = Math.floor(10000 / blocksPerEra);
      const blocks50000 = Math.floor(50000 / blocksPerEra);

      return {
        name: chain.toString(),
        version: nodeVersion.toString(),
        chain: chain.toString(),
        nodeName: nodeName.toString(),
        nodeVersion: nodeVersion.toString(),
        latestBlock,
        peers: 0, // This might need a different approach depending on the node
        // Era information
        currentEra: currentEraNumber,
        activeEra: activeEraNumber,
        activeEraStart: activeEraStart,
        blockTime: blockTime,
        eraDuration: eraDuration,
        blocksPerEra: blocksPerEra,
        // Era progress information
        currentBlockInEra: currentBlockInEra,
        blocksRemainingInEra: blocksRemainingInEra,
        timeRemainingInEra: timeRemainingInEra,
        eraProgressPercentage: eraProgressPercentage,
        // Block range coverage warnings
        blockRangeCoverage: {
          blocks1000: {
            blocks: 1000,
            eras: blocks1000,
            timeCoverage: `${blocks1000 * eraDuration} minutes`,
            warning: `⚠️ Limited coverage: Only ${blocks1000} eras (${blocks1000 * eraDuration} minutes)`
          },
          blocks5000: {
            blocks: 5000,
            eras: blocks5000,
            timeCoverage: `${blocks5000 * eraDuration} minutes`,
            warning: `⚠️ Event search limit: ${blocks5000} eras (${blocks5000 * eraDuration} minutes)`
          },
          blocks10000: {
            blocks: 10000,
            eras: blocks10000,
            timeCoverage: `${blocks10000 * eraDuration} minutes`,
            warning: `⚠️ Moderate coverage: ${blocks10000} eras (${blocks10000 * eraDuration} minutes)`
          },
          blocks50000: {
            blocks: 50000,
            eras: blocks50000,
            timeCoverage: `${blocks50000 * eraDuration} minutes`,
            warning: `✅ Good coverage: ${blocks50000} eras (${blocks50000 * eraDuration} minutes)`
          }
        }
      };
    } catch (error) {
      this.logger.error('Error getting network info:', error);
      // Return basic info if staking queries fail
      const [chain, nodeName, nodeVersion] = await Promise.all([
        this.api.rpc.system.chain(),
        this.api.rpc.system.name(),
        this.api.rpc.system.version(),
      ]);

      const latestBlock = await this.getLatestBlockNumber();

      return {
        name: chain.toString(),
        version: nodeVersion.toString(),
        chain: chain.toString(),
        nodeName: nodeName.toString(),
        nodeVersion: nodeVersion.toString(),
        latestBlock,
        peers: 0,
        currentEra: 0,
        activeEra: 0,
        activeEraStart: 0,
        blockTime: 5,
        eraDuration: 10,
        blocksPerEra: 120,
        // Era progress information (calculated from latest block)
        currentBlockInEra: latestBlock % 120,
        blocksRemainingInEra: 120 - (latestBlock % 120),
        timeRemainingInEra: (120 - (latestBlock % 120)) * 5,
        eraProgressPercentage: ((latestBlock % 120) / 120) * 100,
        blockRangeCoverage: {
          blocks1000: {
            blocks: 1000,
            eras: 8,
            timeCoverage: '80 minutes',
            warning: '⚠️ Limited coverage: Only 8 eras (80 minutes)'
          },
          blocks5000: {
            blocks: 5000,
            eras: 42,
            timeCoverage: '420 minutes',
            warning: '⚠️ Event search limit: 42 eras (420 minutes)'
          },
          blocks10000: {
            blocks: 10000,
            eras: 83,
            timeCoverage: '830 minutes',
            warning: '⚠️ Moderate coverage: 83 eras (830 minutes)'
          },
          blocks50000: {
            blocks: 50000,
            eras: 416,
            timeCoverage: '4160 minutes',
            warning: '✅ Good coverage: 416 eras (4160 minutes)'
          }
        }
      };
    }
  }

  /**
   * Creates a new account with generated mnemonic (no funding).
   */
  async createNewAccountWithMnemonic(): Promise<SubstrateAccount> {
    if (!this.api) {
      throw new Error('API not initialized. Please call connect() first.');
    }

    try {
      await cryptoWaitReady();

      // Generate a mnemonic
      const mnemonic = mnemonicGenerate();
      this.logger.log('Generated mnemonic:', mnemonic);

      // Validate the mnemonic
      if (!mnemonicValidate(mnemonic)) {
        throw new Error('Invalid mnemonic generated');
      }

      // Create a keyring instance
      const keyring = new Keyring({ type: 'sr25519' });

      // Add the account to the keyring with the generated mnemonic
      const newAccount = keyring.addFromMnemonic(mnemonic);

      // Get the address
      const address = newAccount.address;

      this.logger.log('New account address:', address);

      return {
        mnemonic,
        address
      };
    } catch (error) {
      this.logger.error('Failed to create new account:', error);
      throw error;
    }
  }

  /**
   * Creates a new account with generated mnemonic without funding (for testing).
   */
  async createNewAccountWithoutFunding(): Promise<SubstrateAccount> {
    if (!this.api) {
      throw new Error('API not initialized. Please call connect() first.');
    }

    try {
      await cryptoWaitReady();

      // Generate a mnemonic
      const mnemonic = mnemonicGenerate();
      this.logger.log('Generated mnemonic (no funding):', mnemonic);

      // Validate the mnemonic
      if (!mnemonicValidate(mnemonic)) {
        throw new Error('Invalid mnemonic generated');
      }

      // Create a keyring instance
      const keyring = new Keyring({ type: 'sr25519' });

      // Add the account to the keyring with the generated mnemonic
      const newAccount = keyring.addFromMnemonic(mnemonic);

      // Get the address
      const address = newAccount.address;

      this.logger.log('New account address (no funding):', address);

      return {
        mnemonic,
        address
      };
    } catch (error) {
      this.logger.error('Failed to create new account without funding:', error);
      throw error;
    }
  }

  /**
   * Transfers tokens from one address to another using the provided seed phrase.
   */
  async transferSubstrate(
    baseAccountSeed: string, 
    transfers: { recipient: string, amount: string }
  ): Promise<TransferResult> {
    if (!this.api) {
      throw new Error('API not initialized. Please call connect() first.');
    }

    this.logger.log("Starting Substrate transfer...");
    this.logger.log("Base account seed:", baseAccountSeed);
    this.logger.log("Transfers:", JSON.stringify(transfers));
    
    try {
      const keyring = new Keyring({ type: 'sr25519' });
      const baseAccount = keyring.createFromUri(baseAccountSeed);
      this.logger.log("Base account created:", baseAccount.address);
      
      // Validate transfer object
      if (!transfers.recipient || !transfers.amount) {
        throw new Error(`Invalid transfer object. Expected recipient and amount properties. Received: ${JSON.stringify(transfers)}`);
      }
      
      this.logger.log("Transfer details - recipient:", transfers.recipient, "amount:", transfers.amount);
      
      let currentNonce = (await this.api.rpc.system.accountNextIndex(baseAccount.address)).toBigInt();
      this.logger.log("Current nonce:", currentNonce.toString());
      
      const transferExtrinsic = this.api.tx.balances.transferKeepAlive(transfers.recipient, transfers.amount);
      this.logger.log("Transfer extrinsic created");

      const response = await new Promise<TransferResult>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Transaction timeout after 60 seconds"));
        }, 60000); // 60 second timeout for transaction
        
        transferExtrinsic
          .signAndSend(baseAccount, { nonce: currentNonce }, ({ status, dispatchError, events, txHash }) => {
            this.logger.log("Transaction status:", status.type);
            
            if (status.isInBlock || status.isFinalized) {
              clearTimeout(timeout);
              const blockHash = status.isInBlock ? status.asInBlock.toString() : status.asFinalized.toString();
              this.logger.log(`Transaction included in block: ${blockHash}`);
              
              if (!dispatchError) {
                events.forEach(({ event }) => {
                  if (event.method === 'Transfer' && event.section === 'balances') {
                    this.logger.log(`Transfer event found with extrinsic hash: ${txHash.toString()}`);
                    resolve({ blockHash, extrinsicHash: txHash.toString() });
                  }
                });
              } else {
                this.logger.error('Transaction failed with dispatch error:', dispatchError.toString());
                reject(new Error(`Transaction failed with dispatch error: ${dispatchError.toString()}`));
              }
            }
          }).catch((error) => {
            clearTimeout(timeout);
            this.logger.error("Error in signAndSend:", error);
            reject(error);
          });
      });

      return response;
    } catch (error) {
      this.logger.error("Error in transferSubstrate:", error);
      throw error;
    }
  }

  /**
   * Bonds Creditcoin tokens for staking (no nomination).
   */
  async bondCreditcoin(
    baseAccountSeed: string, 
    amount: string
  ): Promise<StakingResult> {
    if (!this.api) {
      throw new Error('API not initialized. Please call connect() first.');
    }

    this.logger.log("Initializing bonding...");
    
    try {
      const keyring = new Keyring({ type: 'sr25519' });
      const baseAccount = keyring.createFromUri(baseAccountSeed);
      this.logger.log("Base account created...");
      
      const stakingAmount = this.api.createType('Balance', amount);
      
      let currentNonce = (await this.api.rpc.system.accountNextIndex(baseAccount.address)).toBigInt();
      this.logger.log("Current nonce:", currentNonce);
      
      const stakingLedger = await this.api.query.staking.ledger(baseAccount.address);
      const stakingInfo = await this.api.derive.staking.account(baseAccount.address);
      let stakeExtrinsic: SubmittableExtrinsic<"promise">;
      
      if (stakingLedger && stakingLedger.toHuman() !== null) {
        const bondedBalance = stakingInfo?.stakingLedger.active?.unwrap() || new (this.api.registry as any).BN(0);
        this.logger.log("Bonded balance:", bondedBalance.toHuman());
        if (bondedBalance > 0) {
          this.logger.log("Account is already bonded with balance:", bondedBalance.toString());
          stakeExtrinsic = this.api.tx.staking.bondExtra(stakingAmount);
        } else {
          this.logger.log("Account has a staking ledger but no active bonded balance, using bond...");
          const rewardDestination = { Staked: null };
          stakeExtrinsic = this.api.tx.staking.bond(stakingAmount, rewardDestination);
        }
      } else {
        this.logger.log("Account is not bonded, using bond...");
        const rewardDestination = { Staked: null };
        stakeExtrinsic = this.api.tx.staking.bond(stakingAmount, rewardDestination);
      }
      
      const response = await new Promise<StakingResult>((resolve, reject) => {
        stakeExtrinsic
          .signAndSend(baseAccount, { nonce: currentNonce }, async ({ status, dispatchError, events, txHash }) => {
            if (status.isFinalized) {
              const blockHash = status.asFinalized.toString();
              this.logger.log(`Bonding transaction finalized in block: ${blockHash}`);
              if (!dispatchError) {
                resolve({
                  blockHash,
                  extrinsicHash: txHash.toString()
                });
              } else {
                this.logger.error('Staking transaction failed with dispatch error:', dispatchError.toString());
                reject(new Error(`Staking transaction failed: ${dispatchError.toString()}`));
              }
            }
          }).catch(reject);
      });
      
      return response;
    } catch (error) {
      this.logger.error("Error in bondCreditcoin:", error);
      throw error;
    }
  }



  /**
   * Gets all extrinsics in a specific block with detailed information.
   */
  async getBlockExtrinsics(blockHash: string): Promise<BlockExtrinsics> {
    if (!this.api) {
      throw new Error('API not initialized.');
    }

    try {
      const signedBlock = await this.api.rpc.chain.getBlock(blockHash);
      const extrinsics = signedBlock.block.extrinsics;
      const events = await this.api.query.system.events.at(blockHash);

      const extrinsicsWithDetails = extrinsics.map((extrinsic, index) => {
        try {
          const extrinsicHash = extrinsic.hash.toHex();
          const extrinsicEvents = (events as unknown as any[]).filter((event) => {
            const phase = event.phase;
            return phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index);
          });

          return {
            index,
            hash: extrinsicHash,
            section: extrinsic.method.section,
            method: extrinsic.method.method,
            signer: extrinsic.signer ? extrinsic.signer.toString() : 'N/A',
            nonce: extrinsic.nonce?.toNumber() || 0,
            args: extrinsic.method.args.map(arg => arg.toHuman()),
            events: extrinsicEvents.map(event => ({
              section: event.section,
              method: event.method,
              data: event.data.map(d => d.toHuman()),
            })),
          };
        } catch (extrinsicError) {
          // If processing an individual extrinsic fails, return a basic version
          return {
            index,
            hash: extrinsic.hash?.toHex() || 'unknown',
            section: extrinsic.method?.section || 'unknown',
            method: extrinsic.method?.method || 'unknown',
            signer: 'N/A',
            nonce: 0,
            args: [],
            events: [],
          };
        }
      });

      return {
        blockNumber: 0, // This will be set by the caller
        blockHash,
        extrinsics: extrinsicsWithDetails,
      };
    } catch (error) {
      this.logger.error(`Error getting block extrinsics for ${blockHash}:`, error);
      // Return empty extrinsics instead of throwing
      return {
        blockNumber: 0,
        blockHash,
        extrinsics: [],
      };
    }
  }

  /**
   * Gets all events in a specific block with detailed information.
   */
  async getBlockEvents(blockHash: string) {
    if (!this.api) {
      throw new Error('API not initialized.');
    }

    const events = await this.api.query.system.events.at(blockHash);
    
    return (events as unknown as any[]).map((event, index) => ({
      index,
      section: event.section,
      method: event.method,
      data: event.data.map(d => d.toHuman()),
      phase: event.phase.toHuman(),
    }));
  }

  /**
   * Gets events for a specific extrinsic in a block.
   */
  private async getExtrinsicEvents(blockHash: string, extrinsicIndex: number): Promise<Array<{
    section: string;
    method: string;
    data: any[];
  }>> {
    if (!this.api) {
      throw new Error('API not initialized. Please call connect() first.');
    }

    try {
      const events = await this.api.query.system.events.at(blockHash);
      
      return (events as any)
        .filter(({ phase }: any) => 
          phase.isApplyExtrinsic && 
          phase.asApplyExtrinsic.toNumber() === extrinsicIndex
        )
        .map(({ event }: any) => ({
          section: event.section,
          method: event.method,
          data: event.data.map((d: any) => d.toHuman())
        }));
    } catch (error) {
      this.logger.error(`Error getting extrinsic events for ${blockHash}:${extrinsicIndex}:`, error);
      return [];
    }
  }

  /**
   * Creates a batch transfer of multiple transactions.
   */
  async batchTransfer(
    baseAccountSeed: string,
    transfers: Array<{ recipient: string, amount: string }>
  ): Promise<BatchTransferResult> {
    if (!this.api) {
      throw new Error('API not initialized. Please call connect() first.');
    }

    this.logger.log("Starting batch transfer...");
    this.logger.log("Base account seed:", baseAccountSeed);
    this.logger.log("Transfers count:", transfers.length);
    
    try {
      const keyring = new Keyring({ type: 'sr25519' });
      const baseAccount = keyring.createFromUri(baseAccountSeed);
      this.logger.log("Base account created:", baseAccount.address);
      
      // Validate transfers
      if (!transfers.length || transfers.length > 100) {
        throw new Error(`Invalid batch size. Expected 1-100 transfers, got ${transfers.length}`);
      }
      
      transfers.forEach((transfer, index) => {
        if (!transfer.recipient || !transfer.amount) {
          throw new Error(`Invalid transfer at index ${index}: ${JSON.stringify(transfer)}`);
        }
      });
      
      let currentNonce = (await this.api.rpc.system.accountNextIndex(baseAccount.address)).toBigInt();
      this.logger.log("Current nonce:", currentNonce.toString());
      
      // Create batch call
      const batchCalls = transfers.map(transfer => 
        this.api!.tx.balances.transferKeepAlive(transfer.recipient, transfer.amount)
      );
      
      const batchExtrinsic = this.api.tx.utility.batchAll(batchCalls);
      this.logger.log("Batch extrinsic created with", transfers.length, "transfers");

      const response = await new Promise<BatchTransferResult>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Batch transaction timeout after 60 seconds"));
        }, 60000);
        
        batchExtrinsic
          .signAndSend(baseAccount, { nonce: currentNonce }, ({ status, dispatchError, events, txHash }) => {
            this.logger.log("Batch transaction status:", status.type);
            
            if (status.isInBlock || status.isFinalized) {
              clearTimeout(timeout);
              const blockHash = status.isInBlock ? status.asInBlock.toString() : status.asFinalized.toString();
              this.logger.log(`Batch transaction included in block: ${blockHash}`);
              
              if (!dispatchError) {
                // Look for Transfer events
                const transferEvents = events.filter(({ event }) => 
                  event.method === 'Transfer' && event.section === 'balances'
                );
                
                this.logger.log(`Batch completed with ${transferEvents.length} transfer events`);
                resolve({ 
                  blockHash, 
                  extrinsicHash: txHash.toString(),
                  batchSize: transfers.length
                });
              } else {
                this.logger.error('Batch transaction failed with dispatch error:', dispatchError.toString());
                reject(new Error(`Batch transaction failed with dispatch error: ${dispatchError.toString()}`));
              }
            }
          }).catch((error) => {
            clearTimeout(timeout);
            this.logger.error("Error in batch signAndSend:", error);
            reject(error);
          });
      });

      return response;
    } catch (error) {
      this.logger.error("Error in batchTransfer:", error);
      throw error;
    }
  }

  /**
   * Searches for a specific extrinsic by hash using smart block scanning.
   * This method uses efficient block scanning to locate extrinsics reliably.
   * @param extrinsicHash The hash of the extrinsic to search for.
   * @param searchStrategy Search strategy: 'events' (fast), 'blocks' (comprehensive), or 'hybrid' (recommended)
   * @param maxBlocksToSearch Maximum blocks to search (default: 10000 for better coverage)
   * @param timeoutMs Timeout in milliseconds (longer for larger searches)
   * @returns A promise that resolves to extrinsic information if found.
   */
  async searchExtrinsicByHash(
    extrinsicHash: string,
    searchStrategy: 'events' | 'blocks' | 'hybrid' = 'events',
    maxBlocksToSearch: number = 10000,
    timeoutMs?: number
  ): Promise<{
    extrinsic: {
      index: number;
      hash: string;
      section: string;
      method: string;
      signer: string;
      nonce: number;
      args: any[];
      events: Array<{
        section: string;
        method: string;
        data: any[];
      }>;
    };
    block: {
      number: number;
      hash: string;
      timestamp: number;
    };
  } | null> {
    if (!this.api) {
      throw new Error('API not initialized.');
    }

    // Validate extrinsic hash format
    if (!extrinsicHash.startsWith('0x') || extrinsicHash.length !== 66) {
      throw new Error('Invalid extrinsic hash format. Expected 0x-prefixed 64-character hex string.');
    }

    // Log coverage warning for testing purposes
    const blocksPerEra = 120; // Creditcoin dryrun: 120 blocks per era
    const erasCovered = Math.floor(maxBlocksToSearch / blocksPerEra);
    const timeCoverage = Math.floor(erasCovered * 10); // 10 minutes per era
    const hoursCoverage = Math.floor(timeCoverage / 60);
    
    this.logger.warn(`⚠️ TESTING MODE: Searching ${maxBlocksToSearch} blocks covers only ${erasCovered} eras (${timeCoverage} minutes = ~${hoursCoverage} hours)`);
    this.logger.warn(`⚠️ For production use, consider implementing a proper extrinsic indexer`);
    this.logger.log(`Searching for extrinsic ${extrinsicHash} using ${searchStrategy} strategy`);

    try {
      switch (searchStrategy) {
        case 'events':
          return await this.searchExtrinsicByEvents(extrinsicHash);
        case 'blocks':
          return await this.searchExtrinsicByBlockScan(extrinsicHash, maxBlocksToSearch);
        case 'hybrid':
        default:
          // Try events first (fast), fall back to block scan if needed
          const eventResult = await this.searchExtrinsicByEvents(extrinsicHash);
          if (eventResult) {
            return eventResult;
          }
          this.logger.log(`Event search failed, falling back to block scan for ${extrinsicHash}`);
          return await this.searchExtrinsicByBlockScan(extrinsicHash, maxBlocksToSearch);
      }
    } catch (error) {
      this.logger.error(`Error searching for extrinsic ${extrinsicHash}:`, error);
      return null;
    }
  }

  /**
   * Searches for extrinsic using event-based approach (fastest).
   * Looks for extrinsic-related events across blocks with patient scanning.
   */
  private async searchExtrinsicByEvents(extrinsicHash: string): Promise<{
    extrinsic: {
      index: number;
      hash: string;
      section: string;
      method: string;
      signer: string;
      nonce: number;
      args: any[];
      events: Array<{
        section: string;
        method: string;
        data: any[];
      }>;
    };
    block: {
      number: number;
      hash: string;
      timestamp: number;
    };
  } | null> {
    try {
      // Strategy: Search recent blocks for the extrinsic hash
      const latestBlock = await this.getLatestBlockNumber();
      const searchBlocks = Math.min(2000, latestBlock); // Search up to 2000 recent blocks
      
      this.logger.log(`Searching for extrinsic ${extrinsicHash} in ${searchBlocks} recent blocks`);
      
      // Search in smaller batches
      const batchSize = 100;
      
      for (let startBlock = latestBlock; startBlock >= Math.max(1, latestBlock - searchBlocks); startBlock -= batchSize) {
        const endBlock = Math.max(1, startBlock - batchSize + 1);
        
        try {
          // Process blocks in parallel within the batch
          const batchPromises = [];
          for (let b = startBlock; b >= endBlock; b--) {
            batchPromises.push(this.getExtrinsicFromBlock(b, extrinsicHash));
          }
          
          const batchResults = await Promise.all(batchPromises);
          
          // Check if we found the extrinsic in this batch
          for (const result of batchResults) {
            if (result) {
              this.logger.log(`Found extrinsic ${extrinsicHash} in block ${result.block.number}`);
              return result;
            }
          }
          
        } catch (error) {
          this.logger.warn(`Error checking batch around block ${startBlock}, continuing...`, error.message);
          continue;
        }
      }
      
      this.logger.log(`Event search completed for ${extrinsicHash} after checking ${searchBlocks} blocks`);
      return null;
    } catch (error) {
      this.logger.error(`Event-based search failed for ${extrinsicHash}:`, error);
      return null;
    }
  }

  /**
   * Searches for extrinsic using block scanning approach (comprehensive but slower).
   * Scans blocks sequentially to find the extrinsic with patient scanning.
   */
  private async searchExtrinsicByBlockScan(
    extrinsicHash: string, 
    maxBlocksToSearch: number
  ): Promise<{
    extrinsic: {
      index: number;
      hash: string;
      section: string;
      method: string;
      signer: string;
      nonce: number;
      args: any[];
      events: Array<{
        section: string;
        method: string;
        data: any[];
      }>;
    };
    block: {
      number: number;
      hash: string;
      timestamp: number;
    };
  } | null> {
    const latestBlock = await this.getLatestBlockNumber();
    const startBlock = Math.max(1, latestBlock - maxBlocksToSearch + 1);
    
    this.logger.log(`Scanning ${maxBlocksToSearch} blocks from ${startBlock} to ${latestBlock} for extrinsic ${extrinsicHash}`);
    
    // Use larger batch size for better performance
    const batchSize = 100;
    let blocksChecked = 0;
    
    for (let blockNumber = latestBlock; blockNumber >= startBlock; blockNumber -= batchSize) {
      const batchEnd = Math.max(startBlock, blockNumber - batchSize + 1);
      
      try {
        // Process blocks in parallel within the batch
        const batchPromises = [];
        for (let b = blockNumber; b >= batchEnd; b--) {
          batchPromises.push(this.getExtrinsicFromBlock(b, extrinsicHash));
        }
        
        const batchResults = await Promise.all(batchPromises);
        
        // Check if we found the extrinsic in this batch
        for (const result of batchResults) {
          if (result) {
            this.logger.log(`Found extrinsic ${extrinsicHash} after scanning ${blocksChecked} blocks`);
            return result;
          }
        }
        
        blocksChecked += batchSize;
        if (blocksChecked % 1000 === 0) {
          this.logger.log(`Scanned ${blocksChecked} blocks, still searching... (${Math.round((blocksChecked / maxBlocksToSearch) * 100)}% complete)`);
        }
        
      } catch (error) {
        this.logger.warn(`Error scanning batch around block ${blockNumber}, continuing...`, error.message);
        // Continue to next batch, don't fail the entire search
        continue;
      }
    }
    
    this.logger.log(`Extrinsic ${extrinsicHash} not found in ${maxBlocksToSearch} scanned blocks`);
    return null;
  }

  /**
   * Gets extrinsic information from a specific block.
   * Helper method for block scanning.
   */
  private async getExtrinsicFromBlock(
    blockNumber: number, 
    extrinsicHash: string
  ): Promise<{
    extrinsic: {
      index: number;
      hash: string;
      section: string;
      method: string;
      signer: string;
      nonce: number;
      args: any[];
      events: Array<{
        section: string;
        method: string;
        data: any[];
      }>;
    };
    block: {
      number: number;
      hash: string;
      timestamp: number;
    };
  } | null> {
    try {
      const blockHash = await this.api.rpc.chain.getBlockHash(blockNumber);
      const signedBlock = await this.api.rpc.chain.getBlock(blockHash);
      
      // Check if this extrinsic is in this block
      for (let i = 0; i < signedBlock.block.extrinsics.length; i++) {
        const ex = signedBlock.block.extrinsics[i];
        if (ex.hash.toHex() === extrinsicHash) {
          // Found the extrinsic! Get its events
          const allEvents = await this.api.query.system.events.at(blockHash);
          const extrinsicEvents = (allEvents as unknown as any[]).filter((event) => {
            const phase = event.phase;
            return phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(i);
          });

          return {
            extrinsic: {
              index: i,
              hash: extrinsicHash,
              section: ex.method.section,
              method: ex.method.method,
              signer: ex.isSigned ? ex.signer.toString() : 'N/A',
              nonce: ex.nonce?.toNumber() || 0,
              args: ex.method.args.map(arg => arg.toHuman()),
              events: extrinsicEvents.map(event => ({
                section: event.event.section,
                method: event.event.method,
                data: event.event.data.map(d => d.toHuman()),
              })),
            },
            block: {
              number: blockNumber,
              hash: blockHash.toHex(),
              timestamp: Date.now(),
            },
          };
        }
      }
      
      return null; // Extrinsic not found in this block
    } catch (error) {
      this.logger.warn(`Error checking block ${blockNumber} for extrinsic ${extrinsicHash}:`, error.message);
      return null;
    }
  }

  /**
   * Calculates appropriate timeout for extrinsic search based on block count.
   * Larger searches get longer timeouts to be patient.
   */
  private calculateSearchTimeout(maxBlocksToSearch: number): number {
    if (maxBlocksToSearch <= 1000) {
      return 60000; // 1 minute for small searches
    } else if (maxBlocksToSearch <= 5000) {
      return 300000; // 5 minutes for medium searches (event search)
    } else if (maxBlocksToSearch <= 10000) {
      return 600000; // 10 minutes for large searches
    } else {
      return 1200000; // 20 minutes for very large searches
    }
  }

  /**
   * Debug method to test era calculations
   */
  async debugEraCalculations(): Promise<{
    latestBlock: number;
    currentEra: number;
    calculatedEraStart: number;
    blocksSinceEraStart: number;
    timeRemaining: number;
    progressPercentage: number;
  }> {
    if (!this.api) {
      throw new Error('API not initialized.');
    }

    const latestBlock = await this.getLatestBlockNumber();
    const currentEra = Math.floor(latestBlock / 120);
    const calculatedEraStart = Math.floor(latestBlock / 120) * 120;
    const blocksSinceEraStart = latestBlock - calculatedEraStart;
    const timeRemaining = (120 - blocksSinceEraStart) * 5;
    const progressPercentage = (blocksSinceEraStart / 120) * 100;

    return {
      latestBlock,
      currentEra,
      calculatedEraStart,
      blocksSinceEraStart,
      timeRemaining,
      progressPercentage
    };
  }

  /**
   * Debug method to test Polkadot.js style chain state queries
   */
  async debugPolkadotJsQueries(): Promise<{
    currentEra: any;
    activeEra: any;
    erasStart: any;
    latestBlock: number;
  }> {
    if (!this.api) {
      throw new Error('API not initialized.');
    }

    try {
      const latestBlock = await this.getLatestBlockNumber();
      
      // Query the exact same data that Polkadot.js queries
      const [currentEra, activeEra, erasStart] = await Promise.all([
        this.api.query.staking.currentEra(),
        this.api.query.staking.activeEra(),
        this.api.query.staking.erasStart(Math.floor(latestBlock / 120))
      ]);

      return {
        currentEra,
        activeEra,
        erasStart,
        latestBlock
      };
    } catch (error) {
      this.logger.error('Error in debugPolkadotJsQueries:', error);
      throw error;
    }
  }
}
