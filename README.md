# Blockchain Explorer

A simple and modern blockchain explorer for Substrate networks, built with NestJS (backend) and React (frontend), deployed on Railway and Vercel.

## Features

- **Address Search**: Search for transactions and events related to any address
- **Block Information**: View detailed information about specific blocks
- **Network Status**: Monitor network health and statistics
- **Real-time Updates**: Live blockchain data with automatic refresh via WebSocket
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **API Documentation**: Swagger/OpenAPI documentation included
- **Production Ready**: Deployed on Railway (backend) and Vercel (frontend)

## Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework with dependency injection
- **Express** - Web framework
- **@polkadot/api** - Substrate blockchain interaction
- **Prisma** - Modern ORM for database access
- **PostgreSQL** - Production database (Railway)
- **SQLite** - Local development database (optional)
- **TypeScript** - Type-safe development
- **Docker** - Containerized deployment
- **Railway** - Production hosting platform

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Socket.io-client** - Real-time WebSocket communication
- **Vercel** - Production hosting platform

### Shared
- **TypeScript** - Common types and interfaces
- **Workspace** - Monorepo structure with Yarn workspaces

## Prerequisites

- Node.js 20+ (for NestJS compatibility)
- Yarn 1.22+
- Docker (for production builds)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blockchain-explorer
   ```

2. **Install dependencies**
   ```bash
   yarn install:all
   ```

3. **Build shared package**
   ```bash
   cd shared
   yarn build
   cd ..
   ```

## Configuration

### Backend Configuration
The backend connects to the Substrate blockchain via WebSocket. The default endpoint is:
```
wss://rpc.cc3-devnet-dryrun.creditcoin.network/ws
```

You can modify this in `backend/src/blockchain/blockchain.service.ts` or set the `BLOCKCHAIN_RPC_ENDPOINT` environment variable.

### Frontend Configuration
The frontend is configured to connect to different backends based on environment:

**Local Development:**
```
VITE_API_URL=http://localhost:8080
```

**Production (Railway):**
```
VITE_API_URL=https://substrate-explorer-production.up.railway.app
```

## Development

### Start Development Servers

**Start both backend and frontend:**
```bash
yarn dev
```

**Start only backend:**
```bash
yarn dev:backend
```

**Start only frontend:**
```bash
yarn dev:frontend
```

**Start production build locally:**
```bash
yarn build
yarn preview:3000  # Runs on port 3000
```

### Development URLs

- **Frontend**: http://localhost:3000 (dev) or http://localhost:3000 (preview)
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/api/docs
- **Health Check**: http://localhost:8080/health

## Production Deployment

### Backend (Railway)

**Automatic Deployment:**
- Connected to GitHub repository
- Uses `backend/Dockerfile` for builds
- Environment variables configured in Railway dashboard
- Health checks at `/health` endpoint

**Environment Variables:**
```bash
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
ALLOWED_ORIGINS=https://substrate-explorer-production.up.railway.app,https://your-vercel-domain.vercel.app
BLOCKCHAIN_RPC_ENDPOINT=wss://rpc.cc3-devnet-dryrun.creditcoin.network/ws
MAX_BLOCKS_TO_SCAN=10000
DEFAULT_BATCH_SIZE=100
CONNECTION_TIMEOUT=120000
SEARCH_TIMEOUT=1200000
```

**Production URL**: https://substrate-explorer-production.up.railway.app

### Frontend (Vercel)

**Automatic Deployment:**
- Connected to GitHub repository
- Builds using `yarn build`
- Serves from `dist/` folder
- Environment variables configured in Vercel dashboard

**Environment Variables:**
```bash
VITE_API_URL=https://substrate-explorer-production.up.railway.app
VITE_APP_NAME=Blockchain Explorer
VITE_APP_VERSION=1.0.0
```

## API Endpoints

### Core Endpoints
- `GET /health` - Health check endpoint
- `GET /api/docs` - Swagger API documentation

### Search
- `GET /api/search/address` - Search for address transactions
- `GET /api/block/:blockNumber` - Get block information
- `GET /api/block/hash/:blockHash` - Get block information by hash
- `GET /api/blocks/latest` - Get latest block number
- `GET /api/blocks/latest/info` - Get latest block with details
- `GET /api/network/info` - Get network information
- `GET /api/network/rpc-endpoint` - Get current RPC endpoint

### Extrinsic Information
- `GET /api/extrinsic/:extrinsicHash` - Get extrinsic information
- `GET /api/debug/extrinsic/:extrinsicHash` - Debug extrinsic search

### Debug Endpoints
- `GET /api/debug/era-calculations` - Era calculation debug info
- `GET /api/debug/polkadot-js-queries` - Polkadot.js query debug
- `GET /api/debug/cache/stats` - Cache statistics
- `GET /api/debug/cache/clear` - Clear all cache

### Query Parameters

#### Address Search
- `address` (required): The address to search for
- `blocksToScan` (optional): Number of recent blocks to scan (default: 10000, max: 10000)
- `batchSize` (optional): Number of blocks to process in each batch (default: 100, max: 100)

## WebSocket Endpoints

### Real-time Updates
- **Namespace**: `/blockchain`
- **Events**:
  - `blockchain:newBlock` - New block detected
  - `blockchain:blockFinalized` - Block finalized
  - `blockchain:blockDetails` - Block details
  - `blockchain:newTransaction` - New transaction
  - `blockchain:addressTransaction` - Address-specific transaction

### WebSocket Commands
- `join:blocks` - Join blocks room
- `leave:blocks` - Leave blocks room
- `join:transactions` - Join transactions room
- `leave:transactions` - Leave transactions room
- `join:address` - Join address-specific room
- `leave:address` - Leave address-specific room
- `get:status` - Get blockchain status
- `ping` - Ping connection

## Project Structure

```
blockchain-explorer/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── blockchain/     # Blockchain service and module
│   │   ├── search/         # Search controller and module
│   │   ├── websocket/      # WebSocket gateway and service
│   │   ├── cache/          # Caching service
│   │   ├── config/         # Configuration files
│   │   ├── app.module.ts   # Main application module
│   │   ├── app.controller.ts # Health check controller
│   │   └── main.ts         # Application entry point
│   ├── Dockerfile          # Docker configuration
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Frontend entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── shared/                  # Shared types and utilities
│   ├── src/
│   │   ├── types.ts        # Common TypeScript interfaces
│   │   ├── constants.ts    # Shared constants
│   │   └── index.ts        # Main exports
│   ├── package.json
│   └── tsconfig.json
├── railway.json             # Railway deployment configuration
├── render.yaml              # Render deployment configuration
├── package.json             # Root workspace configuration
└── README.md
```

## Building for Production

### Build all packages
```bash
yarn build
```

### Build individual packages
```bash
yarn build:backend
yarn build:frontend
```

### Production preview
```bash
yarn build
yarn preview:3000  # Test production build locally
```

## Environment Configuration

### Local Development
Create `frontend/.env.local`:
```bash
VITE_API_URL=http://localhost:8080
```

### Production
Set in Railway/Vercel dashboard:
```bash
VITE_API_URL=https://substrate-explorer-production.up.railway.app
```

## CORS Configuration

The backend supports the following origins:
- Local development: `http://localhost:3000`, `http://localhost:8080`
- Production: Railway and Vercel domains
- Custom domains can be added via `ALLOWED_ORIGINS` environment variable

## Data Storage

**In-Memory Caching:**
- Search results cached with TTL (5-10 minutes)
- Block information cached with TTL (2 minutes)
- Pending requests pooled to prevent duplicates
- **Note**: All cache data is lost on restart (RAM-based)

**Cache Management:**
- Automatic cleanup every 5 minutes
- Debug endpoints for cache statistics and clearing
- Request pooling for concurrent searches

## Customization

### Adding New Blockchain Networks
1. Modify the WebSocket endpoint in `backend/src/blockchain/blockchain.service.ts`
2. Update the network information display in the frontend
3. Adjust block scanning parameters as needed

### Adding New Search Types
1. Extend the `BlockchainService` with new search methods
2. Add new endpoints to the `SearchController`
3. Create corresponding frontend components and pages

### Styling
The application uses Tailwind CSS with custom component classes defined in `frontend/src/index.css`.

## Troubleshooting

### Common Issues

1. **Backend connection failed**
   - Check if the WebSocket endpoint is accessible
   - Verify network connectivity
   - Check backend logs for detailed error messages
   - Verify Railway environment variables

2. **Frontend can't connect to backend**
   - Ensure backend is running on correct port (8080)
   - Check CORS configuration
   - Verify environment variables (`VITE_API_URL`)
   - Check Railway health status

3. **Build errors**
   - Ensure all dependencies are installed
   - Check TypeScript configuration
   - Verify shared package is built
   - Check for unused imports (run `yarn lint`)

4. **Production deployment issues**
   - Verify Railway environment variables
   - Check Docker build logs
   - Ensure health check endpoint is accessible
   - Verify CORS origins include production domains

### Logs
- Backend logs are displayed in Railway dashboard
- Frontend errors are shown in the browser console
- Network requests can be monitored in browser dev tools
- Railway provides real-time deployment logs

### Health Checks
- **Health endpoint**: `/health` (not `/api/health`)
- **Railway configuration**: Uses `/health` for health checks
- **Expected response**: `{"status":"ok","timestamp":"..."}`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

## Production URLs

- **Backend API**: https://substrate-explorer-production.up.railway.app
- **API Documentation**: https://substrate-explorer-production.up.railway.app/api/docs
- **Health Check**: https://substrate-explorer-production.up.railway.app/health
- **Frontend**: https://substrate-explorer-frontend-9hdv4dpi7-dante9988s-projects.vercel.app/
