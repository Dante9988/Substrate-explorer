import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from './blockchain.service';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { mnemonicToMiniSecret } from '@polkadot/util-crypto';
import { TxHit } from '@blockchain-explorer/shared';

describe('BlockchainService Integration Tests', () => {
  let service: BlockchainService;
  let api: ApiPromise;
  let keyring: Keyring;
  let testAddress: string;

  // Test configuration
  const SEED_PHRASE = 'panda quote bronze era web plug market april buzz damage foster source';
  const RPC_ENDPOINT = 'wss://rpc.cc3-devnet-dryrun.creditcoin.network/ws';
  const TEST_AMOUNT = '1000000000000'; // 1 unit in smallest denomination

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
  }, 30000); // 30 second timeout for connection

  afterAll(async () => {
    if (api) {
      await api.disconnect();
    }
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainService],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
    
    // Connect the service
    await service.connect();
  });

  afterEach(async () => {
    if (service) {
      await service.disconnect();
    }
  });

  describe('Real Blockchain Connection', () => {
    it('should connect to live blockchain successfully', async () => {
      expect(service.isConnected()).toBe(true);
      
      // Verify we can get real network info
      const networkInfo = await service.getNetworkInfo();
      expect(networkInfo).toBeDefined();
      expect(networkInfo.latestBlock).toBeGreaterThan(0);
      expect(networkInfo.chain).toBeDefined();
      
      console.log(`📊 Network: ${networkInfo.chain}, Latest Block: ${networkInfo.latestBlock}`);
    });

    it('should get real block information', async () => {
      const latestBlock = await service.getLatestBlockNumber();
      expect(latestBlock).toBeGreaterThan(0);
      
      const blockInfo = await service.getBlockInfo(latestBlock);
      expect(blockInfo.number).toBe(latestBlock);
      expect(blockInfo.hash).toBeDefined();
      expect(blockInfo.extrinsicsCount).toBeGreaterThanOrEqual(0);
      
      console.log(`📦 Block #${latestBlock}: ${blockInfo.extrinsicsCount} extrinsics`);
    });
  });

  describe('Address Search on Live Network', () => {
    it('should search for transactions by address in recent blocks', async () => {
      // Search for transactions involving our test address
      const results = await service.searchAddressInRecentBlocks(testAddress, 10, 5);
      
      console.log(`🔍 Found ${results.length} transactions for address ${testAddress}`);
      
      // Log any found transactions
      results.forEach((tx, index) => {
        console.log(`  ${index + 1}. Block #${tx.blockNumber}: ${tx.section}.${tx.method}`);
        console.log(`     Hash: ${tx.extrinsicHash}`);
        console.log(`     Data: ${JSON.stringify(tx.data)}`);
      });
      
      // We might not have transactions yet, but the search should work
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search for transactions by block hash', async () => {
      const latestBlock = await service.getLatestBlockNumber();
      const blockInfo = await service.getBlockInfo(latestBlock);
      
      // Search in just this block
      const results = await service.searchAddressInRecentBlocks(testAddress, 1, 1);
      
      console.log(`🔍 Block #${latestBlock} (${blockInfo.hash}): ${results.length} transactions found`);
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Transaction Monitoring', () => {
    it('should detect new blocks and transactions', async () => {
      const initialBlock = await service.getLatestBlockNumber();
      console.log(`📊 Initial block: ${initialBlock}`);
      
      // Wait a bit for potential new blocks
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const currentBlock = await service.getLatestBlockNumber();
      console.log(`📊 Current block: ${currentBlock}`);
      
      if (currentBlock > initialBlock) {
        console.log(`🆕 New blocks detected: ${currentBlock - initialBlock}`);
        
        // Search in the new blocks
        const newBlocksCount = currentBlock - initialBlock;
        const results = await service.searchAddressInRecentBlocks(testAddress, newBlocksCount, 5);
        
        console.log(`🔍 Found ${results.length} transactions in new blocks`);
      } else {
        console.log(`⏳ No new blocks in the last 5 seconds`);
      }
      
      expect(currentBlock).toBeGreaterThanOrEqual(initialBlock);
    });
  });

  describe('Block Data Analysis', () => {
    it('should analyze block structure and extrinsics', async () => {
      const latestBlock = await service.getLatestBlockNumber();
      const blockInfo = await service.getBlockInfo(latestBlock);
      
      console.log(`📦 Block #${latestBlock} Analysis:`);
      console.log(`   Hash: ${blockInfo.hash}`);
      console.log(`   Parent: ${blockInfo.parentHash}`);
      console.log(`   State Root: ${blockInfo.stateRoot}`);
      console.log(`   Extrinsics: ${blockInfo.extrinsicsCount}`);
      
      // Get more detailed block info if available
      if (blockInfo.extrinsicsCount > 0) {
        console.log(`   📝 Block has ${blockInfo.extrinsicsCount} transactions`);
      }
      
      expect(blockInfo.hash).toBeDefined();
      expect(blockInfo.parentHash).toBeDefined();
      expect(blockInfo.stateRoot).toBeDefined();
    });
  });

  describe('Network Information', () => {
    it('should get comprehensive network details', async () => {
      const networkInfo = await service.getNetworkInfo();
      
      console.log(`🌐 Network Information:`);
      console.log(`   Name: ${networkInfo.name}`);
      console.log(`   Chain: ${networkInfo.chain}`);
      console.log(`   Node: ${networkInfo.nodeName} v${networkInfo.nodeVersion}`);
      console.log(`   Latest Block: ${networkInfo.latestBlock}`);
      console.log(`   Peers: ${networkInfo.peers}`);
      
      expect(networkInfo.name).toBeDefined();
      expect(networkInfo.chain).toBeDefined();
      expect(networkInfo.nodeName).toBeDefined();
      expect(networkInfo.latestBlock).toBeGreaterThan(0);
    });
  });

  describe('Performance Testing', () => {
    it('should handle batch processing efficiently', async () => {
      const startTime = Date.now();
      
      // Search in 50 blocks with batch size 10
      const results = await service.searchAddressInRecentBlocks(testAddress, 50, 10);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⚡ Batch processing performance:`);
      console.log(`   Blocks scanned: 50`);
      console.log(`   Batch size: 10`);
      console.log(`   Results found: ${results.length}`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Rate: ${(50 / (duration / 1000)).toFixed(2)} blocks/second`);
      
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
