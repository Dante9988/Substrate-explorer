#!/usr/bin/env node

/**
 * Simple demo script to test the blockchain connection
 * Run with: node demo.js
 */

const { ApiPromise, WsProvider } = require('@polkadot/api');

async function main() {
  console.log('🔗 Testing blockchain connection...');
  
  try {
    // Connect to the blockchain
    const wsProvider = new WsProvider('wss://rpc.cc3-devnet-dryrun.creditcoin.network/ws');
    const api = await ApiPromise.create({ provider: wsProvider });
    
    console.log('✅ Connected to blockchain successfully!');
    
    // Get network information
    const [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version(),
    ]);
    
    console.log('📊 Network Information:');
    console.log(`  Chain: ${chain.toString()}`);
    console.log(`  Node: ${nodeName.toString()}`);
    console.log(`  Version: ${nodeVersion.toString()}`);
    
    // Get latest block
    const header = await api.rpc.chain.getHeader();
    console.log(`  Latest Block: #${header.number.toNumber()}`);
    
    // Disconnect
    await api.disconnect();
    console.log('🔌 Disconnected from blockchain');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
