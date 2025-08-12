import { Controller, Get, Post, Query, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CacheService } from '../cache/cache.service';
import { TxHit, SearchResult, BlockInfo, NetworkInfo } from '@blockchain-explorer/shared';
import { DEFAULT_BLOCKS_TO_SCAN, DEFAULT_BATCH_SIZE } from '@blockchain-explorer/shared';
import { TxHitDto, SearchResultDto, BlockInfoDto, NetworkInfoDto, LatestBlockDto, ExtrinsicResponseDto } from './dto/search.dto';

// Temporary fix for MAX_BLOCKS_TO_SCAN import issue
const MAX_BLOCKS_TO_SCAN = 10000;

@ApiTags('search')
@Controller('api')
export class SearchController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly cacheService: CacheService
  ) {}

  @Get('search/address')
  @ApiOperation({ summary: 'Search for transactions and events related to an address' })
  @ApiQuery({ name: 'address', description: 'The address to search for', required: true })
  @ApiQuery({ name: 'blocksToScan', description: 'Number of recent blocks to scan (default: 10000 for better coverage)', required: false, type: Number })
  @ApiQuery({ name: 'batchSize', description: 'Number of blocks to process in each batch (default: 100 for better performance)', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search results', type: SearchResultDto })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async searchAddress(
    @Query('address') address: string,
    @Query('blocksToScan') blocksToScan?: string,
    @Query('batchSize') batchSize?: string,
  ): Promise<SearchResult> {
    // Validate address parameter
    if (!address || typeof address !== 'string' || address.trim() === '') {
      throw new HttpException('Address parameter is required and must be a valid string', HttpStatus.BAD_REQUEST);
    }

    // Validate address format (basic Substrate address validation)
    if (!address.startsWith('5') || address.length !== 48) {
      throw new HttpException('Invalid address format. Expected Substrate address starting with 5 and 48 characters long', HttpStatus.BAD_REQUEST);
    }

    if (!this.blockchainService.isConnected()) {
      throw new HttpException('Blockchain service not connected', HttpStatus.SERVICE_UNAVAILABLE);
    }

    // Validate numeric parameters BEFORE calling blockchain service
    const blocksToScanNum = blocksToScan ? parseInt(blocksToScan, 10) : DEFAULT_BLOCKS_TO_SCAN;
    const batchSizeNum = batchSize ? parseInt(batchSize, 10) : DEFAULT_BATCH_SIZE;

    if (isNaN(blocksToScanNum) || blocksToScanNum <= 0 || blocksToScanNum > MAX_BLOCKS_TO_SCAN) {
      throw new HttpException(
        `blocksToScan must be a positive number <= ${MAX_BLOCKS_TO_SCAN}`,
        HttpStatus.BAD_REQUEST
      );
    }

    if (isNaN(batchSizeNum) || batchSizeNum <= 0 || batchSizeNum > 100) {
      throw new HttpException('batchSize must be a positive number <= 100', HttpStatus.BAD_REQUEST);
    }

    // Check cache first
    const cacheKey = {
      type: 'address' as const,
      query: address,
      blocksToScan: blocksToScanNum,
      batchSize: batchSizeNum
    };

    // Check if we have a cached result
    const cachedResult = this.cacheService.get<SearchResult>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Check if there's already a pending request for the same search
    if (this.cacheService.hasPendingRequest(cacheKey)) {
      const pendingRequest = this.cacheService.getPendingRequest<SearchResult>(cacheKey);
      if (pendingRequest) {
        return await pendingRequest;
      }
    }

    try {
      // Create the search request
      const searchPromise = this.blockchainService.searchAddressInRecentBlocks(
        address,
        blocksToScanNum,
        batchSizeNum
      );

      // Set this as a pending request to implement request pooling
      this.cacheService.setPendingRequest(cacheKey, searchPromise);

      const transactions = await searchPromise;

      const result: SearchResult = {
        transactions,
        total: transactions.length,
        blocksScanned: blocksToScanNum,
      };

      // Cache the successful result
      this.cacheService.set(cacheKey, result);

      return result;
    } catch (error) {
      throw new HttpException(
        `Search failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('block/:blockNumber')
  @ApiOperation({ summary: 'Get information about a specific block' })
  @ApiParam({ name: 'blockNumber', description: 'Block number', type: Number })
  @ApiResponse({ status: 200, description: 'Block information', type: BlockInfoDto })
  @ApiResponse({ status: 400, description: 'Invalid block number' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getBlock(@Param('blockNumber') blockNumber: string): Promise<BlockInfo> {
    if (!this.blockchainService.isConnected()) {
      throw new HttpException('Blockchain service not connected', HttpStatus.SERVICE_UNAVAILABLE);
    }

    // Validate block number parameter BEFORE calling blockchain service
    const blockNum = parseInt(blockNumber, 10);
    if (isNaN(blockNum) || blockNum <= 0) {
      throw new HttpException('Invalid block number. Must be a positive integer', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.blockchainService.getBlockInfo(blockNum);
    } catch (error) {
      // Check if it's a "block not found" error
      if (error.message.includes('Unable to retrieve header') || error.message.includes('Block not found')) {
        throw new HttpException('Block not found', HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        `Failed to get block info: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('block/hash/:blockHash')
  @ApiOperation({ summary: 'Get information about a specific block by hash' })
  @ApiParam({ name: 'blockHash', description: 'Block hash (0x-prefixed hex string)', type: String })
  @ApiResponse({ status: 200, description: 'Block information', type: BlockInfoDto })
  @ApiResponse({ status: 400, description: 'Invalid block hash format' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getBlockByHash(@Param('blockHash') blockHash: string): Promise<BlockInfo> {
    if (!this.blockchainService.isConnected()) {
      throw new HttpException('Blockchain service not connected', HttpStatus.SERVICE_UNAVAILABLE);
    }

    // Validate block hash parameter
    if (!blockHash || typeof blockHash !== 'string' || blockHash.trim() === '') {
      throw new HttpException('Block hash parameter is required and must be a valid string', HttpStatus.BAD_REQUEST);
    }

    // Validate block hash format (basic hex validation)
    if (!blockHash.startsWith('0x') || blockHash.length !== 66) {
      throw new HttpException('Invalid block hash format. Expected 0x-prefixed 64-character hex string', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.blockchainService.getBlockInfoByHash(blockHash);
    } catch (error) {
      // Check if it's a "block not found" error
      if (error.message.includes('Block not found')) {
        throw new HttpException('Block not found', HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        `Failed to get block info: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('blocks/latest')
  @ApiOperation({ summary: 'Get the latest block number' })
  @ApiResponse({ status: 200, description: 'Latest block number', type: LatestBlockDto })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getLatestBlock(): Promise<{ latestBlock: number }> {
    if (!this.blockchainService.isConnected()) {
      throw new HttpException('Blockchain service not connected', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      const latestBlock = await this.blockchainService.getLatestBlockNumber();
      return { latestBlock };
    } catch (error) {
      throw new HttpException(
        `Failed to get latest block: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('blocks/latest/info')
  @ApiOperation({ summary: 'Get the latest block with detailed information' })
  @ApiResponse({ status: 200, description: 'Latest block information' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getLatestBlockInfo(): Promise<{
    number: number;
    hash: string;
    timestamp: number;
    extrinsicsCount: number;
    eventsCount: number;
  }> {
    if (!this.blockchainService.isConnected()) {
      throw new HttpException('Blockchain service not connected', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      return await this.blockchainService.getLatestBlockInfo();
    } catch (error) {
      throw new HttpException(
        `Failed to get latest block info: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('network/info')
  @ApiOperation({ summary: 'Get network information' })
  @ApiResponse({ status: 200, description: 'Network information', type: NetworkInfoDto })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getNetworkInfo(): Promise<NetworkInfo> {
    if (!this.blockchainService.isConnected()) {
      throw new HttpException('Blockchain service not connected', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      return await this.blockchainService.getNetworkInfo();
    } catch (error) {
      throw new HttpException(
        `Failed to get network info: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('network/rpc-endpoint')
  @ApiOperation({ summary: 'Get current RPC endpoint' })
  @ApiResponse({ status: 200, description: 'Current RPC endpoint' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getRpcEndpoint(): Promise<{ rpcEndpoint: string }> {
    try {
      const rpcEndpoint = this.blockchainService.getRpcEndpoint();
      return { rpcEndpoint };
    } catch (error) {
      throw new HttpException(
        `Failed to get RPC endpoint: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('network/rpc-endpoint')
  @ApiOperation({ summary: 'Change RPC endpoint' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        rpcEndpoint: { type: 'string', example: 'wss://rpc.polkadot.io' } 
      } 
    } 
  })
  @ApiResponse({ status: 200, description: 'RPC endpoint changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid RPC endpoint format' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async changeRpcEndpoint(@Body() body: { rpcEndpoint: string }): Promise<{ message: string; rpcEndpoint: string }> {
    if (!body.rpcEndpoint || typeof body.rpcEndpoint !== 'string') {
      throw new HttpException('RPC endpoint is required', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.blockchainService.changeRpcEndpoint(body.rpcEndpoint);
      return { 
        message: 'RPC endpoint changed successfully', 
        rpcEndpoint: body.rpcEndpoint 
      };
    } catch (error) {
      throw new HttpException(
        `Failed to change RPC endpoint: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('debug/era-calculations')
  @ApiOperation({ summary: 'Debug era calculations' })
  @ApiResponse({ status: 200, description: 'Era calculation debug info' })
  async debugEraCalculations() {
    if (!this.blockchainService.isConnected()) {
      throw new HttpException('Blockchain service not connected', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      return await this.blockchainService.debugEraCalculations();
    } catch (error) {
      throw new HttpException(
        `Failed to get era calculations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('debug/polkadot-js-queries')
  @ApiOperation({ summary: 'Debug Polkadot.js style queries' })
  @ApiResponse({ status: 200, description: 'Polkadot.js query debug info' })
  async debugPolkadotJsQueries() {
    if (!this.blockchainService.isConnected()) {
      throw new HttpException('Blockchain service not connected', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      return await this.blockchainService.debugPolkadotJsQueries();
    } catch (error) {
      throw new HttpException(
        `Failed to get Polkadot.js queries: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('debug/cache/clear')
  @ApiOperation({ summary: 'Clear all cache (debug endpoint)' })
  @ApiResponse({ status: 200, description: 'Cache cleared' })
  async clearCache(): Promise<{ message: string; stats: any }> {
    this.cacheService.clearAll();
    const stats = this.cacheService.getStats();
    return {
      message: 'Cache cleared successfully',
      stats
    };
  }

  @Get('debug/cache/stats')
  @ApiOperation({ summary: 'Get cache statistics (debug endpoint)' })
  @ApiResponse({ status: 200, description: 'Cache statistics' })
  async getCacheStats(): Promise<any> {
    return this.cacheService.getStats();
  }

  @Get('debug/cache/clear/extrinsic')
  @ApiOperation({ summary: 'Clear extrinsic cache (debug endpoint)' })
  @ApiResponse({ status: 200, description: 'Extrinsic cache cleared' })
  async clearExtrinsicCache(): Promise<{ message: string; stats: any }> {
    this.cacheService.clearByType('extrinsic');
    const stats = this.cacheService.getStats();
    return {
      message: 'Extrinsic cache cleared successfully',
      stats
    };
  }

  @Get('debug/cache/clear/address')
  @ApiOperation({ summary: 'Clear address cache (debug endpoint)' })
  @ApiResponse({ status: 200, description: 'Address cache cleared' })
  async clearAddressCache(): Promise<{ message: string; stats: any }> {
    this.cacheService.clearByType('address');
    const stats = this.cacheService.getStats();
    return {
      message: 'Address cache cleared successfully',
      stats
    };
  }

  @Get('debug/extrinsic/:extrinsicHash')
  @ApiOperation({ summary: 'Debug: Get extrinsic info directly' })
  @ApiParam({ name: 'extrinsicHash', description: 'Extrinsic hash to test', type: String })
  @ApiResponse({ status: 200, description: 'Extrinsic info or error details' })
  async debugExtrinsic(@Param('extrinsicHash') extrinsicHash: string): Promise<any> {
    try {
      const result = await this.blockchainService.searchExtrinsicByHash(
        extrinsicHash, 
        'blocks', 
        10000
      );
      return {
        success: true,
        data: result,
        extrinsicFound: !!result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('extrinsic/:extrinsicHash')
  @ApiOperation({ summary: 'Get information about a specific extrinsic by hash' })
  @ApiParam({ name: 'extrinsicHash', description: 'Extrinsic hash (0x-prefixed hex string)', type: String })
  @ApiQuery({ name: 'strategy', description: 'Search strategy: events (fast), blocks (comprehensive), or hybrid (recommended)', required: false, type: String })
  @ApiQuery({ name: 'maxBlocks', description: 'Maximum blocks to search (only for blocks strategy)', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Extrinsic information', type: ExtrinsicResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid extrinsic hash format' })
  @ApiResponse({ status: 404, description: 'Extrinsic not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getExtrinsic(
    @Param('extrinsicHash') extrinsicHash: string,
    @Query('strategy') strategy?: string,
    @Query('maxBlocks') maxBlocks?: string,
  ): Promise<ExtrinsicResponseDto> {
    if (!this.blockchainService.isConnected()) {
      throw new HttpException('Blockchain service not connected', HttpStatus.SERVICE_UNAVAILABLE);
    }

    // Validate extrinsic hash parameter
    if (!extrinsicHash || typeof extrinsicHash !== 'string' || extrinsicHash.trim() === '') {
      throw new HttpException('Extrinsic hash parameter is required and must be a valid string', HttpStatus.BAD_REQUEST);
    }

    // Validate extrinsic hash format (basic hex validation)
    if (!extrinsicHash.startsWith('0x') || extrinsicHash.length !== 66) {
      throw new HttpException('Invalid extrinsic hash format. Expected 0x-prefixed 64-character hex string', HttpStatus.BAD_REQUEST);
    }

    // Validate and parse strategy parameter - default to 'events' for better performance
    const searchStrategy = strategy && ['events', 'blocks', 'hybrid'].includes(strategy) 
      ? strategy as 'events' | 'blocks' | 'hybrid' 
      : 'events';
    
    // Validate and parse maxBlocks parameter
    const maxBlocksToSearch = maxBlocks ? parseInt(maxBlocks, 10) : 10000;
    if (isNaN(maxBlocksToSearch) || maxBlocksToSearch <= 0 || maxBlocksToSearch > 100000) {
      throw new HttpException('maxBlocks must be a positive number <= 100000', HttpStatus.BAD_REQUEST);
    }

    // Check cache first
    const cacheKey = {
      type: 'extrinsic' as const,
      query: extrinsicHash,
      strategy: searchStrategy,
      maxBlocks: maxBlocksToSearch
    };

    // Check if we have a cached result
    const cachedResult = this.cacheService.get<ExtrinsicResponseDto>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Check if there's already a pending request for the same search
    if (this.cacheService.hasPendingRequest(cacheKey)) {
      const pendingRequest = this.cacheService.getPendingRequest<ExtrinsicResponseDto>(cacheKey);
      if (pendingRequest) {
        return await pendingRequest;
      }
    }

    try {
      // Calculate timeout based on search size - increased for better reliability
      const timeoutMs = maxBlocksToSearch <= 5000 ? 600000 : 1200000; // 10 min for small, 20 min for large
      
      // Create the search request
      const searchPromise = this.blockchainService.searchExtrinsicByHash(
        extrinsicHash, 
        searchStrategy, 
        maxBlocksToSearch,
        timeoutMs
      );

      // Set this as a pending request to implement request pooling
      this.cacheService.setPendingRequest(cacheKey, searchPromise);

      const result = await searchPromise;

      if (!result) {
        throw new HttpException('Extrinsic not found', HttpStatus.NOT_FOUND);
      }

      // Cache the successful result
      this.cacheService.set(cacheKey, result);

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to get extrinsic info: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('debug/block/hash/:blockHash')
  @ApiOperation({ summary: 'Debug: Get block info by hash directly' })
  @ApiParam({ name: 'blockHash', description: 'Block hash to test', type: String })
  @ApiResponse({ status: 200, description: 'Block info or error details' })
  async debugBlockByHash(@Param('blockHash') blockHash: string): Promise<any> {
    try {
      const result = await this.blockchainService.getBlockInfoByHash(blockHash);
      return {
        success: true,
        data: result,
        extrinsicsCount: result.extrinsics?.length || 0,
        eventsCount: result.events?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }
}
