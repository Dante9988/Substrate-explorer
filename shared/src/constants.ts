export const DEFAULT_RPC_ENDPOINT = 'wss://rpc.cc3-devnet-dryrun.creditcoin.network/ws';
export const DEFAULT_BLOCKS_TO_SCAN = 10000; // Increased for better coverage
export const DEFAULT_BATCH_SIZE = 20; // Increased for better performance
export const MAX_BLOCKS_TO_SCAN = 10000; // Increased maximum limit

export const API_ENDPOINTS = {
  SEARCH_ADDRESS: '/api/search/address',
  GET_BLOCK: '/api/block',
  GET_LATEST_BLOCKS: '/api/blocks/latest',
  GET_NETWORK_INFO: '/api/network/info',
  GET_EXTRINSIC: '/api/extrinsic',
  GET_EVENT: '/api/event',
} as const;
