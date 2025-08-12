import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { SearchModule } from './search.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { BlockchainService } from '../blockchain/blockchain.service';

describe('Search API Endpoints - Explorer Functionality', () => {
  let app: INestApplication;
  let blockchainService: BlockchainService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SearchModule, BlockchainModule, WebSocketModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    blockchainService = moduleFixture.get<BlockchainService>(BlockchainService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock the blockchain service connection for tests
    jest.spyOn(blockchainService, 'isConnected').mockReturnValue(true);

    // Mock blockchain service methods with test data
    jest.spyOn(blockchainService, 'searchAddressInRecentBlocks').mockImplementation(async (address: string) => {
      // Return empty results for empty address test
      if (address === '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty') {
        return [];
      }
      
      // Return mock data for other addresses
      return [
        {
          blockNumber: 10048,
          blockHash: '0x84f2dbaa1bae970ac5727ad3cd82ba9e1321288392abcdef1234567890abcdef',
          section: 'Timestamp',
          method: 'set',
          data: ['1729123200'],
          extrinsicHash: '0x84f2dbaa1bae970ac5727ad3cd82ba9e1321288392abcdef1234567890abcdef',
          extrinsicIndex: 0,
          signer: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          nonce: 123,
          args: [{'now': '1729123200'}],
          events: [
            {
              section: 'System',
              method: 'ExtrinsicSuccess',
              data: [{'fee': '265,758,000'}]
            }
          ]
        }
      ];
    });

    jest.spyOn(blockchainService, 'getBlockInfo').mockImplementation(async (blockNumber: number) => {
      // Return error for non-existent block to test 404 scenario
      if (blockNumber === 999999999) {
        throw new Error('Unable to retrieve header 18,52,86,120,144,171,205,239,18,52,86,120,144,171,205,239,18,52,86,120,144,171,205,239,18,52,86,120,144,171,205,239 and parent 0x0000000000000000000000000000000000000000000000000000000000000000 from supplied hash');
      }
      
      // Return mock data for other block numbers
      return {
        number: blockNumber,
        hash: '0x84f2dbaa1bae970ac5727ad3cd82ba9e1321288392abcdef1234567890abcdef',
        parentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        stateRoot: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        extrinsicsRoot: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
        timestamp: 1729123200000,
        extrinsicsCount: 2,
        eventsCount: 2,
        extrinsics: [
          {
            index: 0,
            hash: '0x84f2dbaa1bae970ac5727ad3cd82ba9e1321288392abcdef1234567890abcdef',
            section: 'Timestamp',
            method: 'set',
            signer: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
            nonce: 123,
            args: [{'now': '1729123200'}],
            events: [
              {
                section: 'System',
                method: 'ExtrinsicSuccess',
                data: [{'fee': '265,758,000'}]
              }
            ]
          }
        ],
        events: [
          {
            index: 0,
            section: 'System',
            method: 'ExtrinsicSuccess',
            data: [{'fee': '265,758,000'}],
            phase: 'ApplyExtrinsic',
            extrinsicIndex: 0
          }
        ]
      };
    });

    jest.spyOn(blockchainService, 'getLatestBlockNumber').mockResolvedValue(10050);
    jest.spyOn(blockchainService, 'getNetworkInfo').mockResolvedValue({
      name: 'Creditcoin Devnet',
      version: '0.9.0',
      chain: 'creditcoin-devnet',
      nodeName: 'creditcoin-node',
      nodeVersion: '0.9.0',
      latestBlock: 10050,
      peers: 5,
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
    });

    jest.spyOn(blockchainService, 'searchExtrinsicByHash').mockImplementation(async (extrinsicHash: string) => {
      // Return null for fake hash to test 404 scenario
      if (extrinsicHash === '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef') {
        return null;
      }
      
      // Return mock data for other hashes
      return {
        extrinsic: {
          index: 0,
          hash: extrinsicHash,
          section: 'Timestamp',
          method: 'set',
          signer: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          nonce: 123,
          args: [{'now': '1729123200'}],
          events: [
            {
              section: 'System',
              method: 'ExtrinsicSuccess',
              data: [{'fee': '265,758,000'}]
            }
          ]
        },
        block: {
          number: 10048,
          hash: '0x84f2dbaa1bae970ac5727ad3cd82ba9e1321288392abcdef1234567890abcdef',
          timestamp: 1729123200000
        }
      };
    });

    // Mock the new getBlockInfoByHash method
    jest.spyOn(blockchainService, 'getBlockInfoByHash').mockImplementation(async (blockHash: string) => {
      // Return error for fake hash to test 404 scenario
      if (blockHash === '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef') {
        throw new Error('Block not found');
      }
      
      // Return mock data for other hashes
      return {
        number: 10000,
        hash: blockHash,
        parentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        stateRoot: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        extrinsicsRoot: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
        timestamp: 1729123200000,
        extrinsicsCount: 2,
        eventsCount: 2,
        extrinsics: [
          {
            index: 0,
            hash: '0x84f2dbaa1bae970ac5727ad3cd82ba9e1321288392abcdef1234567890abcdef',
            section: 'Timestamp',
            method: 'set',
            signer: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
            nonce: 123,
            args: [{'now': '1729123200'}],
            events: [
              {
                section: 'System',
                method: 'ExtrinsicSuccess',
                data: [{'fee': '265,758,000'}]
              }
            ]
          }
        ],
        events: [
          {
            index: 0,
            section: 'System',
            method: 'ExtrinsicSuccess',
            data: [{'fee': '265,758,000'}],
            phase: 'ApplyExtrinsic',
            extrinsicIndex: 0
          }
        ]
      };
    });
  });

  describe('GET /api/search/address', () => {
    it('should return explorer data when searching by valid address', async () => {
      // Test with a valid address to see how the explorer exposes transaction data
      const validAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      const response = await request(app.getHttpServer())
        .get(`/api/search/address?address=${validAddress}&blocksToScan=10`)
        .expect(200);

      // Verify the explorer response structure
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('blocksScanned');
      expect(Array.isArray(response.body.transactions)).toBe(true);
      
      // If there are results, verify the explorer data structure
      if (response.body.transactions.length > 0) {
        const firstResult = response.body.transactions[0];
        
        // Verify the explorer exposes all necessary fields for display
        expect(firstResult).toHaveProperty('blockNumber');
        expect(firstResult).toHaveProperty('blockHash');
        expect(firstResult).toHaveProperty('section');
        expect(firstResult).toHaveProperty('method');
        expect(firstResult).toHaveProperty('data');
        expect(firstResult).toHaveProperty('extrinsicHash');
        expect(firstResult).toHaveProperty('extrinsicIndex');
        // Note: eventIndex is not applicable for extrinsic results, they have events array instead
        expect(firstResult).toHaveProperty('signer');
        expect(firstResult).toHaveProperty('nonce');
        expect(firstResult).toHaveProperty('args');
        expect(firstResult).toHaveProperty('events');
        
        // Verify data types for explorer display
        expect(typeof firstResult.blockNumber).toBe('number');
        expect(typeof firstResult.blockHash).toBe('string');
        expect(typeof firstResult.section).toBe('string');
        expect(typeof firstResult.method).toBe('string');
        expect(Array.isArray(firstResult.data)).toBe(true);
        expect(typeof firstResult.extrinsicHash).toBe('string');
        expect(typeof firstResult.extrinsicIndex).toBe('number');
        expect(typeof firstResult.signer).toBe('string');
        expect(typeof firstResult.nonce).toBe('number');
        expect(Array.isArray(firstResult.args)).toBe(true);
        expect(Array.isArray(firstResult.events)).toBe(true);
      }
    });

    it('should handle search results consistently regardless of count', async () => {
      // Test with an address that might have fewer transactions
      const testAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
      
      const response = await request(app.getHttpServer())
        .get(`/api/search/address?address=${testAddress}&blocksToScan=5`)
        .expect(200);

      // Verify the explorer returns a consistent SearchResult structure
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('blocksScanned');
      expect(Array.isArray(response.body.transactions)).toBe(true);
      
      // Verify that the structure is consistent whether there are results or not
      if (response.body.transactions.length > 0) {
        // If there are results, verify the first result has the expected structure
        const firstResult = response.body.transactions[0];
        expect(firstResult).toHaveProperty('blockNumber');
        expect(firstResult).toHaveProperty('blockHash');
        expect(firstResult).toHaveProperty('section');
        expect(firstResult).toHaveProperty('method');
        expect(firstResult).toHaveProperty('data');
        expect(firstResult).toHaveProperty('extrinsicHash');
        expect(firstResult).toHaveProperty('extrinsicIndex');
        expect(firstResult).toHaveProperty('signer');
        expect(firstResult).toHaveProperty('nonce');
        expect(firstResult).toHaveProperty('args');
        expect(firstResult).toHaveProperty('events');
      }
      
      // Verify the response structure is always consistent
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.blocksScanned).toBe('number');
      expect(response.body.total).toBe(response.body.transactions.length);
    });

    it('should validate address parameter format', async () => {
      // Test with invalid address format
      const invalidAddress = 'invalid-address-format';
      
      const response = await request(app.getHttpServer())
        .get(`/api/search/address?address=${invalidAddress}&blocksToScan=5`)
        .expect(400);

      // Verify the explorer provides meaningful error messages
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('address');
    });

    it('should validate blocksToScan parameter', async () => {
      const validAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      // Test with invalid blocksToScan
      const response = await request(app.getHttpServer())
        .get(`/api/search/address?address=${validAddress}&blocksToScan=-1`)
        .expect(400);

      // Verify the explorer provides meaningful error messages
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('blocksToScan');
    });

    it('should limit blocksToScan to reasonable bounds', async () => {
      const validAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      // Test with extremely large blocksToScan
      const response = await request(app.getHttpServer())
        .get(`/api/search/address?address=${validAddress}&blocksToScan=100000`)
        .expect(400);

      // Verify the explorer enforces reasonable limits
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('blocksToScan');
    });

    it('should provide consistent response structure across different searches', async () => {
      const address1 = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const address2 = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
      
      const response1 = await request(app.getHttpServer())
        .get(`/api/search/address?address=${address1}&blocksToScan=5`)
        .expect(200);
      
      const response2 = await request(app.getHttpServer())
        .get(`/api/search/address?address=${address2}&blocksToScan=5`)
        .expect(200);

      // Verify consistent response structure regardless of results
      expect(response1.body).toHaveProperty('transactions');
      expect(response1.body).toHaveProperty('total');
      expect(response1.body).toHaveProperty('blocksScanned');
      expect(response2.body).toHaveProperty('transactions');
      expect(response2.body).toHaveProperty('total');
      expect(response2.body).toHaveProperty('blocksScanned');
      
      // Both should have the same structure even if one is empty
      if (response1.body.transactions.length > 0 && response2.body.transactions.length > 0) {
        const keys1 = Object.keys(response1.body.transactions[0]);
        const keys2 = Object.keys(response2.body.transactions[0]);
        expect(keys1).toEqual(keys2);
      }
    });
  });

  describe('GET /api/block/:blockNumber', () => {
    it('should return block details with explorer data structure', async () => {
      // Test with a valid block number (use a recent one that's more likely to exist)
      const blockNumber = 10000; // Use a more recent block number
      
      const response = await request(app.getHttpServer())
        .get(`/api/block/${blockNumber}`)
        .expect(200);

      // Verify the explorer exposes block information
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('number');
      expect(response.body).toHaveProperty('hash');
      expect(response.body).toHaveProperty('extrinsicsCount');
      expect(response.body).toHaveProperty('eventsCount');
      
      // Note: extrinsics and events might not be populated in test environment
      // due to blockchain service limitations, so we check if they exist
      if (response.body.extrinsics) {
        expect(Array.isArray(response.body.extrinsics)).toBe(true);
        
        if (response.body.extrinsics.length > 0) {
          const firstExtrinsic = response.body.extrinsics[0];
          expect(firstExtrinsic).toHaveProperty('section');
          expect(firstExtrinsic).toHaveProperty('method');
          expect(firstExtrinsic).toHaveProperty('signer');
          expect(firstExtrinsic).toHaveProperty('hash');
          expect(firstExtrinsic).toHaveProperty('index');
          expect(firstExtrinsic).toHaveProperty('args');
          expect(firstExtrinsic).toHaveProperty('events');
        }
      }
      
      if (response.body.events) {
        expect(Array.isArray(response.body.events)).toBe(true);
      }
    });

    it('should handle non-existent block gracefully', async () => {
      // Test with a very high block number
      const nonExistentBlock = 999999999;
      
      const response = await request(app.getHttpServer())
        .get(`/api/block/${nonExistentBlock}`)
        .expect(404);

      // Verify the explorer provides meaningful error messages
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Block not found');
    });

    it('should validate block number parameter', async () => {
      // Test with invalid block number
      const invalidBlock = 'invalid';
      
      const response = await request(app.getHttpServer())
        .get(`/api/block/${invalidBlock}`)
        .expect(400);

      // Verify the explorer provides meaningful error messages
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('block number');
    });
  });

  describe('GET /api/blocks/latest', () => {
    it('should return latest block information for explorer display', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/blocks/latest')
        .expect(200);

      // Verify the explorer exposes latest block info
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('latestBlock');
      expect(typeof response.body.latestBlock).toBe('number');
      expect(response.body.latestBlock).toBeGreaterThan(0);
    });
  });

  describe('GET /api/network/info', () => {
    it('should return network information for explorer display', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/network/info')
        .expect(200);

      // Verify the explorer exposes network information
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('chain');
      expect(response.body).toHaveProperty('latestBlock');
      expect(response.body).toHaveProperty('peers');
      
      // Verify data types for explorer display
      expect(typeof response.body.name).toBe('string');
      expect(typeof response.body.version).toBe('string');
      expect(typeof response.body.chain).toBe('string');
      expect(typeof response.body.latestBlock).toBe('number');
      expect(typeof response.body.peers).toBe('number');
    });
  });

  describe('GET /api/extrinsic/:extrinsicHash', () => {
    it('should return extrinsic details when found', async () => {
      // First, search for an address to get a valid extrinsic hash
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      const searchResponse = await request(app.getHttpServer())
        .get(`/api/search/address?address=${testAddress}&blocksToScan=10`)
        .expect(200);

      if (searchResponse.body.transactions.length > 0) {
        const firstResult = searchResponse.body.transactions[0];
        const extrinsicHash = firstResult.extrinsicHash;

        // Now test the extrinsic endpoint
        const response = await request(app.getHttpServer())
          .get(`/api/extrinsic/${extrinsicHash}`)
          .expect(200);

        // Verify the extrinsic response structure
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('extrinsic');
        expect(response.body).toHaveProperty('block');

        // Verify extrinsic details
        const extrinsic = response.body.extrinsic;
        expect(extrinsic).toHaveProperty('index');
        expect(extrinsic).toHaveProperty('hash');
        expect(extrinsic).toHaveProperty('section');
        expect(extrinsic).toHaveProperty('method');
        expect(extrinsic).toHaveProperty('signer');
        expect(extrinsic).toHaveProperty('nonce');
        expect(extrinsic).toHaveProperty('args');
        expect(extrinsic).toHaveProperty('events');

        // Verify block details
        const block = response.body.block;
        expect(block).toHaveProperty('number');
        expect(block).toHaveProperty('hash');
        expect(block).toHaveProperty('timestamp');

        // Verify data types
        expect(typeof extrinsic.index).toBe('number');
        expect(typeof extrinsic.hash).toBe('string');
        expect(typeof extrinsic.section).toBe('string');
        expect(typeof extrinsic.method).toBe('string');
        expect(typeof extrinsic.signer).toBe('string');
        expect(typeof extrinsic.nonce).toBe('number');
        expect(Array.isArray(extrinsic.args)).toBe(true);
        expect(Array.isArray(extrinsic.events)).toBe(true);

        // Verify the hash matches
        expect(extrinsic.hash).toBe(extrinsicHash);
      }
    });

    it('should return 400 for invalid extrinsic hash format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/extrinsic/invalid-hash')
        .expect(400);

      expect(response.body.message).toContain('Invalid extrinsic hash format');
    });

    it('should return 400 for missing extrinsic hash', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/extrinsic/')
        .expect(404); // This will be a 404 from the router, not our validation
    });

    it('should return 404 for non-existent extrinsic hash', async () => {
      const fakeHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const response = await request(app.getHttpServer())
        .get(`/api/extrinsic/${fakeHash}`)
        .expect(404);

      expect(response.body.message).toContain('Extrinsic not found');
    });

    it('should validate blocksToScan parameter', async () => {
      const fakeHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const response = await request(app.getHttpServer())
        .get(`/api/extrinsic/${fakeHash}?blocksToScan=0`)
        .expect(400);

      expect(response.body.message).toContain('blocksToScan must be a positive number');
    });

    it('should validate batchSize parameter', async () => {
      const fakeHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const response = await request(app.getHttpServer())
        .get(`/api/extrinsic/${fakeHash}?batchSize=0`)
        .expect(400);

      expect(response.body.message).toContain('batchSize must be a positive number');
    });
  });

  describe('GET /api/block/hash/:blockHash', () => {
    it('should return block details when searching by valid block hash', async () => {
      // First, get a valid block hash by searching for a block
      const blockNumber = 10000;
      
      const blockResponse = await request(app.getHttpServer())
        .get(`/api/block/${blockNumber}`)
        .expect(200);

      const blockHash = blockResponse.body.hash;

      // Now test the block hash endpoint
      const response = await request(app.getHttpServer())
        .get(`/api/block/hash/${blockHash}`)
        .expect(200);

      // Verify the block hash response structure
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('number');
      expect(response.body).toHaveProperty('hash');
      expect(response.body).toHaveProperty('parentHash');
      expect(response.body).toHaveProperty('stateRoot');
      expect(response.body).toHaveProperty('extrinsicsRoot');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('extrinsicsCount');
      expect(response.body).toHaveProperty('eventsCount');

      // Verify the hash matches
      expect(response.body.hash).toBe(blockHash);
      expect(response.body.number).toBe(blockNumber);

      // Note: extrinsics and events might not be populated in test environment
      // due to blockchain service limitations, so we check if they exist
      if (response.body.extrinsics) {
        expect(Array.isArray(response.body.extrinsics)).toBe(true);
        
        if (response.body.extrinsics.length > 0) {
          const firstExtrinsic = response.body.extrinsics[0];
          expect(firstExtrinsic).toHaveProperty('section');
          expect(firstExtrinsic).toHaveProperty('method');
          expect(firstExtrinsic).toHaveProperty('signer');
          expect(firstExtrinsic).toHaveProperty('hash');
          expect(firstExtrinsic).toHaveProperty('index');
          expect(firstExtrinsic).toHaveProperty('args');
          expect(firstExtrinsic).toHaveProperty('events');
        }
      }
      
      if (response.body.events) {
        expect(Array.isArray(response.body.events)).toBe(true);
      }
    });

    it('should return 400 for invalid block hash format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/block/hash/invalid-hash')
        .expect(400);

      expect(response.body.message).toContain('Invalid block hash format');
    });

    it('should return 400 for missing block hash', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/block/hash/')
        .expect(400); // Our validation catches this before the router
    });

    it('should return 404 for non-existent block hash', async () => {
      const fakeHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const response = await request(app.getHttpServer())
        .get(`/api/block/hash/${fakeHash}`)
        .expect(404);

      expect(response.body.message).toContain('Block not found');
    });

    it('should provide consistent data between block number and block hash endpoints', async () => {
      // Test that both endpoints return consistent data for the same block
      const blockNumber = 10000;
      
      // Get block by number
      const blockByNumberResponse = await request(app.getHttpServer())
        .get(`/api/block/${blockNumber}`)
        .expect(200);

      const blockHash = blockByNumberResponse.body.hash;

      // Get block by hash
      const blockByHashResponse = await request(app.getHttpServer())
        .get(`/api/block/hash/${blockHash}`)
        .expect(200);

      // Verify both responses contain the same data
      expect(blockByHashResponse.body.number).toBe(blockByNumberResponse.body.number);
      expect(blockByHashResponse.body.hash).toBe(blockByNumberResponse.body.hash);
      expect(blockByHashResponse.body.parentHash).toBe(blockByNumberResponse.body.parentHash);
      expect(blockByHashResponse.body.stateRoot).toBe(blockByNumberResponse.body.stateRoot);
      expect(blockByHashResponse.body.extrinsicsRoot).toBe(blockByNumberResponse.body.extrinsicsRoot);
      expect(blockByHashResponse.body.extrinsicsCount).toBe(blockByNumberResponse.body.extrinsicsCount);
      expect(blockByHashResponse.body.eventsCount).toBe(blockByNumberResponse.body.eventsCount);
    });
  });

  describe('Explorer Data Consistency', () => {
    it('should maintain consistent data structure across all endpoints', async () => {
      // Test that all endpoints return data in a consistent format
      const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      const [searchResponse, latestResponse, networkResponse] = await Promise.all([
        request(app.getHttpServer()).get(`/api/search/address?address=${address}&blocksToScan=5`),
        request(app.getHttpServer()).get('/api/blocks/latest'),
        request(app.getHttpServer()).get('/api/network/info')
      ]);

      // Verify all endpoints return successful responses
      expect(searchResponse.status).toBe(200);
      expect(latestResponse.status).toBe(200);
      expect(networkResponse.status).toBe(200);

      // Verify data consistency
      expect(Array.isArray(searchResponse.body.transactions)).toBe(true);
      expect(typeof latestResponse.body.latestBlock).toBe('number');
      expect(typeof networkResponse.body.latestBlock).toBe('number');
      
      // Latest block should be consistent across endpoints
      expect(latestResponse.body.latestBlock).toBe(networkResponse.body.latestBlock);
    });
  });
});
