# Database Indexer Verification Guide

## 🔍 How to Verify the Indexer is Running

### 1. Check Backend Startup Logs

When you start the backend, you should see these log messages:

```bash
✅ Successfully bound to 0.0.0.0:8080
📊 Database connected successfully        # ← Database is connected
🚀 Blockchain Explorer API is running on: http://localhost:8080
[Nest] LOG [BlockchainService] Connected to Substrate blockchain
✅ Real-time blockchain monitoring started successfully
🆕 New block #7890 detected: 0x...       # ← Receiving new blocks
📦 Indexing block #7890                   # ← Indexer is working!
📊 Indexing 2 extrinsics for block #7890
Indexed address 5FguK73p... for extrinsic 0x4fcb7f...
✅ Indexed 2 extrinsics for block #7890  # ← Successfully indexed
```

**Key indicators:**
- ✅ "Database connected successfully" - Database module loaded
- ✅ "Indexing block #XXXX" - Indexer is actively saving blocks
- ✅ "Indexed address..." - Address relationships being indexed
- ✅ "Indexed X extrinsics" - Transactions being saved

### 2. Check Database File Exists

The database file should be created automatically:

```bash
# From backend directory
ls -lh dev.db

# Should show something like:
# -rw-r--r-- 1 user user 128K Oct 15 14:30 dev.db
```

If the file doesn't exist, the database isn't initialized.

### 3. Use Prisma Studio to View Data

Open Prisma Studio to visually inspect the database:

```bash
cd backend
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all blocks in the `Block` table
- View all extrinsics in the `Extrinsic` table
- View all addresses in the `Address` table
- See relationships and data

### 4. Check Database Manually

Query the database directly:

```bash
cd backend
npx prisma db seed
# or use sqlite3
sqlite3 dev.db "SELECT COUNT(*) FROM Block;"
sqlite3 dev.db "SELECT COUNT(*) FROM Extrinsic;"
sqlite3 dev.db "SELECT COUNT(*) FROM Address;"
sqlite3 dev.db "SELECT number, hash FROM Block ORDER BY number DESC LIMIT 5;"
```

### 5. Test via API Endpoints

#### A. Check if data is being served from database:

Search for an address and watch the logs:

```bash
# In your terminal, watch backend logs
curl "http://localhost:8080/api/search/address?address=5FguK73pSbq3DhJLQf8Bqa98nxmDEjPgywEs1U5WDR3LhTVB&blocksToScan=10000&batchSize=100"
```

**Look for these log messages:**

```
# First time (not in DB):
[SearchController] Checking database for address 5FguK73p...
[SearchController] No data in database, querying blockchain for 5FguK73p...

# After indexer has processed blocks with this address:
[SearchController] Checking database for address 5FguK73p...
[SearchController] Found 8 extrinsics in database for 5FguK73p...
```

#### B. Test block lookup:

```bash
# Check recent block (should be in DB if indexer is running)
curl "http://localhost:8080/api/block/7890"
```

**Look for log:**
```
[SearchController] Found block #7890 in database
```

#### C. Test extrinsic lookup:

```bash
# Use a recent extrinsic hash
curl "http://localhost:8080/api/extrinsic/0x4fcb7f91b5e418e05bf80dab3c916e2e2c87517292356c91a0c718e4b86eb983"
```

**Look for log:**
```
[SearchController] Found extrinsic 0x4fcb7f91... in database
```

### 6. Monitor Real-time Indexing

Keep the backend logs visible and watch for new blocks:

```bash
cd backend
yarn start | grep -E "Indexing|Indexed"
```

You should see continuous output like:
```
📦 Indexing block #7891
✅ Indexed 2 extrinsics for block #7891
📦 Indexing block #7892
✅ Indexed 2 extrinsics for block #7892
```

Every ~15 seconds (or whatever the block time is), you should see new blocks being indexed.

## ⚠️ Troubleshooting

### Problem: "Database connected" but no "Indexing block" messages

**Possible causes:**
1. WebSocket monitoring not started
2. Blockchain not connected
3. EventEmitter not working

**Solution:**
- Check that `WebSocketService` is starting monitoring
- Verify blockchain connection in logs
- Ensure `EventEmitterModule` is imported in `app.module.ts`

### Problem: Database file doesn't exist

**Solution:**
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### Problem: Indexer not saving data

**Solution:**
1. Check for errors in logs
2. Verify `IndexerService` is loaded:
   ```bash
   # Look for this in startup logs:
   [InstanceLoader] IndexerModule dependencies initialized
   ```
3. Check that events are being emitted:
   ```bash
   # Add this temporarily to websocket.service.ts for debugging
   this.logger.log(`Emitting block.new event for block #${blockNumber}`);
   ```

### Problem: "Unique constraint failed" errors

This is actually **GOOD** - it means:
- Indexer is working
- Trying to index the same block twice
- Database constraints are preventing duplicates

These errors are normal and handled gracefully.

## 📊 Performance Verification

### Test Performance Difference

1. **Clear cache** (to test fresh):
   ```bash
   curl "http://localhost:8080/api/debug/cache/clear"
   ```

2. **First query** (blockchain scan - slow):
   ```bash
   time curl "http://localhost:8080/api/search/address?address=YOUR_ADDRESS"
   # Should take 30-60 seconds
   ```

3. **Wait for indexer** to process recent blocks (watch logs for your address)

4. **Second query** (database - fast):
   ```bash
   time curl "http://localhost:8080/api/search/address?address=YOUR_ADDRESS"
   # Should take < 100ms ⚡
   ```

The second query should be **dramatically faster** if the data is in the database!

## 🎯 Success Checklist

- [ ] Backend starts without errors
- [ ] See "📊 Database connected successfully"
- [ ] See "📦 Indexing block #XXXX" messages
- [ ] Database file `dev.db` exists and is growing
- [ ] Prisma Studio shows data in tables
- [ ] API logs show "Found ... in database"
- [ ] Response times are fast (<100ms for cached data)
- [ ] New blocks appear every ~15 seconds

## 🔧 Additional Verification Tools

### Create a Test Script

Create `backend/test-indexer.sh`:

```bash
#!/bin/bash

echo "🔍 Checking Database Indexer Status..."
echo ""

# Check database file
if [ -f "dev.db" ]; then
    SIZE=$(du -h dev.db | cut -f1)
    echo "✅ Database file exists (Size: $SIZE)"
else
    echo "❌ Database file not found!"
    exit 1
fi

# Check block count
BLOCK_COUNT=$(sqlite3 dev.db "SELECT COUNT(*) FROM Block;")
echo "📦 Blocks indexed: $BLOCK_COUNT"

# Check extrinsic count
EXTRINSIC_COUNT=$(sqlite3 dev.db "SELECT COUNT(*) FROM Extrinsic;")
echo "📝 Extrinsics indexed: $EXTRINSIC_COUNT"

# Check address count
ADDRESS_COUNT=$(sqlite3 dev.db "SELECT COUNT(*) FROM Address;")
echo "👤 Addresses indexed: $ADDRESS_COUNT"

# Show latest blocks
echo ""
echo "📊 Latest indexed blocks:"
sqlite3 dev.db "SELECT number, substr(hash, 1, 20) as hash, datetime(timestamp/1000, 'unixepoch') as time FROM Block ORDER BY number DESC LIMIT 5;"

echo ""
if [ $BLOCK_COUNT -gt 0 ]; then
    echo "✅ Indexer is working! Database has data."
else
    echo "⚠️  No blocks indexed yet. Wait for new blocks or check logs."
fi
```

Run it:
```bash
cd backend
chmod +x test-indexer.sh
./test-indexer.sh
```

### Add Health Check Endpoint

You could also add an API endpoint to check indexer status (I can implement this if you want):

```
GET /api/indexer/stats

Response:
{
  "blocksIndexed": 150,
  "extrinsicsIndexed": 300,
  "addressesIndexed": 45,
  "lastIndexedBlock": 7890,
  "databaseSize": "128KB",
  "isIndexing": true
}
```

## 📈 Expected Results

After running for **5 minutes**, you should see:
- ~20-30 blocks indexed (depending on block time)
- ~40-60 extrinsics indexed
- ~10-20 unique addresses indexed

After running for **1 hour**:
- ~240 blocks indexed
- ~480 extrinsics indexed
- ~50-100 unique addresses indexed

The database will keep growing as more blocks arrive!

