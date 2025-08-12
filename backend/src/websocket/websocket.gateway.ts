import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { OnEvent } from '@nestjs/event-emitter';

@NestWebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  namespace: '/blockchain'
})
export class BlockchainWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BlockchainWebSocketGateway.name);

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly blockchainService: BlockchainService
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    
    // Start blockchain monitoring when gateway is ready
    this.webSocketService.startMonitoring().catch(error => {
      this.logger.error('Failed to start blockchain monitoring:', error);
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Send current blockchain status
    client.emit('blockchain:status', {
      connected: this.blockchainService.isConnected(),
      monitoring: this.webSocketService.isMonitoringActive(),
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Listen to blockchain events and broadcast to connected clients
  @OnEvent('blockchain.newBlock')
  handleNewBlock(blockData: any) {
    this.logger.log(`Broadcasting new block: #${blockData.blockNumber}`);
    this.server.emit('blockchain:newBlock', blockData);
  }

  @OnEvent('blockchain.blockFinalized')
  handleBlockFinalized(blockData: any) {
    this.logger.log(`Broadcasting finalized block: #${blockData.blockNumber}`);
    this.server.emit('blockchain:blockFinalized', blockData);
  }

  @OnEvent('blockchain.blockDetails')
  handleBlockDetails(blockData: any) {
    this.logger.log(`Broadcasting block details: #${blockData.blockNumber}`);
    this.server.emit('blockchain:blockDetails', blockData);
  }

  @OnEvent('blockchain.newTransaction')
  handleNewTransaction(transactionData: any) {
    this.logger.log(`Broadcasting new transaction: ${transactionData.extrinsicHash}`);
    this.server.emit('blockchain:newTransaction', transactionData);
    
    // Also emit to address-specific rooms if signer is known
    if (transactionData.signer && transactionData.signer !== 'N/A') {
      this.server.to(`address:${transactionData.signer}`).emit('blockchain:addressTransaction', transactionData);
    }
  }

  @OnEvent('blockchain.addressTransaction')
  handleAddressTransaction(transactionData: any) {
    // This is handled in the newTransaction handler above
    // Keeping for consistency
  }

  @SubscribeMessage('join:blocks')
  handleJoinBlocks(client: Socket) {
    client.join('blocks');
    this.logger.log(`Client ${client.id} joined blocks room`);
    
    client.emit('room:joined', { room: 'blocks' });
  }

  @SubscribeMessage('leave:blocks')
  handleLeaveBlocks(client: Socket) {
    client.leave('blocks');
    this.logger.log(`Client ${client.id} left blocks room`);
    
    client.emit('room:left', { room: 'blocks' });
  }

  @SubscribeMessage('join:transactions')
  handleJoinTransactions(client: Socket) {
    client.join('transactions');
    this.logger.log(`Client ${client.id} joined transactions room`);
    
    client.emit('room:joined', { room: 'transactions' });
  }

  @SubscribeMessage('leave:transactions')
  handleLeaveTransactions(client: Socket) {
    client.leave('transactions');
    this.logger.log(`Client ${client.id} left transactions room`);
    
    client.emit('room:left', { room: 'transactions' });
  }

  @SubscribeMessage('join:address')
  handleJoinAddress(client: Socket, address: string) {
    if (!address || typeof address !== 'string') {
      client.emit('error', { message: 'Invalid address provided' });
      return;
    }
    
    client.join(`address:${address}`);
    this.logger.log(`Client ${client.id} joined address room: ${address}`);
    
    client.emit('room:joined', { room: `address:${address}` });
  }

  @SubscribeMessage('leave:address')
  handleLeaveAddress(client: Socket, address: string) {
    if (!address || typeof address !== 'string') {
      client.emit('error', { message: 'Invalid address provided' });
      return;
    }
    
    client.leave(`address:${address}`);
    this.logger.log(`Client ${client.id} left address room: ${address}`);
    
    client.emit('room:left', { room: `address:${address}` });
  }

  @SubscribeMessage('get:status')
  handleGetStatus(client: Socket) {
    client.emit('blockchain:status', {
      connected: this.blockchainService.isConnected(),
      monitoring: this.webSocketService.isMonitoringActive(),
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }
}
