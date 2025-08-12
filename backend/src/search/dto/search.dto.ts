import { ApiProperty } from '@nestjs/swagger';

export class TxHitDto {
  @ApiProperty({ description: 'Block number' })
  blockNumber: number;

  @ApiProperty({ description: 'Block hash' })
  blockHash: string;

  @ApiProperty({ description: 'Section name' })
  section: string;

  @ApiProperty({ description: 'Method name' })
  method: string;

  @ApiProperty({ description: 'Transaction data', type: [String] })
  data: string[];

  @ApiProperty({ description: 'Extrinsic hash' })
  extrinsicHash: string;

  @ApiProperty({ description: 'Extrinsic index', required: false })
  extrinsicIndex?: number;

  @ApiProperty({ description: 'Event index', required: false })
  eventIndex?: number;
}

export class BlockInfoDto {
  @ApiProperty({ description: 'Block number' })
  number: number;

  @ApiProperty({ description: 'Block hash' })
  hash: string;

  @ApiProperty({ description: 'Parent block hash' })
  parentHash: string;

  @ApiProperty({ description: 'State root hash' })
  stateRoot: string;

  @ApiProperty({ description: 'Extrinsics root hash' })
  extrinsicsRoot: string;

  @ApiProperty({ description: 'Block timestamp' })
  timestamp: number;

  @ApiProperty({ description: 'Number of extrinsics in block' })
  extrinsicsCount: number;

  @ApiProperty({ description: 'Number of events in block' })
  eventsCount: number;
}

export class NetworkInfoDto {
  @ApiProperty({ description: 'Network name' })
  name: string;

  @ApiProperty({ description: 'Network version' })
  version: string;

  @ApiProperty({ description: 'Chain name' })
  chain: string;

  @ApiProperty({ description: 'Node name' })
  nodeName: string;

  @ApiProperty({ description: 'Node version' })
  nodeVersion: string;

  @ApiProperty({ description: 'Latest block number' })
  latestBlock: number;

  @ApiProperty({ description: 'Number of peers' })
  peers: number;
}

export class SearchResultDto {
  @ApiProperty({ description: 'Array of transaction hits', type: [TxHitDto] })
  transactions: TxHitDto[];

  @ApiProperty({ description: 'Total number of transactions found' })
  total: number;

  @ApiProperty({ description: 'Number of blocks scanned' })
  blocksScanned: number;
}

export class LatestBlockDto {
  @ApiProperty({ description: 'Latest block number' })
  latestBlock: number;
}

export class ExtrinsicInfoDto {
  @ApiProperty({ description: 'Extrinsic index in the block' })
  index: number;

  @ApiProperty({ description: 'Extrinsic hash' })
  hash: string;

  @ApiProperty({ description: 'Section name' })
  section: string;

  @ApiProperty({ description: 'Method name' })
  method: string;

  @ApiProperty({ description: 'Signer address' })
  signer: string;

  @ApiProperty({ description: 'Nonce value' })
  nonce: number;

  @ApiProperty({ description: 'Method arguments', type: [Object] })
  args: any[];

  @ApiProperty({ description: 'Associated events', type: [Object] })
  events: Array<{
    section: string;
    method: string;
    data: any[];
  }>;
}

export class ExtrinsicBlockInfoDto {
  @ApiProperty({ description: 'Block number' })
  number: number;

  @ApiProperty({ description: 'Block hash' })
  hash: string;

  @ApiProperty({ description: 'Block timestamp' })
  timestamp: number;
}

export class ExtrinsicResponseDto {
  @ApiProperty({ description: 'Extrinsic information', type: ExtrinsicInfoDto })
  extrinsic: ExtrinsicInfoDto;

  @ApiProperty({ description: 'Block information', type: ExtrinsicBlockInfoDto })
  block: ExtrinsicBlockInfoDto;
}
