# BlockchainService Test Coverage

## 🧪 Test Overview

I've created comprehensive unit tests for the `BlockchainService` - the core service that handles all blockchain interactions. This is the first service we're testing as requested.

## 📁 Test Files Created

1. **`blockchain.service.spec.ts`** - Main test file for BlockchainService
2. **`jest.config.js`** - Jest configuration with proper module resolution
3. **`src/test/setup.ts`** - Test setup and global utilities
4. **`run-tests.sh`** - Test runner script

## 🎯 Test Coverage Areas

### 🧪 **Unit Tests (Mocked)**
- **Connection Management**
  - `connect()` - Successful connection to blockchain
  - `connect()` - Error handling for connection failures
  - `disconnect()` - Proper cleanup when disconnecting
  - `disconnect()` - Handling disconnect when not connected
  - `isConnected()` - Connection status checks

- **Address Search (Core Functionality)**
  - `searchAddressInRecentBlocks()` - Successful address search
  - `searchAddressInRecentBlocks()` - Empty results handling
  - `searchAddressInRecentBlocks()` - API initialization checks
  - `searchAddressInRecentBlocks()` - Batch processing verification
  - `processBlock()` - Extrinsic and event processing
  - `processBlock()` - Error handling during block processing

- **Block Information**
  - `getBlockInfo()` - Successful block info retrieval
  - `getBlockInfo()` - API initialization checks
  - `getLatestBlockNumber()` - Latest block number retrieval
  - `getLatestBlockNumber()` - API initialization checks

- **Network Information**
  - `getNetworkInfo()` - Network details retrieval
  - `getNetworkInfo()` - API initialization checks

### 🌐 **Integration Tests (Live Blockchain)**
- **Real Blockchain Connection**
  - Live connection to `wss://rpc.cc3-devnet-dryrun.creditcoin.network/ws`
  - Real network information and block data
  - Live transaction monitoring

- **Address Search on Live Network**
  - Search for transactions using your seed phrase address
  - Real block hash and extrinsic hash lookups
  - Live transaction data analysis

- **Transaction Monitoring**
  - Detect new blocks as they're mined
  - Real-time transaction search
  - Performance testing with live data

- **Block Data Analysis**
  - Real block structure analysis
  - Live extrinsic and event data
  - Network performance metrics

### 🎮 **Controller Tests (API Layer)**
- **SearchController Unit Tests**
  - All API endpoint functionality
  - Parameter validation and error handling
  - Service integration verification
  - Edge case handling

- **SearchController Integration Tests**
  - Real API endpoint testing
  - Live blockchain integration
  - Performance and scalability testing
  - Real transaction data validation

### 💸 **Transaction Tests (Live Blockchain Operations)**
- **Account Management**
  - Create new accounts from seed phrases
  - Address validation and format checking
  - Error handling for invalid inputs

- **Single Transfer Operations**
  - Real token transfers between addresses
  - Transaction confirmation and block inclusion
  - Error handling for insufficient balance
  - Parameter validation

- **Batch Transfer Operations**
  - Multiple transfers in single transaction
  - Utility.batchAll extrinsic testing
  - Batch size validation (1-100 transfers)
  - Performance testing for large batches

- **Staking Operations**
  - Token bonding and staking
  - Optional validator nomination
  - Handling existing bonded balances
  - Staking ledger management

- **Block Extrinsic Analysis**
  - Detailed block information extraction
  - Extrinsic-by-extrinsic breakdown
  - Event correlation and analysis
  - Batch transaction analysis

- **Transaction Monitoring and Search**
  - Real-time transaction tracking
  - Address-based transaction search
  - Block hash and extrinsic hash lookups
  - Performance metrics and scalability testing

## 🔧 Test Setup Features

### **Mocking Strategy**
- **Polkadot API Mocking**: Complete mock of `@polkadot/api` and `@polkadot/types`
- **WebSocket Provider Mocking**: Mock WebSocket connections
- **Event System Mocking**: Mock blockchain events and extrinsics

### **Test Utilities**
- **Global Test Utils**: Reusable mock creation functions
- **Type Safety**: Proper TypeScript types for all mocks
- **Error Scenarios**: Comprehensive error handling tests

### **Jest Configuration**
- **Module Resolution**: Proper handling of shared package imports
- **Coverage Reporting**: HTML, LCOV, and text coverage reports
- **Test Timeouts**: Appropriate timeouts for async operations

## 🚀 Running the Tests

### **Option 1: Interactive Test Runner (Recommended)**
```bash
cd backend
./run-all-tests.sh   # Interactive menu for all test types
```

### **Option 2: Unit Tests Only (Fast, Mocked)**
```bash
cd backend
yarn test             # Run unit tests once
yarn test:watch       # Run unit tests in watch mode
yarn test:cov         # Run unit tests with coverage
```

### **Option 3: Integration Tests Only (Live Blockchain)**
```bash
cd backend
./run-integration-tests.sh  # Run tests against live network
# OR
yarn test --testPathPattern=integration --verbose
```

### **Option 4: From Root Directory**
```bash
yarn test                    # Run backend unit tests
yarn test:cov               # Run backend unit tests with coverage
yarn test:integration       # Run backend integration tests
yarn test:controllers       # Run backend controller tests
yarn test:transactions      # Run backend transaction tests
```

### **Option 5: Direct Jest Commands**
```bash
cd backend
npx jest --testPathPattern="^(?!.*integration)"  # Unit tests only
npx jest --testPathPattern="integration"         # Integration tests only
npx jest --coverage                              # All tests with coverage
```

## 📊 Expected Test Results

When you run the tests, you should see:

1. **Test Execution**: All 20+ test cases passing
2. **Coverage Report**: High coverage percentage for BlockchainService
3. **Mock Verification**: Proper mocking of Polkadot API calls
4. **Error Handling**: All error scenarios properly tested

## 🔍 What's Being Tested

### **Polkadot API Integration**
- WebSocket connection establishment
- RPC method calls (`chain.getHeader`, `chain.getBlock`, etc.)
- Query method calls (`system.events.at`)
- Event handling and processing

### **Business Logic**
- Address search across multiple blocks
- Batch processing of blocks
- Extrinsic and event filtering
- Data transformation and formatting

### **Error Scenarios**
- Network connection failures
- Invalid block numbers
- API initialization errors
- Graceful error handling

## 🎯 Next Steps

This is the first service test as requested. Once you review this, we can:

1. **Add more test scenarios** for edge cases
2. **Test the SearchController** next
3. **Add integration tests** for the full API
4. **Add E2E tests** for the complete flow

## 💡 Key Testing Benefits

- **Confidence**: Know that blockchain interactions work correctly
- **Refactoring Safety**: Safe to modify service logic
- **Documentation**: Tests serve as living documentation
- **Bug Prevention**: Catch issues before they reach production

The tests are designed to be comprehensive yet maintainable, with proper mocking that doesn't require actual blockchain connections during testing.
