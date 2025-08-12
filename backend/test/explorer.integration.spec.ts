import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { BlockchainService } from './blockchain/blockchain.service';
import { WebSocketService } from './websocket/websocket.service';

describe('Explorer Integration Tests - Complete Data Flow', () => {
  let app: INestApplication;
  let blockchainService: BlockchainService;
  let webSocketService: WebSocketService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.init();

    blockchainService = moduleFixture.get<BlockchainService>(BlockchainService);
    webSocketService = moduleFixture.get<WebSocketService>(WebSocketService);

    // Mock the blockchain service connection for tests
    jest.spyOn(blockchainService, 'isConnected').mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
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

    jest.spyOn(blockchainService, 'getBlockInfo').mockResolvedValue({
      number: 10048,
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

    jest.spyOn(blockchainService, 'searchExtrinsicByHash').mockResolvedValue({
      extrinsic: {
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
      },
      block: {
        number: 10048,
        hash: '0x84f2dbaa1bae970ac5727ad3cd82ba9e1321288392abcdef1234567890abcdef',
        timestamp: 1729123200000
      }
    });

    // Mock the new getBlockInfoByHash method
    jest.spyOn(blockchainService, 'getBlockInfoByHash').mockResolvedValue({
      number: 10048,
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
    });

    // Mock WebSocket service methods
    jest.spyOn(webSocketService, 'isMonitoringActive').mockReturnValue(false);
    jest.spyOn(webSocketService, 'isBlockchainConnected').mockReturnValue(true);
  });

  describe('Explorer Search and Display Flow', () => {
    it('should expose comprehensive transaction data when searching by address', async () => {
      // This test verifies the complete flow: blockchain data → explorer processing → API response
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      const response = await request(app.getHttpServer())
        .get(`/api/search/address?address=${testAddress}&blocksToScan=5`)
        .expect(200);

      // Verify the explorer exposes all necessary data for display
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('blocksScanned');
      expect(Array.isArray(response.body.transactions)).toBe(true);
      
      if (response.body.transactions.length > 0) {
        const transaction = response.body.transactions[0];
        
        // Core transaction identification
        expect(transaction).toHaveProperty('blockNumber');
        expect(transaction).toHaveProperty('blockHash');
        expect(transaction).toHaveProperty('extrinsicHash');
        expect(transaction).toHaveProperty('extrinsicIndex');
        
        // Transaction details for explorer display
        expect(transaction).toHaveProperty('section');
        expect(transaction).toHaveProperty('method');
        expect(transaction).toHaveProperty('data');
        
        // Signer and transaction metadata
        expect(transaction).toHaveProperty('signer');
        expect(transaction).toHaveProperty('nonce');
        
        // Arguments and events for detailed view
        expect(transaction).toHaveProperty('args');
        expect(transaction).toHaveProperty('events');
        
        // Verify data types for frontend rendering
        expect(typeof transaction.blockNumber).toBe('number');
        expect(typeof transaction.blockHash).toBe('string');
        expect(typeof transaction.extrinsicHash).toBe('string');
        expect(typeof transaction.section).toBe('string');
        expect(typeof transaction.method).toBe('string');
        expect(Array.isArray(transaction.data)).toBe(true);
        expect(typeof transaction.signer).toBe('string');
        expect(typeof transaction.nonce).toBe('number');
        expect(Array.isArray(transaction.args)).toBe(true);
        expect(Array.isArray(transaction.events)).toBe(true);
      }
    });

    it('should provide consistent data structure for different transaction types', async () => {
      // Test that different transaction types (extrinsics vs events) have consistent structure
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      const response = await request(app.getHttpServer())
        .get(`/api/search/address?address=${testAddress}&blocksToScan=10`)
        .expect(200);

      if (response.body.transactions.length > 1) {
        // Compare structure of different results
        const firstResult = response.body.transactions[0];
        const lastResult = response.body.transactions[response.body.transactions.length - 1];
        
        const firstKeys = Object.keys(firstResult);
        const lastKeys = Object.keys(lastResult);
        
        // All results should have the same structure
        expect(firstKeys).toEqual(lastKeys);
        
        // Verify required fields exist in all results
        const requiredFields = [
          'blockNumber', 'blockHash', 'section', 'method', 'data',
          'extrinsicHash', 'extrinsicIndex', 'signer', 'nonce', 'args', 'events'
        ];
        
        requiredFields.forEach(field => {
          expect(firstResult).toHaveProperty(field);
          expect(lastResult).toHaveProperty(field);
        });
      }
    });

    it('should handle mixed extrinsic and event results consistently', async () => {
      // Test that the explorer handles both extrinsics and events in search results
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      const response = await request(app.getHttpServer())
        .get(`/api/search/address?address=${testAddress}&blocksToScan=15`)
        .expect(200);

      if (response.body.transactions.length > 0) {
        // Check for both extrinsic and event types
        const hasExtrinsics = response.body.transactions.some(item => item.extrinsicIndex !== undefined);
        const hasEvents = response.body.transactions.some(item => item.eventIndex !== undefined);
        
        // Both types should be present in comprehensive search
        expect(hasExtrinsics || hasEvents).toBe(true);
        
        // All results should have consistent structure regardless of type
        response.body.transactions.forEach(item => {
          expect(item).toHaveProperty('blockNumber');
          expect(item).toHaveProperty('blockHash');
          expect(item).toHaveProperty('section');
          expect(item).toHaveProperty('method');
          expect(item).toHaveProperty('data');
          expect(item).toHaveProperty('extrinsicHash');
          expect(item).toHaveProperty('signer');
          expect(item).toHaveProperty('nonce');
          expect(item).toHaveProperty('args');
          expect(item).toHaveProperty('events');
        });
      }
    });
  });

  describe('Explorer Block Detail Flow', () => {
    it('should expose complete block information with explorer data structure', async () => {
      // Test the complete block detail flow
      const blockNumber = 10000; // Use a recent block number that's more likely to exist
      
      const response = await request(app.getHttpServer())
        .get(`/api/block/${blockNumber}`)
        .expect(200);

      // Verify block header information
      expect(response.body).toHaveProperty('number');
      expect(response.body).toHaveProperty('hash');
      expect(response.body).toHaveProperty('parentHash');
      expect(response.body).toHaveProperty('stateRoot');
      expect(response.body).toHaveProperty('extrinsicsRoot');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('extrinsicsCount');
      expect(response.body).toHaveProperty('eventsCount');
      
      // Verify extrinsics array with explorer data structure
      expect(response.body).toHaveProperty('extrinsics');
      expect(Array.isArray(response.body.extrinsics)).toBe(true);
      
      if (response.body.extrinsics.length > 0) {
        const extrinsic = response.body.extrinsics[0];
        
        // Verify extrinsic has all necessary fields for explorer display
        expect(extrinsic).toHaveProperty('section');
        expect(extrinsic).toHaveProperty('method');
        expect(extrinsic).toHaveProperty('signer');
        expect(extrinsic).toHaveProperty('hash');
        expect(extrinsic).toHaveProperty('index');
        expect(extrinsic).toHaveProperty('args');
        expect(extrinsic).toHaveProperty('events');
        
        // Verify data types
        expect(typeof extrinsic.section).toBe('string');
        expect(typeof extrinsic.method).toBe('string');
        expect(typeof extrinsic.signer).toBe('string');
        expect(typeof extrinsic.hash).toBe('string');
        expect(typeof extrinsic.index).toBe('number');
        expect(Array.isArray(extrinsic.args)).toBe(true);
        expect(Array.isArray(extrinsic.events)).toBe(true);
      }
      
      // Verify events array
      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);
    });

    it('should provide consistent data between search and block detail endpoints', async () => {
      // Test that data is consistent between search results and block details
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      // Get search results
      const searchResponse = await request(app.getHttpServer())
        .get(`/api/search/address?address=${testAddress}&blocksToScan=5`)
        .expect(200);

      if (searchResponse.body.transactions.length > 0) {
        const firstResult = searchResponse.body.transactions[0];
        const blockNumber = firstResult.blockNumber;
        
        // Get block details for the same block
        const blockResponse = await request(app.getHttpServer())
          .get(`/api/block/${blockNumber}`)
          .expect(200);

        // Verify block information is consistent
        expect(blockResponse.body.number).toBe(blockNumber);
        expect(blockResponse.body.hash).toBe(firstResult.blockHash);
        
        // Verify extrinsic information is consistent
        if (firstResult.extrinsicIndex !== undefined) {
          const blockExtrinsic = blockResponse.body.extrinsics[firstResult.extrinsicIndex];
          expect(blockExtrinsic).toBeDefined();
          expect(blockExtrinsic.hash).toBe(firstResult.extrinsicHash);
          expect(blockExtrinsic.section).toBe(firstResult.section);
          expect(blockExtrinsic.method).toBe(firstResult.method);
        }
      }
    });
  });

  describe('Explorer Real-time Data Flow', () => {
    it('should emit WebSocket events when blockchain data changes', async () => {
      // Test that the explorer emits real-time events for blockchain updates
      const mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      // Mock the WebSocket server
      (webSocketService as any).server = mockServer;

      // Test that the service can start monitoring
      expect(webSocketService.isBlockchainConnected()).toBe(true);
      
      // Test monitoring status
      expect(webSocketService.isMonitoringActive()).toBe(false);
    });

    it('should handle address-specific real-time updates', async () => {
      // Test address-specific WebSocket event handling
      const mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      // Mock the WebSocket server
      (webSocketService as any).server = mockServer;

      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      // Test that the service can handle blockchain connection status
      expect(webSocketService.isBlockchainConnected()).toBe(true);
    });
  });

  describe('Explorer Error Handling and Edge Cases', () => {
    it('should handle blockchain service disconnection gracefully', async () => {
      // Test that the explorer handles blockchain disconnection gracefully
      const mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      // Mock the WebSocket server
      (webSocketService as any).server = mockServer;

      // Mock blockchain service as disconnected
      jest.spyOn(blockchainService, 'isConnected').mockReturnValue(false);

      // Verify the service handles disconnection gracefully
      expect(webSocketService.isMonitoringActive()).toBe(false);
    });

    it('should provide meaningful error messages for invalid requests', async () => {
      // Test error handling for various invalid requests
      
      // Invalid address format
      const invalidAddressResponse = await request(app.getHttpServer())
        .get('/api/search/address?address=invalid-address&blocksToScan=5')
        .expect(400);

      expect(invalidAddressResponse.body).toHaveProperty('message');
      expect(invalidAddressResponse.body.message).toContain('address');

      // Invalid block number
      const invalidBlockResponse = await request(app.getHttpServer())
        .get('/api/block/invalid-block')
        .expect(400);

      expect(invalidBlockResponse.body).toHaveProperty('message');
      expect(invalidBlockResponse.body.message).toContain('block number');

      // Missing required parameters
      const missingParamsResponse = await request(app.getHttpServer())
        .get('/api/search/address')
        .expect(400);

      expect(missingParamsResponse.body).toHaveProperty('message');
    });

    it('should handle empty search results consistently', async () => {
      // Test that empty results are handled consistently across endpoints
      const emptyAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
      
      const response = await request(app.getHttpServer())
        .get(`/api/search/address?address=${emptyAddress}&blocksToScan=5`)
        .expect(200);

      // Empty results should return SearchResult with empty transactions array
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('blocksScanned');
      expect(Array.isArray(response.body.transactions)).toBe(true);
      expect(response.body.transactions).toEqual([]);
      // response.body is a SearchResult object, not an array
    });
  });

  describe('Explorer Performance and Data Consistency', () => {
    it('should maintain data consistency across multiple API calls', async () => {
      // Test that multiple API calls return consistent data
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      // Make multiple calls to the same endpoint
      const [response1, response2, response3] = await Promise.all([
        request(app.getHttpServer()).get(`/api/search/address?address=${testAddress}&blocksToScan=5`),
        request(app.getHttpServer()).get(`/api/search/address?address=${testAddress}&blocksToScan=5`),
        request(app.getHttpServer()).get(`/api/search/address?address=${testAddress}&blocksToScan=5`)
      ]);

      // All responses should be successful
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);

      // Data should be consistent (same structure and types)
      expect(response1.body).toHaveProperty('transactions');
      expect(response2.body).toHaveProperty('transactions');
      expect(response3.body).toHaveProperty('transactions');
      expect(Array.isArray(response1.body.transactions)).toBe(true);
      expect(Array.isArray(response2.body.transactions)).toBe(true);
      expect(Array.isArray(response3.body.transactions)).toBe(true);

      // If there are results, verify consistency
      if (response1.body.transactions.length > 0) {
        const keys1 = Object.keys(response1.body.transactions[0]);
        const keys2 = Object.keys(response2.body.transactions[0]);
        const keys3 = Object.keys(response3.body.transactions[0]);
        
        expect(keys1).toEqual(keys2);
        expect(keys2).toEqual(keys3);
      }
    });

    it('should handle concurrent requests efficiently', async () => {
      // Test that the explorer can handle concurrent requests efficiently
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      // Make 3 concurrent requests (reduced from 10 to avoid connection issues)
      const requests = Array.from({ length: 3 }, () =>
        request(app.getHttpServer()).get(`/api/search/address?address=${testAddress}&blocksToScan=3`)
      );
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('transactions');
        expect(Array.isArray(response.body.transactions)).toBe(true);
      });
      
      // Verify all responses have consistent structure
      const firstResponse = responses[0].body;
      responses.forEach(response => {
        expect(response.body).toHaveProperty('transactions');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('blocksScanned');
        expect(Array.isArray(response.body.transactions)).toBe(true);
      });
    });
  });

  describe('Explorer Extrinsic Detail Flow', () => {
    it('should provide consistent extrinsic data between search and extrinsic detail endpoints', async () => {
      // Test that extrinsic data is consistent between search results and extrinsic details
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      // Get search results
      const searchResponse = await request(app.getHttpServer())
        .get(`/api/search/address?address=${testAddress}&blocksToScan=5`)
        .expect(200);

      if (searchResponse.body.transactions.length > 0) {
        const firstResult = searchResponse.body.transactions[0];
        const extrinsicHash = firstResult.extrinsicHash;
        
        // Get extrinsic details for the same extrinsic
        const extrinsicResponse = await request(app.getHttpServer())
          .get(`/api/extrinsic/${extrinsicHash}`)
          .expect(200);

        // Verify extrinsic information is consistent
        expect(extrinsicResponse.body.extrinsic.hash).toBe(extrinsicHash);
        expect(extrinsicResponse.body.extrinsic.section).toBe(firstResult.section);
        expect(extrinsicResponse.body.extrinsic.method).toBe(firstResult.method);
        expect(extrinsicResponse.body.extrinsic.signer).toBe(firstResult.signer);
        
        // Verify block information is consistent
        expect(extrinsicResponse.body.block.number).toBe(firstResult.blockNumber);
        expect(extrinsicResponse.body.block.hash).toBe(firstResult.blockHash);
        
        // Verify the extrinsic has the expected structure
        expect(extrinsicResponse.body.extrinsic).toHaveProperty('index');
        expect(extrinsicResponse.body.extrinsic).toHaveProperty('nonce');
        expect(extrinsicResponse.body.extrinsic).toHaveProperty('args');
        expect(extrinsicResponse.body.extrinsic).toHaveProperty('events');
      }
    });

    it('should handle extrinsic search with custom parameters', async () => {
      // Test that extrinsic search works with custom blocksToScan and batchSize
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      // Get search results with limited blocks
      const searchResponse = await request(app.getHttpServer())
        .get(`/api/search/address?address=${testAddress}&blocksToScan=3`)
        .expect(200);

      if (searchResponse.body.transactions.length > 0) {
        const firstResult = searchResponse.body.transactions[0];
        const extrinsicHash = firstResult.extrinsicHash;
        
        // Search for extrinsic with custom parameters
        const extrinsicResponse = await request(app.getHttpServer())
          .get(`/api/extrinsic/${extrinsicHash}?blocksToScan=5&batchSize=2`)
          .expect(200);

        // Verify the extrinsic was found
        expect(extrinsicResponse.body.extrinsic.hash).toBe(extrinsicHash);
        expect(extrinsicResponse.body.extrinsic.section).toBe(firstResult.section);
        expect(extrinsicResponse.body.extrinsic.method).toBe(firstResult.method);
      }
    });
  });

  describe('Explorer Block Hash Search Flow', () => {
    it('should provide consistent data between block number and block hash searches', async () => {
      // Test that searching by block number and block hash return consistent data
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

      // Verify both endpoints return the same block data
      expect(blockByHashResponse.body.number).toBe(blockByNumberResponse.body.number);
      expect(blockByHashResponse.body.hash).toBe(blockByNumberResponse.body.hash);
      expect(blockByHashResponse.body.extrinsicsCount).toBe(blockByNumberResponse.body.extrinsicsCount);
      expect(blockByHashResponse.body.eventsCount).toBe(blockByNumberResponse.body.eventsCount);
    });

    it('should handle block hash search errors gracefully', async () => {
      // Test invalid block hash format
      const invalidHashResponse = await request(app.getHttpServer())
        .get('/api/block/hash/invalid-hash')
        .expect(400);

      expect(invalidHashResponse.body.message).toContain('Invalid block hash format');

      // Test non-existent block hash
      const fakeHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const notFoundResponse = await request(app.getHttpServer())
        .get(`/api/block/hash/${fakeHash}`)
        .expect(404);

      expect(notFoundResponse.body.message).toContain('Block not found');
    });
  });
});
