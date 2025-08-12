import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from './blockchain.service';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { TxHit } from '@blockchain-explorer/shared';

// Define EventRecord type for testing
interface EventRecord {
  event: {
    section: string;
    method: string;
    data: any[];
  };
  phase: {
    isApplyExtrinsic: boolean;
    asApplyExtrinsic?: { toNumber: () => number };
  };
}

// Mock Polkadot API
jest.mock('@polkadot/api');

describe('BlockchainService', () => {
  let service: BlockchainService;
  let mockApi: any;
  let mockWsProvider: any;

  // Mock data
  const mockBlockHash = '0x1234567890abcdef';
  const mockAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const mockExtrinsic = {
    isSigned: true,
    signer: { toString: () => mockAddress },
    method: {
      section: 'balances',
      method: 'transfer',
      args: [{ toHuman: () => '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty' }]
    },
    hash: { toHex: () => '0xabcdef1234567890' }
  };
  const mockEvent = {
    event: {
      section: 'balances',
      method: 'Transfer',
      data: [{ toHuman: () => mockAddress }]
    },
    phase: { isApplyExtrinsic: true, asApplyExtrinsic: { toNumber: () => 0 } }
  };

  beforeEach(async () => {
    // Create mock API instance with proper Jest mock functions
    mockApi = {
      isConnected: true,
      on: jest.fn(),
      rpc: {
        chain: {
          getHeader: jest.fn(),
          getBlockHash: jest.fn(),
          getBlock: jest.fn()
        },
        system: {
          chain: jest.fn(),
          name: jest.fn(),
          version: jest.fn(),
          properties: jest.fn()
        }
      },
      query: {
        system: {
          events: {
            at: jest.fn()
          }
        }
      },
      disconnect: jest.fn()
    };

    mockWsProvider = {
      disconnect: jest.fn()
    };

    // Mock ApiPromise.create
    (ApiPromise.create as jest.Mock).mockResolvedValue(mockApi);
    (WsProvider as jest.Mock).mockImplementation(() => mockWsProvider);

    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainService],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect to blockchain successfully', async () => {
      await service.connect();

      expect(WsProvider).toHaveBeenCalledWith('wss://rpc.cc3-devnet-dryrun.creditcoin.network/ws');
      expect(ApiPromise.create).toHaveBeenCalledWith({ provider: mockWsProvider });
      expect(mockApi.on).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockApi.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockApi.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      (ApiPromise.create as jest.Mock).mockRejectedValue(error);

      await expect(service.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnect', () => {
    it('should disconnect from blockchain', async () => {
      // First connect
      await service.connect();
      
      // Then disconnect
      await service.disconnect();

      expect(mockApi.disconnect).toHaveBeenCalled();
      expect(mockWsProvider.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect when not connected', async () => {
      await service.disconnect();
      
      expect(mockApi.disconnect).not.toHaveBeenCalled();
      expect(mockWsProvider.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('isConnected', () => {
    it('should return true when connected', async () => {
      await service.connect();
      expect(service.isConnected()).toBe(true);
    });

    it('should return false when not connected', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should return false when API is null', () => {
      (service as any).api = null;
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('searchAddressInRecentBlocks', () => {
    beforeEach(async () => {
      await service.connect();
      
      // Mock latest header
      mockApi.rpc.chain.getHeader.mockResolvedValue({
        number: { toNumber: () => 1000 }
      } as any);
    });

    it('should search address in recent blocks successfully', async () => {
      // Mock block processing
      const mockBlockHash = '0x1234567890abcdef';
      const mockSignedBlock = {
        block: {
          extrinsics: [mockExtrinsic]
        }
      };
      const mockEvents = [mockEvent];

      mockApi.rpc.chain.getBlockHash.mockResolvedValue(mockBlockHash as any);
      mockApi.rpc.chain.getBlock.mockResolvedValue(mockSignedBlock as any);
      mockApi.query.system.events.at.mockResolvedValue(mockEvents as any);

      const results = await service.searchAddressInRecentBlocks(mockAddress, 10, 5);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        blockNumber: 1000,
        blockHash: mockBlockHash,
        section: 'balances',
        method: 'transfer',
        data: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'],
        extrinsicHash: '0xabcdef1234567890',
        extrinsicIndex: 0
      });
    });

    it('should handle empty results', async () => {
      const mockSignedBlock = {
        block: {
          extrinsics: []
        }
      };
      const mockEvents: EventRecord[] = [];

      mockApi.rpc.chain.getBlockHash.mockResolvedValue(mockBlockHash as any);
      mockApi.rpc.chain.getBlock.mockResolvedValue(mockSignedBlock as any);
      mockApi.query.system.events.at.mockResolvedValue(mockEvents as any);

      const results = await service.searchAddressInRecentBlocks(mockAddress, 10, 5);

      expect(results).toHaveLength(0);
    });

    it('should throw error when API not initialized', async () => {
      (service as any).api = null;

      await expect(
        service.searchAddressInRecentBlocks(mockAddress, 10, 5)
      ).rejects.toThrow('API not initialized. Please call connect() first.');
    });

    it('should process blocks in batches correctly', async () => {
      // Mock multiple blocks
      const mockSignedBlock = {
        block: {
          extrinsics: [mockExtrinsic]
        }
      };
      const mockEvents: EventRecord[] = [];

      mockApi.rpc.chain.getBlockHash.mockResolvedValue(mockBlockHash as any);
      mockApi.rpc.chain.getBlock.mockResolvedValue(mockSignedBlock as any);
      mockApi.query.system.events.at.mockResolvedValue(mockEvents as any);

      const results = await service.searchAddressInRecentBlocks(mockAddress, 15, 5);

      // Should process 15 blocks in batches of 5
      expect(mockApi.rpc.chain.getBlockHash).toHaveBeenCalledTimes(15);
      expect(results).toHaveLength(15);
    });
  });

  describe('getBlockInfo', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should get block information successfully', async () => {
      const mockHeader = {
        parentHash: { toHex: () => '0xparent123' },
        stateRoot: { toHex: () => '0xstate123' },
        extrinsicsRoot: { toHex: () => '0xextrinsics123' }
      };
      const mockSignedBlock = {
        block: {
          extrinsics: [mockExtrinsic, mockExtrinsic] // 2 extrinsics
        }
      };

      mockApi.rpc.chain.getBlockHash.mockResolvedValue(mockBlockHash as any);
      mockApi.rpc.chain.getBlock.mockResolvedValue(mockSignedBlock as any);
      mockApi.rpc.chain.getHeader.mockResolvedValue(mockHeader as any);

      const blockInfo = await service.getBlockInfo(1000);

      expect(blockInfo).toEqual({
        number: 1000,
        hash: mockBlockHash,
        parentHash: '0xparent123',
        stateRoot: '0xstate123',
        extrinsicsRoot: '0xextrinsics123',
        extrinsicsCount: 2
      });
    });

    it('should throw error when API not initialized', async () => {
      (service as any).api = null;

      await expect(service.getBlockInfo(1000)).rejects.toThrow('API not initialized.');
    });
  });

  describe('getLatestBlockNumber', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should get latest block number successfully', async () => {
      mockApi.rpc.chain.getHeader.mockResolvedValue({
        number: { toNumber: () => 1500 }
      } as any);

      const latestBlock = await service.getLatestBlockNumber();

      expect(latestBlock).toBe(1500);
    });

    it('should throw error when API not initialized', async () => {
      (service as any).api = null;

      await expect(service.getLatestBlockNumber()).rejects.toThrow('API not initialized.');
    });
  });

  describe('getNetworkInfo', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should get network information successfully', async () => {
      mockApi.rpc.system.chain.mockResolvedValue('Creditcoin' as any);
      mockApi.rpc.system.name.mockResolvedValue('creditcoin-node' as any);
      mockApi.rpc.system.version.mockResolvedValue('1.0.0' as any);
      mockApi.rpc.system.properties.mockResolvedValue({} as any);
      mockApi.rpc.chain.getHeader.mockResolvedValue({
        number: { toNumber: () => 2000 }
      } as any);

      const networkInfo = await service.getNetworkInfo();

      expect(networkInfo).toEqual({
        name: 'Creditcoin',
        version: '1.0.0',
        chain: 'Creditcoin',
        nodeName: 'creditcoin-node',
        nodeVersion: '1.0.0',
        latestBlock: 2000,
        peers: 0
      });
    });

    it('should throw error when API not initialized', async () => {
      (service as any).api = null;

      await expect(service.getNetworkInfo()).rejects.toThrow('API not initialized.');
    });
  });

  describe('processBlock (private method)', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should process block with both extrinsics and events', async () => {
      const mockSignedBlock = {
        block: {
          extrinsics: [mockExtrinsic]
        }
      };
      const mockEvents = [mockEvent];

      mockApi.rpc.chain.getBlockHash.mockResolvedValue(mockBlockHash as any);
      mockApi.rpc.chain.getBlock.mockResolvedValue(mockSignedBlock as any);
      mockApi.query.system.events.at.mockResolvedValue(mockEvents as any);

      // Use reflection to access private method
      const processBlock = (service as any).processBlock.bind(service);
      const results = await processBlock(mockAddress, 1000);

      expect(results).toHaveLength(2); // 1 extrinsic + 1 event
    });

    it('should handle block processing errors gracefully', async () => {
      mockApi.rpc.chain.getBlockHash.mockRejectedValue(new Error('Block not found'));

      // Use reflection to access private method
      const processBlock = (service as any).processBlock.bind(service);
      const results = await processBlock(mockAddress, 1000);

      expect(results).toHaveLength(0);
    });
  });
});
