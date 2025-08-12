# Blockchain Explorer

A simple and modern blockchain explorer for Substrate networks, built with NestJS (backend) and React (frontend).

## Features

- **Address Search**: Search for transactions and events related to any address
- **Block Information**: View detailed information about specific blocks
- **Network Status**: Monitor network health and statistics
- **Real-time Updates**: Live blockchain data with automatic refresh
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **API Documentation**: Swagger/OpenAPI documentation included

## Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework with dependency injection
- **Express** - Web framework
- **@polkadot/api** - Substrate blockchain interaction
- **TypeScript** - Type-safe development

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing

### Shared
- **TypeScript** - Common types and interfaces
- **Workspace** - Monorepo structure with npm workspaces

## Prerequisites

- Node.js 18+ 
- npm 8+

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blockchain-explorer
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Build shared package**
   ```bash
   cd shared
   npm run build
   cd ..
   ```

## Configuration

### Backend Configuration
The backend connects to the Substrate blockchain via WebSocket. The default endpoint is:
```
wss://rpc.cc3-devnet-dryrun.creditcoin.network/ws
```

You can modify this in `backend/src/blockchain/blockchain.service.ts`.

### Frontend Configuration
The frontend is configured to proxy API requests to the backend. The default backend URL is:
```
http://localhost:3001
```

## Development

### Start Development Servers

**Start both backend and frontend:**
```bash
npm run dev
```

**Start only backend:**
```bash
npm run dev:backend
```

**Start only frontend:**
```bash
npm run dev:frontend
```

### Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs

## API Endpoints

### Search
- `GET /api/search/address` - Search for address transactions
- `GET /api/block/:blockNumber` - Get block information
- `GET /api/blocks/latest` - Get latest block number
- `GET /api/network/info` - Get network information

### Query Parameters

#### Address Search
- `address` (required): The address to search for
- `blocksToScan` (optional): Number of recent blocks to scan (default: 100, max: 1000)
- `batchSize` (optional): Number of blocks to process in each batch (default: 10, max: 100)

## Usage

### 1. Address Search
Navigate to the Search page and enter a Substrate address. The system will scan recent blocks for:
- Transactions where the address is a signer
- Events that reference the address

### 2. Block Exploration
View detailed information about specific blocks including:
- Block hash and metadata
- Parent block hash
- State and extrinsics roots
- Transaction count

### 3. Network Monitoring
Monitor network health and statistics:
- Latest block number
- Network name and version
- Node information
- Connection status

## Project Structure

```
blockchain-explorer/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── blockchain/     # Blockchain service and module
│   │   ├── search/         # Search controller and module
│   │   ├── app.module.ts   # Main application module
│   │   └── main.ts         # Application entry point
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
├── package.json             # Root workspace configuration
└── README.md
```

## Building for Production

### Build all packages
```bash
npm run build
```

### Build individual packages
```bash
npm run build:backend
npm run build:frontend
```

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

2. **Frontend can't connect to backend**
   - Ensure backend is running on port 3001
   - Check CORS configuration
   - Verify proxy settings in Vite config

3. **Build errors**
   - Ensure all dependencies are installed
   - Check TypeScript configuration
   - Verify shared package is built

### Logs
- Backend logs are displayed in the console
- Frontend errors are shown in the browser console
- Network requests can be monitored in browser dev tools

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
