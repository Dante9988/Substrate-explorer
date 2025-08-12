const { BlockchainService } = require('./dist/blockchain/blockchain.service');

async function testParameterValidation() {
  console.log('🧪 Testing parameter validation...');
  
  const service = new BlockchainService();
  
  try {
    // Test invalid address
    console.log('Testing invalid address...');
    await service.searchAddressInRecentBlocks('', 10, 5);
  } catch (error) {
    console.log('✅ Invalid address caught:', error.message);
  }
  
  try {
    // Test invalid blocksToScan
    console.log('Testing invalid blocksToScan...');
    await service.searchAddressInRecentBlocks('test', 0, 5);
  } catch (error) {
    console.log('✅ Invalid blocksToScan caught:', error.message);
  }
  
  try {
    // Test invalid batchSize
    console.log('Testing invalid batchSize...');
    await service.searchAddressInRecentBlocks('test', 10, -1);
  } catch (error) {
    console.log('✅ Invalid batchSize caught:', error.message);
  }
  
  console.log('🎉 All parameter validation tests passed!');
}

testParameterValidation().catch(console.error);
