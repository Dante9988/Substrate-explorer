const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'http://localhost:3001';

async function testAPIEndpoints() {
  console.log('🧪 Testing REST API endpoints...\n');
  
  try {
    // Test health check (if we add one) or network info
    console.log('1. Testing /api/network/info...');
    const networkInfo = await axios.get(`${BASE_URL}/api/network/info`);
    console.log('✅ Network info:', networkInfo.data);
    
    // Test latest blocks
    console.log('\n2. Testing /api/blocks/latest...');
    const latestBlocks = await axios.get(`${BASE_URL}/api/blocks/latest`);
    console.log('✅ Latest blocks:', latestBlocks.data);
    
  } catch (error) {
    console.log('❌ API test failed:', error.response?.data || error.message);
  }
}

function testWebSocketConnection() {
  console.log('\n🔌 Testing WebSocket connection...\n');
  
  const socket = io(WS_URL);
  
  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket server');
    
    // Test joining rooms
    socket.emit('join:blocks');
    socket.emit('join:transactions');
    socket.emit('join:address', '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
    
    // Test ping
    socket.emit('ping');
    
    // Test status
    socket.emit('get:status');
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Disconnected from WebSocket server');
  });
  
  socket.on('error', (error) => {
    console.log('❌ WebSocket error:', error);
  });
  
  // Listen for responses
  socket.on('pong', (data) => {
    console.log('✅ Received pong:', data);
  });
  
  socket.on('blockchain:status', (data) => {
    console.log('✅ Received blockchain status:', data);
  });
  
  // Listen for blockchain events
  socket.on('blockchain:newBlock', (data) => {
    console.log('🆕 New block event:', data);
  });
  
  socket.on('blockchain:newTransaction', (data) => {
    console.log('💸 New transaction event:', data);
  });
  
  // Disconnect after 10 seconds
  setTimeout(() => {
    console.log('\n🔄 Disconnecting after test...');
    socket.disconnect();
    process.exit(0);
  }, 10000);
}

async function runTests() {
  console.log('🚀 Starting API and WebSocket tests...\n');
  
  // Test API endpoints
  await testAPIEndpoints();
  
  // Test WebSocket connection
  testWebSocketConnection();
}

// Run tests
runTests().catch(console.error);
