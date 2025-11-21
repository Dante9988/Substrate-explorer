-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "parentHash" TEXT NOT NULL,
    "stateRoot" TEXT NOT NULL,
    "extrinsicsRoot" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "author" TEXT,
    "extrinsicsCount" INTEGER NOT NULL DEFAULT 0,
    "eventsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Extrinsic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "blockHash" TEXT NOT NULL,
    "extrinsicIndex" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "signer" TEXT,
    "nonce" INTEGER,
    "args" TEXT NOT NULL,
    "signature" TEXT,
    "isSigned" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Extrinsic_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "Block" ("number") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockNumber" INTEGER NOT NULL,
    "blockHash" TEXT NOT NULL,
    "extrinsicHash" TEXT,
    "extrinsicIndex" INTEGER,
    "eventIndex" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "Block" ("number") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Event_extrinsicHash_fkey" FOREIGN KEY ("extrinsicHash") REFERENCES "Extrinsic" ("hash") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "firstSeenBlock" INTEGER NOT NULL,
    "lastSeenBlock" INTEGER NOT NULL,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AddressExtrinsic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "addressId" TEXT NOT NULL,
    "extrinsicHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AddressExtrinsic_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AddressExtrinsic_extrinsicHash_fkey" FOREIGN KEY ("extrinsicHash") REFERENCES "Extrinsic" ("hash") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AddressEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "addressId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AddressEvent_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AddressEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IndexerState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Block_number_key" ON "Block"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Block_hash_key" ON "Block"("hash");

-- CreateIndex
CREATE INDEX "Block_number_idx" ON "Block"("number");

-- CreateIndex
CREATE INDEX "Block_hash_idx" ON "Block"("hash");

-- CreateIndex
CREATE INDEX "Block_timestamp_idx" ON "Block"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Extrinsic_hash_key" ON "Extrinsic"("hash");

-- CreateIndex
CREATE INDEX "Extrinsic_hash_idx" ON "Extrinsic"("hash");

-- CreateIndex
CREATE INDEX "Extrinsic_blockNumber_idx" ON "Extrinsic"("blockNumber");

-- CreateIndex
CREATE INDEX "Extrinsic_signer_idx" ON "Extrinsic"("signer");

-- CreateIndex
CREATE INDEX "Extrinsic_section_method_idx" ON "Extrinsic"("section", "method");

-- CreateIndex
CREATE INDEX "Event_blockNumber_idx" ON "Event"("blockNumber");

-- CreateIndex
CREATE INDEX "Event_extrinsicHash_idx" ON "Event"("extrinsicHash");

-- CreateIndex
CREATE INDEX "Event_section_method_idx" ON "Event"("section", "method");

-- CreateIndex
CREATE UNIQUE INDEX "Address_address_key" ON "Address"("address");

-- CreateIndex
CREATE INDEX "Address_address_idx" ON "Address"("address");

-- CreateIndex
CREATE INDEX "Address_lastSeenBlock_idx" ON "Address"("lastSeenBlock");

-- CreateIndex
CREATE INDEX "AddressExtrinsic_addressId_idx" ON "AddressExtrinsic"("addressId");

-- CreateIndex
CREATE INDEX "AddressExtrinsic_extrinsicHash_idx" ON "AddressExtrinsic"("extrinsicHash");

-- CreateIndex
CREATE INDEX "AddressExtrinsic_blockNumber_idx" ON "AddressExtrinsic"("blockNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AddressExtrinsic_addressId_extrinsicHash_key" ON "AddressExtrinsic"("addressId", "extrinsicHash");

-- CreateIndex
CREATE INDEX "AddressEvent_addressId_idx" ON "AddressEvent"("addressId");

-- CreateIndex
CREATE INDEX "AddressEvent_eventId_idx" ON "AddressEvent"("eventId");

-- CreateIndex
CREATE INDEX "AddressEvent_blockNumber_idx" ON "AddressEvent"("blockNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AddressEvent_addressId_eventId_key" ON "AddressEvent"("addressId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "IndexerState_key_key" ON "IndexerState"("key");

-- CreateIndex
CREATE INDEX "IndexerState_key_idx" ON "IndexerState"("key");
