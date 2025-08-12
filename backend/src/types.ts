export interface TxHit {
  blockNumber: number;
  blockHash: string;
  section: string;
  method: string;
  data: string[];
  extrinsicHash: string;
  extrinsicIndex?: number;
  eventIndex?: number;
  signer?: string;
  nonce?: number;
  args?: any[];
  events?: Array<{
    section: string;
    method: string;
    data: any[];
  }>;
}

export interface SubstrateAccount {
  address: string;
  balance?: string;
  nonce?: number;
  mnemonic?: string;
}

export interface TransferResult {
  blockNumber?: number;
  blockHash: string;
  extrinsicHash: string;
  section?: string;
  method?: string;
  data?: string[];
  signer?: string;
  nonce?: number;
  tip?: string;
  success?: boolean;
}

export interface StakingResult {
  blockNumber?: number;
  blockHash: string;
  extrinsicHash: string;
  section?: string;
  method?: string;
  data?: string[];
  signer?: string;
  nonce?: number;
  amount?: string;
  success?: boolean;
}

export interface BatchTransferResult {
  blockNumber?: number;
  blockHash: string;
  extrinsicHash: string;
  section?: string;
  method?: string;
  data?: string[];
  signer?: string;
  nonce?: number;
  transfers?: string[];
  success?: boolean;
  batchSize?: number;
}

export interface BlockExtrinsics {
  blockNumber: number;
  blockHash: string;
  extrinsics: Array<{
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
  }>;
}

export interface BlockInfo {
  number: number;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  timestamp: number;
  extrinsicsCount: number;
  eventsCount: number;
  extrinsics?: Array<{
    index: number;
    hash: string;
    section: string;
    method: string;
    signer: string;
    nonce?: number;
    args: any[];
    events: Array<{
      section: string;
      method: string;
      data: any[];
    }>;
  }>;
  events?: Array<{
    index: number;
    section: string;
    method: string;
    data: any[];
    phase?: any;
    extrinsicIndex?: number | null;
  }>;
}

export interface SearchResult {
  transactions: TxHit[];
  total: number;
  blocksScanned: number;
}

export interface NetworkInfo {
  name: string;
  version: string;
  chain: string;
  nodeName: string;
  nodeVersion: string;
  latestBlock: number;
  peers: number;
  currentEra: number;
  activeEra: number;
  activeEraStart: number;
  blockTime: number;
  eraDuration: number;
  blocksPerEra: number;
  currentBlockInEra: number;
}

// Constants
export const DEFAULT_BLOCKS_TO_SCAN = 10000;
export const DEFAULT_BATCH_SIZE = 20;
export const MAX_BLOCKS_TO_SCAN = 10000;
