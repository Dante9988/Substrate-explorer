export interface BlockchainConfig {
  rpcEndpoint: string;
  maxBlocksToScan: number;
  defaultBatchSize: number;
  connectionTimeout: number;
  searchTimeout: number;
}

export const blockchainConfig: BlockchainConfig = {
  rpcEndpoint: process.env.BLOCKCHAIN_RPC_ENDPOINT || 'wss://rpc.cc3-devnet-dryrun.creditcoin.network/ws',
  maxBlocksToScan: parseInt(process.env.MAX_BLOCKS_TO_SCAN || '10000'),
  defaultBatchSize: parseInt(process.env.DEFAULT_BATCH_SIZE || '100'),
  connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT || '120000'),
  searchTimeout: parseInt(process.env.SEARCH_TIMEOUT || '1200000'),
};
