# Quick Start Guide

Get the Blockchain Explorer running in 5 minutes!

## Prerequisites

- **Node.js 20+** - [Download here](https://nodejs.org/)
- **Yarn 1.22+** - [Install Yarn](https://yarnpkg.com/getting-started/install)

## Quick Start

### 1. Install Dependencies
```bash
yarn install:all
```

### 2. Build Shared Package
```bash
cd shared && yarn build && cd ..
```

### 3. Initialize Database (First Time Only)

**Option A: Use PostgreSQL (Recommended for Railway compatibility)**

1. Install PostgreSQL locally or use Docker:
   ```bash
   docker run --name postgres-dev -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=substrate_explorer -p 5432:5432 -d postgres:15
   ```

2. Create `backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/substrate_explorer"
   ```

3. Run migrations:
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev --name init
   cd ..
   ```

**Option B: Use SQLite for Local Development**

1. Switch to SQLite:
   ```bash
   cd backend
   chmod +x scripts/switch-to-sqlite.sh
   ./scripts/switch-to-sqlite.sh
   ```

2. Create `backend/.env`:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   ```

3. Run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   cd ..
   ```

> **Note**: The default schema uses PostgreSQL for Railway deployment. Use Option B only if you prefer SQLite for local development.

### 4. Start Development Servers
```bash
yarn dev
```

That's it! 🎉

## What Happens Next

- **Frontend** starts at: http://localhost:3001 (or 3000)
- **Backend API** starts at: http://localhost:8080
- **API Docs** available at: http://localhost:8080/api/docs
- **Indexer Status** available at: http://localhost:8080/api/indexer/status
- **Prisma Studio** (optional): `cd backend && npx prisma studio` → http://localhost:5555

## Verify Everything is Working

### 1. Check Backend is Running
Look for these log messages:
```
📊 Database connected successfully
✅ Successfully bound to 0.0.0.0:8080
🚀 Blockchain Explorer API is running on: http://localhost:8080
```

### 2. Check Indexer is Working
```bash
curl http://localhost:8080/api/indexer/status
```

You should see:
```json
{
  "status": "ok",
  "indexer": {
    "isRunning": true,
    "blocksIndexed": 0,  // Will increase as blocks arrive
    ...
  }
}
```

### 3. Watch Real-Time Indexing
In your backend terminal, you should see:
```
📦 Indexing block #7890
✅ Indexed 2 extrinsics for block #7890
```

This happens automatically every ~15 seconds as new blocks arrive!

## First Steps

1. **Open** http://localhost:3001 in your browser
2. **Navigate** to the Search page
3. **Enter** a Substrate address to search
4. **Watch** the backend logs - first search queries blockchain, subsequent searches use database (much faster!)
5. **Explore** blocks and network information

## Troubleshooting

### Port Already in Use
If ports 8080 or 3001 are busy:
```bash
# Kill processes on those ports
lsof -ti:8080 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Database Not Initialized
If you see "Database may not be initialized" error:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### Indexer Not Working
If you don't see "Indexing block" messages:
1. Check backend logs for errors
2. Verify blockchain connection: `curl http://localhost:8080/api/network/info`
3. Check indexer status: `curl http://localhost:8080/api/indexer/status`
4. Ensure EventEmitterModule is loaded (check startup logs)

### Connection Issues
- Check your internet connection
- Verify the RPC endpoint is accessible: `wss://rpc.cc3-devnet-dryrun.creditcoin.network/ws`
- Check backend logs for connection errors

### Build Errors
- Ensure Node.js version is 20+
- Clear node_modules and reinstall: 
  ```bash
  rm -rf node_modules backend/node_modules frontend/node_modules shared/node_modules
  yarn install:all
  ```

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Look at the API documentation at http://localhost:8080/api/docs
- Check the [Database Implementation Guide](backend/DATABASE_IMPLEMENTATION.md) for database details
- Check the [Verification Guide](backend/VERIFICATION_GUIDE.md) to verify indexer is working
- Check console logs for error messages

## Quick Commands Reference

```bash
# Start everything
yarn dev

# Start only backend
cd backend && yarn start

# Start only frontend  
cd frontend && yarn dev

# Check indexer status
curl http://localhost:8080/api/indexer/status

# View database
cd backend && npx prisma studio

# Reset database (WARNING: deletes all data)
cd backend && npx prisma migrate reset
```

Happy exploring! 🚀
