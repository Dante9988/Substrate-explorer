# 🚀 Blockchain Explorer WebSocket Server

This document explains how to use the real-time WebSocket functionality for blockchain updates.

## 🌟 Features

- **Real-time block monitoring** - Get notified when new blocks are mined
- **Transaction tracking** - Monitor all transactions in real-time
- **Address-specific updates** - Get updates for specific addresses
- **Room-based subscriptions** - Join different rooms for different types of updates
- **Automatic reconnection** - Handles network disconnections gracefully

## 🚀 Quick Start

### 1. Install Dependencies

```bash
yarn add socket.io @nestjs/websockets @nestjs/event-emitter
yarn add -D ts-node ts-node-dev
```

### 2. Start the WebSocket Server

```bash
# Development mode with auto-reload
yarn start:websocket:dev

# Production mode
yarn start:websocket
```

The server will start on port 3001 by default.

### 3. Connect from Frontend

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/blockchain');

// Listen for new blocks
socket.on('blockchain:newBlock', (block) => {
  console.log('New block:', block);
});

// Listen for new transactions
socket.on('blockchain:newTransaction', (tx) => {
  console.log('New transaction:', tx);
});
```

## 📡 WebSocket Events

### Server → Client Events

#### `blockchain:status`
Blockchain connection and monitoring status.

```json
{
  "connected": true,
  "monitoring": true,
  "timestamp": "2025-08-12T00:00:00.000Z"
}
```

#### `blockchain:newBlock`
New block detected.

```json
{
  "blockNumber": 12345,
  "blockHash": "0x...",
  "timestamp": "2025-08-12T00:00:00.000Z"
}
```

#### `blockchain:blockFinalized`
Block finalized.

```json
{
  "blockNumber": 12345,
  "blockHash": "0x...",
  "timestamp": "2025-08-12T00:00:00.000Z"
}
```

#### `blockchain:blockDetails`
Detailed block information.

```json
{
  "blockNumber": 12345,
  "blockHash": "0x...",
  "extrinsicsCount": 5,
  "timestamp": "2025-08-12T00:00:00.000Z"
}
```

#### `blockchain:newTransaction`
New transaction in a block.

```json
{
  "blockNumber": 12345,
  "blockHash": "0x...",
  "extrinsicIndex": 0,
  "extrinsicHash": "0x...",
  "section": "balances",
  "method": "transfer",
  "signer": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "timestamp": "2025-08-12T00:00:00.000Z"
}
```

#### `blockchain:addressTransaction`
Transaction involving a specific address.

```json
{
  "blockNumber": 12345,
  "blockHash": "0x...",
  "extrinsicIndex": 0,
  "extrinsicHash": "0x...",
  "section": "balances",
  "method": "transfer",
  "timestamp": "2025-08-12T00:00:00.000Z"
}
```

### Client → Server Events

#### `join:blocks`
Join the blocks room to receive block updates.

#### `leave:blocks`
Leave the blocks room.

#### `join:transactions`
Join the transactions room to receive transaction updates.

#### `leave:transactions`
Leave the transactions room.

#### `join:address`
Join a specific address room.

```javascript
socket.emit('join:address', '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
```

#### `leave:address`
Leave a specific address room.

```javascript
socket.emit('leave:address', '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
```

#### `get:status`
Get current blockchain status.

#### `ping`
Ping the server (responds with `pong`).

## 🏠 Rooms

### Available Rooms

- **`blocks`** - Receive all block updates
- **`transactions`** - Receive all transaction updates
- **`address:{address}`** - Receive updates for a specific address

### Room Management

```javascript
// Join multiple rooms
socket.emit('join:blocks');
socket.emit('join:transactions');
socket.emit('join:address', '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

// Leave rooms when no longer needed
socket.emit('leave:blocks');
socket.emit('leave:transactions');
socket.emit('leave:address', '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
```

## 🔧 Configuration

### Environment Variables

- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

### Example .env

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## 📱 Frontend Integration Example

### React Hook

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseBlockchainWebSocket {
  isConnected: boolean;
  latestBlock: number | null;
  latestTransaction: any | null;
}

export function useBlockchainWebSocket(): UseBlockchainWebSocket {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestBlock, setLatestBlock] = useState<number | null>(null);
  const [latestTransaction, setLatestTransaction] = useState<any | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001/blockchain');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join:blocks');
      newSocket.emit('join:transactions');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('blockchain:newBlock', (block) => {
      setLatestBlock(block.blockNumber);
    });

    newSocket.on('blockchain:newTransaction', (tx) => {
      setLatestTransaction(tx);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return { isConnected, latestBlock, latestTransaction };
}
```

### Usage in Component

```typescript
function BlockchainExplorer() {
  const { isConnected, latestBlock, latestTransaction } = useBlockchainWebSocket();

  return (
    <div>
      <div>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      {latestBlock && <div>Latest Block: #{latestBlock}</div>}
      {latestTransaction && (
        <div>
          Latest Transaction: {latestTransaction.method} in block #{latestTransaction.blockNumber}
        </div>
      )}
    </div>
  );
}
```

## 🧪 Testing

### Test WebSocket Client

```bash
# Install socket.io-client
yarn add socket.io-client

# Run the test client
node examples/websocket-client.js
```

### Manual Testing

1. Start the WebSocket server
2. Open the test client
3. Watch for real-time updates in the console
4. Monitor the server logs for connection events

## 🚨 Troubleshooting

### Common Issues

1. **Connection refused** - Make sure the server is running on the correct port
2. **CORS errors** - Check the `FRONTEND_URL` environment variable
3. **No updates** - Ensure the blockchain service is connected
4. **Memory leaks** - Always leave rooms and disconnect when done

### Debug Mode

Enable debug logging by setting the log level:

```typescript
// In the WebSocket service
this.logger.setLogLevel('debug');
```

## 🔮 Future Enhancements

- [ ] WebSocket authentication
- [ ] Rate limiting
- [ ] Message queuing for offline clients
- [ ] Historical data streaming
- [ ] Custom event subscriptions
- [ ] WebSocket clustering for high availability

## 📚 API Reference

For the complete API reference, see the generated Swagger documentation at:
`http://localhost:3001/api/docs`
