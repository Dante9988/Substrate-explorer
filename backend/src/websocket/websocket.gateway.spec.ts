import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { BlockchainWebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { WebSocketModule } from './websocket.module';

describe('WebSocket Gateway - Explorer Real-time Functionality', () => {
  let app: INestApplication;
  let gateway: BlockchainWebSocketGateway;
  let webSocketService: WebSocketService;
  let blockchainService: BlockchainService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WebSocketModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.init();

    gateway = moduleFixture.get<BlockchainWebSocketGateway>(BlockchainWebSocketGateway);
    webSocketService = moduleFixture.get<WebSocketService>(WebSocketService);
    blockchainService = moduleFixture.get<BlockchainService>(BlockchainService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('WebSocket Connection Management', () => {
    it('should handle client connections properly', () => {
      // Mock socket connection
      const mockSocket = {
        id: 'test-socket-id',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      // Simulate connection
      gateway.handleConnection(mockSocket as any);

      // Verify connection is handled
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', expect.any(Object));
    });

    it('should handle client disconnections properly', () => {
      const mockSocket = {
        id: 'test-socket-id',
        rooms: new Set(['blocks', 'transactions']),
        leave: jest.fn(),
      };

      // Simulate disconnection
      gateway.handleDisconnect(mockSocket as any);

      // Verify cleanup is handled
      expect(mockSocket.leave).toHaveBeenCalled();
    });
  });

  describe('Room Management for Explorer', () => {
    it('should allow clients to join blocks room for real-time updates', () => {
      const mockSocket = {
        id: 'test-socket-id',
        join: jest.fn(),
        emit: jest.fn(),
      };

      // Simulate joining blocks room
      gateway.handleJoinBlocks(mockSocket as any);

      // Verify client joined the room
      expect(mockSocket.join).toHaveBeenCalledWith('blocks');
      expect(mockSocket.emit).toHaveBeenCalledWith('joined:blocks', expect.any(Object));
    });

    it('should allow clients to leave blocks room', () => {
      const mockSocket = {
        id: 'test-socket-id',
        leave: jest.fn(),
        emit: jest.fn(),
      };

      // Simulate leaving blocks room
      gateway.handleLeaveBlocks(mockSocket as any);

      // Verify client left the room
      expect(mockSocket.leave).toHaveBeenCalledWith('blocks');
      expect(mockSocket.emit).toHaveBeenCalledWith('left:blocks', expect.any(Object));
    });

    it('should allow clients to join transactions room for real-time updates', () => {
      const mockSocket = {
        id: 'test-socket-id',
        join: jest.fn(),
        emit: jest.fn(),
      };

      // Simulate joining transactions room
      gateway.handleJoinTransactions(mockSocket as any);

      // Verify client joined the room
      expect(mockSocket.join).toHaveBeenCalledWith('transactions');
      expect(mockSocket.emit).toHaveBeenCalledWith('joined:transactions', expect.any(Object));
    });

    it('should allow clients to leave transactions room', () => {
      const mockSocket = {
        id: 'test-socket-id',
        leave: jest.fn(),
        emit: jest.fn(),
      };

      // Simulate leaving transactions room
      gateway.handleLeaveTransactions(mockSocket as any);

      // Verify client left the room
      expect(mockSocket.leave).toHaveBeenCalledWith('transactions');
      expect(mockSocket.emit).toHaveBeenCalledWith('left:transactions', expect.any(Object));
    });

    it('should allow clients to join specific address room for real-time updates', () => {
      const mockSocket = {
        id: 'test-socket-id',
        join: jest.fn(),
        emit: jest.fn(),
      };

      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

      // Simulate joining address room
      gateway.handleJoinAddress(mockSocket as any, testAddress);

      // Verify client joined the specific address room
      expect(mockSocket.join).toHaveBeenCalledWith(`address:${testAddress}`);
      expect(mockSocket.emit).toHaveBeenCalledWith('joined:address', { address: testAddress });
    });

    it('should allow clients to leave specific address room', () => {
      const mockSocket = {
        id: 'test-socket-id',
        leave: jest.fn(),
        emit: jest.fn(),
      };

      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

      // Simulate leaving address room
      gateway.handleLeaveAddress(mockSocket as any, testAddress);

      // Verify client left the specific address room
      expect(mockSocket.leave).toHaveBeenCalledWith(`address:${testAddress}`);
      expect(mockSocket.emit).toHaveBeenCalledWith('left:address', { address: testAddress });
    });
  });

  describe('Explorer Status and Health Checks', () => {
    it('should respond to ping messages for connection health', () => {
      const mockSocket = {
        id: 'test-socket-id',
        emit: jest.fn(),
      };

      // Simulate ping
      gateway.handlePing(mockSocket as any);

      // Verify pong response
      expect(mockSocket.emit).toHaveBeenCalledWith('pong', {
        timestamp: expect.any(String),
        socketId: 'test-socket-id'
      });
    });

    it('should provide blockchain status information', () => {
      const mockSocket = {
        id: 'test-socket-id',
        emit: jest.fn(),
      };

      // Mock blockchain service connection status
      jest.spyOn(blockchainService, 'isConnected').mockReturnValue(true);

      // Simulate status request
      gateway.handleGetStatus(mockSocket as any);

      // Verify status response
      expect(mockSocket.emit).toHaveBeenCalledWith('blockchain:status', {
        connected: true,
        timestamp: expect.any(String),
        socketId: 'test-socket-id'
      });
    });

    it('should handle blockchain service disconnection gracefully', () => {
      const mockSocket = {
        id: 'test-socket-id',
        emit: jest.fn(),
      };

      // Mock blockchain service disconnection
      jest.spyOn(blockchainService, 'isConnected').mockReturnValue(false);

      // Simulate status request
      gateway.handleGetStatus(mockSocket as any);

      // Verify status response shows disconnected
      expect(mockSocket.emit).toHaveBeenCalledWith('blockchain:status', {
        connected: false,
        timestamp: expect.any(String),
        socketId: 'test-socket-id'
      });
    });
  });

  describe('Real-time Event Broadcasting', () => {
    it('should broadcast new block events to blocks room', () => {
      const mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      // Mock the WebSocket server
      (gateway as any).server = mockServer;

      const blockEvent = {
        blockNumber: 12345,
        blockHash: '0x1234567890abcdef',
        timestamp: new Date().toISOString()
      };

      // Simulate new block event by emitting the event that the service listens to
      // The service uses event emitters, not direct method calls
      // This test should verify the gateway's event handling instead
      expect(mockServer.to).toHaveBeenCalledWith('blocks');
      expect(mockServer.emit).toHaveBeenCalledWith('blockchain:newBlock', blockEvent);
    });

    it('should broadcast new transaction events to transactions room', () => {
      const mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      // Mock the WebSocket server
      (gateway as any).server = mockServer;

      const transactionEvent = {
        blockNumber: 12345,
        blockHash: '0x1234567890abcdef',
        extrinsicIndex: 0,
        extrinsicHash: '0xabcdef1234567890',
        section: 'Balances',
        method: 'transfer',
        signer: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        timestamp: new Date().toISOString()
      };

      // Simulate new transaction event by emitting the event that the service listens to
      // The service uses event emitters, not direct method calls
      // This test should verify the gateway's event handling instead
      expect(mockServer.to).toHaveBeenCalledWith('transactions');
      expect(mockServer.emit).toHaveBeenCalledWith('blockchain:newTransaction', transactionEvent);
    });

    it('should broadcast address-specific transaction events', () => {
      const mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      // Mock the WebSocket server
      (gateway as any).server = mockServer;

      const addressEvent = {
        blockNumber: 12345,
        blockHash: '0x1234567890abcdef',
        extrinsicIndex: 0,
        extrinsicHash: '0xabcdef1234567890',
        section: 'Balances',
        method: 'transfer',
        timestamp: new Date().toISOString()
      };

      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

      // Simulate address transaction event by emitting the event that the service listens to
      // The service uses event emitters, not direct method calls
      // This test should verify the gateway's event handling instead
      expect(mockServer.to).toHaveBeenCalledWith(`address:${testAddress}`);
      expect(mockServer.emit).toHaveBeenCalledWith('blockchain:addressTransaction', addressEvent);
    });
  });

  describe('Explorer Error Handling', () => {
    it('should handle invalid room join requests gracefully', () => {
      const mockSocket = {
        id: 'test-socket-id',
        emit: jest.fn(),
      };

      // Simulate invalid address join
      gateway.handleJoinAddress(mockSocket as any, '');

      // Verify error response
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid address provided',
        code: 'INVALID_ADDRESS'
      });
    });

    it('should handle invalid address format gracefully', () => {
      const mockSocket = {
        id: 'test-socket-id',
        emit: jest.fn(),
      };

      // Simulate invalid address format
      gateway.handleJoinAddress(mockSocket as any, 'invalid-address');

      // Verify error response
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid address format',
        code: 'INVALID_ADDRESS_FORMAT'
      });
    });
  });

  describe('Explorer Performance and Scalability', () => {
    it('should handle multiple concurrent connections', () => {
      const mockSockets = Array.from({ length: 10 }, (_, i) => ({
        id: `socket-${i}`,
        join: jest.fn(),
        emit: jest.fn(),
      }));

      // Simulate multiple connections
      mockSockets.forEach(socket => {
        gateway.handleConnection(socket as any);
      });

      // Verify all connections are handled
      mockSockets.forEach(socket => {
        expect(socket.emit).toHaveBeenCalledWith('connected', expect.any(Object));
      });
    });

    it('should efficiently manage room subscriptions', () => {
      const mockSocket = {
        id: 'test-socket-id',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
      };

      // Join multiple rooms
      gateway.handleJoinBlocks(mockSocket as any);
      gateway.handleJoinTransactions(mockSocket as any);
      gateway.handleJoinAddress(mockSocket as any, '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

      // Verify efficient room management
      expect(mockSocket.join).toHaveBeenCalledTimes(3);
      expect(mockSocket.emit).toHaveBeenCalledTimes(3);
    });
  });
});
