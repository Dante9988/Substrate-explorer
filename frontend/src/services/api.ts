import axios from 'axios'
import { SearchResult, BlockInfo, NetworkInfo } from '@blockchain-explorer/shared'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 1200000, // 20 minutes for blockchain operations (increased for extrinsic search)
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw new Error(error.message || 'Request failed')
  }
)

export const searchAddress = async (
  address: string,
  blocksToScan: number,
  batchSize: number
): Promise<SearchResult> => {
  const response = await api.get('/api/search/address', {
    params: { address, blocksToScan, batchSize }
  })
  return response.data
}

export const getBlockInfo = async (blockNumber: number): Promise<BlockInfo> => {
  console.log('API: Getting block info by number:', blockNumber)
  const response = await api.get(`/api/block/${blockNumber}`)
  console.log('API: Block info response:', response.data)
  return response.data
}

export const getLatestBlock = async (): Promise<{ latestBlock: number }> => {
  const response = await api.get('/api/blocks/latest')
  return response.data
}

export const getLatestBlockInfo = async (): Promise<{
  number: number;
  hash: string;
  timestamp: number;
  extrinsicsCount: number;
  eventsCount: number;
}> => {
  const response = await api.get('/api/blocks/latest/info')
  return response.data
}

export const getNetworkInfo = async (): Promise<NetworkInfo> => {
  const response = await api.get('/api/network/info')
  return response.data
}

export const getExtrinsicInfo = async (
  extrinsicHash: string,
  strategy?: 'events' | 'blocks' | 'hybrid',
  maxBlocks?: number,
  timeoutMs?: number
): Promise<{
  extrinsic: {
    index: number;
    hash: string;
    section: string;
    method: string;
    signer: string;
    nonce: number;
    args: any[];
    events: Array<{
      section: string;
      method: string;
      data: any[];
    }>;
  };
  block: {
    number: number;
    hash: string;
    timestamp: number;
  };
}> => {
  const params: any = {};
  // Default to 'events' strategy for better performance
  params.strategy = strategy || 'events';
  // Default to 10000 blocks for better coverage
  params.maxBlocks = maxBlocks || 10000;
  if (timeoutMs) params.timeoutMs = timeoutMs;
  
  const response = await api.get(`/api/extrinsic/${extrinsicHash}`, { params })
  return response.data
}

export const getBlockInfoByHash = async (blockHash: string): Promise<BlockInfo> => {
  console.log('API: Getting block info by hash:', blockHash)
  const response = await api.get(`/api/block/hash/${blockHash}`)
  console.log('API: Block info response:', response.data)
  return response.data
}

export const getRpcEndpoint = async (): Promise<{ rpcEndpoint: string }> => {
  const response = await api.get('/api/network/rpc-endpoint')
  return response.data
}

export const changeRpcEndpoint = async (rpcEndpoint: string): Promise<{ message: string; rpcEndpoint: string }> => {
  const response = await api.post('/api/network/rpc-endpoint', { rpcEndpoint })
  return response.data
}

// Debug endpoint for era calculations
export const debugEraCalculations = async (): Promise<{
  latestBlock: number;
  currentEra: number;
  calculatedEraStart: number;
  blocksSinceEraStart: number;
  timeRemaining: number;
  progressPercentage: number;
}> => {
  const response = await api.get('/api/debug/era-calculations')
  return response.data
}

// Debug endpoint for Polkadot.js style queries
export const debugPolkadotJsQueries = async (): Promise<{
  currentEra: any;
  activeEra: any;
  erasStart: any;
  latestBlock: number;
}> => {
  const response = await api.get('/api/debug/polkadot-js-queries')
  return response.data
}

// Debug endpoint for extrinsic search
export const debugExtrinsic = async (extrinsicHash: string): Promise<any> => {
  const response = await api.get(`/api/debug/extrinsic/${extrinsicHash}`)
  return response.data
}


export default api
