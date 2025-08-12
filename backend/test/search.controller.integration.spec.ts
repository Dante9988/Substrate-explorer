import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SearchController } from './search.controller';
import { BlockchainService } from '../blockchain/blockchain.service';
import { SearchModule } from './search.module';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { TxHit } from '@blockchain-explorer/shared';

describe('SearchController Integration Tests', () => {
  let app: INestApplication;
  let controller: SearchController;
  let blockchainService: BlockchainService;
  let api: ApiPromise;
  let keyring: Keyring;
  let testAddress: string;

  // Test configuration
  const SEED_PHRASE = 'panda quote bronze era web plug market april buzz damage foster source';
  const RPC_ENDPOINT = 'wss://rpc.cc3-devnet-dryrun.creditcoin.network/ws';

  beforeAll(async () => {
    // Connect to the real blockchain
    const wsProvider = new WsProvider(RPC_ENDPOINT);
    api = await ApiPromise.create({ provider: wsProvider });
    
    // Setup keyring with test account
    keyring = new Keyring({ type: 'sr25519' });
    const pair = keyring.addFromMnemonic(SEED_PHRASE);
    testAddress = pair.address;
    
    console.log(`🔑 Test account address: ${testAddress}`);
    console.log(`🌐 Connected to: ${RPC_ENDPOINT}`);
  }, 30000);

  afterAll(async () => {
    if (api) {
      await api.disconnect();
    }
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SearchModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<SearchController>(SearchController);
    blockchainService = module.get<BlockchainService>(BlockchainService);
    
    // Connect the service
    await blockchainService.connect();
  });

  afterEach(async () => {
    if (blockchainService) {
      await blockchainService.disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  describe('Real API Endpoints', () => {
    it('should search for address via controller method', async () => {
      const results = await controller.searchAddress(testAddress, '10', '5');
      
      console.log(`🔍 Controller search results: ${results.total} transactions found`);
      console.log(`   Blocks scanned: ${results.blocksScanned}`);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results.transactions)).toBe(true);
      expect(typeof results.total).toBe('number');
      expect(typeof results.blocksScanned).toBe('number');
    });

    it('should get block information via controller method', async () => {
      const latestBlock = await blockchainService.getLatestBlockNumber();
      const blockInfo = await controller.getBlock(latestBlock.toString());
      
      console.log(`📦 Controller block info for #${latestBlock}:`);
      console.log(`   Hash: ${blockInfo.hash}`);
      console.log(`   Extrinsics: ${blockInfo.extrinsicsCount}`);
      
      expect(blockInfo.number).toBe(latestBlock);
      expect(blockInfo.hash).toBeDefined();
      expect(blockInfo.extrinsicsCount).toBeGreaterThanOrEqual(0);
    });

    it('should get latest block via controller method', async () => {
      const latestBlock = await controller.getLatestBlock();
      
      console.log(`📊 Controller latest block: ${latestBlock.latestBlock}`);
      
      expect(latestBlock.latestBlock).toBeGreaterThan(0);
      expect(typeof latestBlock.latestBlock).toBe('number');
    });

    it('should get network information via controller method', async () => {
      const networkInfo = await controller.getNetworkInfo();
      
      console.log(`🌐 Controller network info:`);
      console.log(`   Name: ${networkInfo.name}`);
      console.log(`   Chain: ${networkInfo.chain}`);
      console.log(`   Latest Block: ${networkInfo.latestBlock}`);
      
      expect(networkInfo.name).toBeDefined();
      expect(networkInfo.chain).toBeDefined();
      expect(networkInfo.latestBlock).toBeGreaterThan(0);
    });
  });

  describe('Parameter Validation', () => {
    it('should handle missing address parameter', async () => {
      await expect(controller.searchAddress('')).rejects.toThrow('Address parameter is required');
    });

    it('should handle invalid block numbers', async () => {
      await expect(controller.getBlock('0')).rejects.toThrow('Invalid block number');
      await expect(controller.getBlock('-100')).rejects.toThrow('Invalid block number');
      await expect(controller.getBlock('invalid')).rejects.toThrow('Invalid block number');
    });

    it('should handle invalid blocksToScan values', async () => {
      await expect(controller.searchAddress(testAddress, '0')).rejects.toThrow('blocksToScan must be a positive number <= 1000');
      await expect(controller.searchAddress(testAddress, '1500')).rejects.toThrow('blocksToScan must be a positive number <= 1000');
      await expect(controller.searchAddress(testAddress, 'invalid')).rejects.toThrow('blocksToScan must be a positive number <= 1000');
    });

    it('should handle invalid batchSize values', async () => {
      await expect(controller.searchAddress(testAddress, '100', '0')).rejects.toThrow('batchSize must be a positive number <= 100');
      await expect(controller.searchAddress(testAddress, '100', '150')).rejects.toThrow('batchSize must be a positive number <= 100');
      await expect(controller.searchAddress(testAddress, '100', 'invalid')).rejects.toThrow('batchSize must be a positive number <= 100');
    });
  });

  describe('Service Integration', () => {
    it('should use blockchain service for all operations', async () => {
      // Verify that the controller is properly using the blockchain service
      expect(blockchainService.isConnected()).toBe(true);
      
      // Test that service methods are called
      const spy = jest.spyOn(blockchainService, 'searchAddressInRecentBlocks');
      
      await controller.searchAddress(testAddress, '5', '5');
      
      expect(spy).toHaveBeenCalledWith(testAddress, 5, 5);
      spy.mockRestore();
    });

    it('should handle service disconnection gracefully', async () => {
      await blockchainService.disconnect();
      
      await expect(controller.searchAddress(testAddress)).rejects.toThrow('Blockchain service not connected');
      await expect(controller.getBlock('1000')).rejects.toThrow('Blockchain service not connected');
      await expect(controller.getLatestBlock()).rejects.toThrow('Blockchain service not connected');
      await expect(controller.getNetworkInfo()).rejects.toThrow('Blockchain service not connected');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large block ranges efficiently', async () => {
      const startTime = Date.now();
      
      // Search in 100 blocks
      const results = await controller.searchAddress(testAddress, '100', '10');
      
      const duration = Date.now() - startTime;
      
      console.log(`⚡ Large range search performance:`);
      console.log(`   Blocks scanned: 100`);
      console.log(`   Batch size: 10`);
      console.log(`   Results found: ${results.total}`);
      console.log(`   Duration: ${duration}ms`);
      
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(results.blocksScanned).toBe(100);
    });

    it('should handle different batch sizes', async () => {
      const batchSizes = [1, 5, 10, 20];
      
      for (const batchSize of batchSizes) {
        const startTime = Date.now();
        
        const results = await controller.searchAddress(testAddress, '20', batchSize.toString());
        
        const duration = Date.now() - startTime;
        
        console.log(`📊 Batch size ${batchSize}: ${duration}ms, ${results.total} results`);
        
        expect(results.blocksScanned).toBe(20);
        expect(duration).toBeLessThan(10000); // Each should complete within 10 seconds
      }
    });
  });

  describe('Real Transaction Data', () => {
    it('should return properly formatted transaction data', async () => {
      const results = await controller.searchAddress(testAddress, '20', '10');
      
      if (results.transactions.length > 0) {
        const tx = results.transactions[0];
        
        console.log(`📝 Sample transaction data:`);
        console.log(`   Block: #${tx.blockNumber}`);
        console.log(`   Section: ${tx.section}`);
        console.log(`   Method: ${tx.method}`);
        console.log(`   Hash: ${tx.extrinsicHash}`);
        
        // Verify data structure
        expect(tx.blockNumber).toBeGreaterThan(0);
        expect(tx.blockHash).toBeDefined();
        expect(tx.section).toBeDefined();
        expect(tx.method).toBeDefined();
        expect(tx.extrinsicHash).toBeDefined();
        expect(Array.isArray(tx.data)).toBe(true);
      } else {
        console.log(`📝 No transactions found for address ${testAddress} in recent blocks`);
      }
      
      expect(Array.isArray(results.transactions)).toBe(true);
    });

    it('should handle empty results gracefully', async () => {
      // Use a random address that likely has no transactions
      const randomAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUipZC92UhjJM694ty';
      
      const results = await controller.searchAddress(randomAddress, '10', '5');
      
      console.log(`🔍 Random address search: ${results.total} transactions found`);
      
      expect(results.total).toBe(0);
      expect(results.transactions).toHaveLength(0);
      expect(results.blocksScanned).toBe(10);
    });
  });
});
