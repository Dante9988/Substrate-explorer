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

export interface ExtrinsicInfo {
  hash: string;
  blockNumber: number;
  blockHash: string;
  section: string;
  method: string;
  data: string[];
  signer?: string;
  nonce?: number;
  tip?: string;
  isSigned: boolean;
  success: boolean;
}

export interface EventInfo {
  section: string;
  method: string;
  data: string[];
  blockNumber: number;
  blockHash: string;
  extrinsicHash?: string;
  extrinsicIndex?: number;
  eventIndex: number;
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
  // Era information
  currentEra: number;
  activeEra: number;
  activeEraStart: number;
  blockTime: number;
  eraDuration: number;
  blocksPerEra: number;
  // Era progress information
  currentBlockInEra: number;
  blocksRemainingInEra: number;
  timeRemainingInEra: number;
  eraProgressPercentage: number;
  // Block range coverage warnings
  blockRangeCoverage: {
    blocks1000: {
      blocks: number;
      eras: number;
      timeCoverage: string;
      warning: string;
    };
    blocks5000: {
      blocks: number;
      eras: number;
      timeCoverage: string;
      warning: string;
    };
    blocks10000: {
      blocks: number;
      eras: number;
      timeCoverage: string;
      warning: string;
    };
    blocks50000: {
      blocks: number;
      eras: number;
      timeCoverage: string;
      warning: string;
    };
  };
}

// New types for enhanced functionality
export interface SubstrateAccount {
  mnemonic: string;
  address: string;
}

export interface TransferResult {
  blockHash: string;
  extrinsicHash: string;
}

export interface StakingResult {
  blockHash: string;
  extrinsicHash: string;
  nominationTxHash?: string;
  nominationBlockHash?: string;
}

export interface BatchTransferResult {
  blockHash: string;
  extrinsicHash: string;
  batchSize: number;
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
