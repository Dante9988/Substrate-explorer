import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TxHit, SearchResult, BlockInfo, NetworkInfo } from '@blockchain-explorer/shared';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('SearchController', () => {
  let controller: SearchController;
  let blockchainService: jest.Mocked<BlockchainService>;

  // Mock data
  const mockTxHit: TxHit = {
    blockNumber: 1000,
    blockHash: '0x1234567890abcdef',
    section: 'balances',
    method: 'transfer',
    data: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUipZC92UhjJM694ty'],
    extrinsicHash: '0xabcdef1234567890',
    extrinsicIndex: 0
  };

  const mockSearchResult: SearchResult = {
    transactions: [mockTxHit],
    total: 1,
    blocksScanned: 10
  };

  const mockBlockInfo = {
    number: 1000,
    hash: '0x1234567890abcdef' as `0x${string}`,
    parentHash: '0xparent123' as `0x${string}`,
    stateRoot: '0xstate123' as `0x${string}`,
    extrinsicsRoot: '0xextrinsics123' as `0x${string}`,
    timestamp: Date.now(),
    extrinsicsCount: 2,
    eventsCount: 5,
    extrinsics: [],
    events: []
  };

  const mockNetworkInfo: NetworkInfo = {
    name: 'Creditcoin3 Mainnet Dryrun',
    version: '1.0.0',
    chain: 'Creditcoin3 Mainnet Dryrun',
    nodeName: 'Frontier Node',
    nodeVersion: '3.39.0',
    latestBlock: 9054,
    peers: 0,
    currentEra: 1,
    activeEra: 1,
    activeEraStart: 10000,
    blockTime: 5,
    eraDuration: 10,
    blocksPerEra: 120,
    currentBlockInEra: 100,
    blocksRemainingInEra: 20,
    timeRemainingInEra: 100,
    eraProgressPercentage: 50,
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

  beforeEach(async () => {
    // Create mock blockchain service
    const mockBlockchainService = {
      isConnected: jest.fn(),
      searchAddressInRecentBlocks: jest.fn(),
      getBlockInfo: jest.fn(),
      getLatestBlockNumber: jest.fn(),
      getNetworkInfo: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: BlockchainService,
          useValue: mockBlockchainService
        }
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    blockchainService = module.get(BlockchainService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchAddress', () => {
    const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

    it('should search for address successfully with default parameters', async () => {
      blockchainService.isConnected.mockReturnValue(true);
      blockchainService.searchAddressInRecentBlocks.mockResolvedValue([mockTxHit]);

      const result = await controller.searchAddress(testAddress);

      expect(result).toEqual({
        transactions: [mockTxHit],
        total: 1,
        blocksScanned: 100 // default value
      });

      expect(blockchainService.searchAddressInRecentBlocks).toHaveBeenCalledWith(
        testAddress,
        100, // default blocksToScan
        10   // default batchSize
      );
    });

    it('should search for address with custom parameters', async () => {
      blockchainService.isConnected.mockReturnValue(true);
      blockchainService.searchAddressInRecentBlocks.mockResolvedValue([mockTxHit]);

      const result = await controller.searchAddress(testAddress, '50', '5');

      expect(result).toEqual({
        transactions: [mockTxHit],
        total: 1,
        blocksScanned: 50
      });

      expect(blockchainService.searchAddressInRecentBlocks).toHaveBeenCalledWith(
        testAddress,
        50, // custom blocksToScan
        5   // custom batchSize
      );
    });

    it('should throw error when address is missing', async () => {
      await expect(controller.searchAddress('')).rejects.toThrow(
        new HttpException('Address parameter is required', HttpStatus.BAD_REQUEST)
      );
    });

    it('should throw error when blockchain service is not connected', async () => {
      blockchainService.isConnected.mockReturnValue(false);

      await expect(controller.searchAddress(testAddress)).rejects.toThrow(
        new HttpException('Blockchain service not connected', HttpStatus.SERVICE_UNAVAILABLE)
      );
    });

    it('should throw error when blocksToScan is invalid', async () => {
      blockchainService.isConnected.mockReturnValue(true);

      await expect(controller.searchAddress(testAddress, '0')).rejects.toThrow(
        new HttpException('blocksToScan must be a positive number <= 1000', HttpStatus.BAD_REQUEST)
      );

      await expect(controller.searchAddress(testAddress, '1500')).rejects.toThrow(
        new HttpException('blocksToScan must be a positive number <= 1000', HttpStatus.BAD_REQUEST)
      );

      await expect(controller.searchAddress(testAddress, 'invalid')).rejects.toThrow(
        new HttpException('blocksToScan must be a positive number <= 1000', HttpStatus.BAD_REQUEST)
      );
    });

    it('should throw error when batchSize is invalid', async () => {
      blockchainService.isConnected.mockReturnValue(true);

      await expect(controller.searchAddress(testAddress, '100', '0')).rejects.toThrow(
        new HttpException('batchSize must be a positive number <= 100', HttpStatus.BAD_REQUEST)
      );

      await expect(controller.searchAddress(testAddress, '100', '150')).rejects.toThrow(
        new HttpException('batchSize must be a positive number <= 100', HttpStatus.BAD_REQUEST)
      );

      await expect(controller.searchAddress(testAddress, '100', 'invalid')).rejects.toThrow(
        new HttpException('batchSize must be a positive number <= 100', HttpStatus.BAD_REQUEST)
      );
    });

    it('should handle blockchain service errors gracefully', async () => {
      blockchainService.isConnected.mockReturnValue(true);
      blockchainService.searchAddressInRecentBlocks.mockRejectedValue(
        new Error('Blockchain connection failed')
      );

      await expect(controller.searchAddress(testAddress)).rejects.toThrow(
        new HttpException('Search failed: Blockchain connection failed', HttpStatus.INTERNAL_SERVER_ERROR)
      );
    });

    it('should return empty results when no transactions found', async () => {
      blockchainService.isConnected.mockReturnValue(true);
      blockchainService.searchAddressInRecentBlocks.mockResolvedValue([]);

      const result = await controller.searchAddress(testAddress, '10');

      expect(result).toEqual({
        transactions: [],
        total: 0,
        blocksScanned: 10
      });
    });
  });

  describe('getBlock', () => {
    it('should get block information successfully', async () => {
      blockchainService.isConnected.mockReturnValue(true);
      blockchainService.getBlockInfo.mockResolvedValue(mockBlockInfo);

      const result = await controller.getBlock('1000');

      expect(result).toEqual(mockBlockInfo);
      expect(blockchainService.getBlockInfo).toHaveBeenCalledWith(1000);
    });

    it('should throw error when blockchain service is not connected', async () => {
      blockchainService.isConnected.mockReturnValue(false);

      await expect(controller.getBlock('1000')).rejects.toThrow(
        new HttpException('Blockchain service not connected', HttpStatus.SERVICE_UNAVAILABLE)
      );
    });

    it('should throw error when block number is invalid', async () => {
      blockchainService.isConnected.mockReturnValue(true);

      await expect(controller.getBlock('0')).rejects.toThrow(
        new HttpException('Invalid block number', HttpStatus.BAD_REQUEST)
      );

      await expect(controller.getBlock('-100')).rejects.toThrow(
        new HttpException('Invalid block number', HttpStatus.BAD_REQUEST)
      );

      await expect(controller.getBlock('invalid')).rejects.toThrow(
        new HttpException('Invalid block number', HttpStatus.BAD_REQUEST)
      );
    });

    it('should handle blockchain service errors gracefully', async () => {
      blockchainService.isConnected.mockReturnValue(true);
      blockchainService.getBlockInfo.mockRejectedValue(
        new Error('Block not found')
      );

      await expect(controller.getBlock('1000')).rejects.toThrow(
        new HttpException('Failed to get block info: Block not found', HttpStatus.INTERNAL_SERVER_ERROR)
      );
    });
  });

  describe('getLatestBlock', () => {
    it('should get latest block number successfully', async () => {
      blockchainService.isConnected.mockReturnValue(true);
      blockchainService.getLatestBlockNumber.mockResolvedValue(9054);

      const result = await controller.getLatestBlock();

      expect(result).toEqual({ latestBlock: 9054 });
      expect(blockchainService.getLatestBlockNumber).toHaveBeenCalled();
    });

    it('should throw error when blockchain service is not connected', async () => {
      blockchainService.isConnected.mockReturnValue(false);

      await expect(controller.getLatestBlock()).rejects.toThrow(
        new HttpException('Blockchain service not connected', HttpStatus.SERVICE_UNAVAILABLE)
      );
    });

    it('should handle blockchain service errors gracefully', async () => {
      blockchainService.isConnected.mockReturnValue(true);
      blockchainService.getLatestBlockNumber.mockRejectedValue(
        new Error('Connection failed')
      );

      await expect(controller.getLatestBlock()).rejects.toThrow(
        new HttpException('Failed to get latest block: Connection failed', HttpStatus.INTERNAL_SERVER_ERROR)
      );
    });
  });

  describe('getNetworkInfo', () => {
    it('should get network information successfully', async () => {
      blockchainService.isConnected.mockReturnValue(true);
      blockchainService.getNetworkInfo.mockResolvedValue(mockNetworkInfo);

      const result = await controller.getNetworkInfo();

      expect(result).toEqual(mockNetworkInfo);
      expect(blockchainService.getNetworkInfo).toHaveBeenCalled();
    });

    it('should throw error when blockchain service is not connected', async () => {
      blockchainService.isConnected.mockReturnValue(false);

      await expect(controller.getNetworkInfo()).rejects.toThrow(
        new HttpException('Blockchain service not connected', HttpStatus.SERVICE_UNAVAILABLE)
      );
    });

    it('should handle blockchain service errors gracefully', async () => {
      blockchainService.isConnected.mockReturnValue(true);
      blockchainService.getNetworkInfo.mockRejectedValue(
        new Error('Network query failed')
      );

      await expect(controller.getNetworkInfo()).rejects.toThrow(
        new HttpException('Failed to get network info: Network query failed', HttpStatus.INTERNAL_SERVER_ERROR)
      );
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle very large block numbers', async () => {
      blockchainService.isConnected.mockReturnValue(true);
      blockchainService.getBlockInfo.mockResolvedValue(mockBlockInfo);

      const largeBlockNumber = '999999999';
      const result = await controller.getBlock(largeBlockNumber);

      expect(result).toEqual(mockBlockInfo);
      expect(blockchainService.getBlockInfo).toHaveBeenCalledWith(999999999);
    });

    it('should handle boundary values for blocksToScan', async () => {
      blockchainService.isConnected.mockReturnValue(true);
      blockchainService.searchAddressInRecentBlocks.mockResolvedValue([]);

      // Test minimum valid value
      await controller.searchAddress('test', '1', '1');
      expect(blockchainService.searchAddressInRecentBlocks).toHaveBeenCalledWith('test', 1, 1);

      // Test maximum valid value
      await controller.searchAddress('test', '1000', '100');
      expect(blockchainService.searchAddressInRecentBlocks).toHaveBeenCalledWith('test', 1000, 100);
    });

    it('should handle whitespace in address parameter', async () => {
      blockchainService.isConnected.mockReturnValue(true);
      blockchainService.searchAddressInRecentBlocks.mockResolvedValue([]);

      const addressWithWhitespace = '  5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY  ';
      await controller.searchAddress(addressWithWhitespace);

      expect(blockchainService.searchAddressInRecentBlocks).toHaveBeenCalledWith(
        addressWithWhitespace,
        100,
        10
      );
    });
  });
});
