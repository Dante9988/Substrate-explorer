const { io } = require('socket.io-client');

// Connect to the WebSocket server
const socket = io('http://localhost:3001/blockchain', {
  transports: ['websocket']
});

// Connection events
socket.on('connect', () => {
  console.log('🔌 Connected to blockchain WebSocket server');
  
  // Join rooms to receive updates
  socket.emit('join:blocks');
  socket.emit('join:transactions');
  
  // Join specific address room (replace with actual address)
  socket.emit('join:address', '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket server');
});

// Blockchain status updates
socket.on('blockchain:status', (status) => {
  console.log('📊 Blockchain Status:', status);
});

// New block events
socket.on('blockchain:newBlock', (block) => {
  console.log('🆕 New Block:', block);
});

socket.on('blockchain:blockFinalized', (block) => {
  console.log('✅ Block Finalized:', block);
});

socket.on('blockchain:blockDetails', (details) => {
  console.log('📦 Block Details:', details);
});

// New transaction events
socket.on('blockchain:newTransaction', (tx) => {
  console.log('💸 New Transaction:', tx);
});

// Address-specific transaction events
socket.on('blockchain:addressTransaction', (tx) => {
  console.log('👤 Address Transaction:', tx);
});

// Room events
socket.on('room:joined', (data) => {
  console.log('🚪 Joined room:', data.room);
});

socket.on('room:left', (data) => {
  console.log('🚪 Left room:', data.room);
});

// Error handling
socket.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

// Ping/pong for connection health
setInterval(() => {
  socket.emit('ping');
}, 30000);

socket.on('pong', (data) => {
  console.log('🏓 Pong received:', data.timestamp);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Disconnecting...');
  socket.disconnect();
  process.exit(0);
});

console.log('🚀 WebSocket client started. Press Ctrl+C to exit.');
