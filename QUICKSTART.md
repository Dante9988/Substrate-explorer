# Quick Start Guide

Get the Blockchain Explorer running in 5 minutes!

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm 8+** - Comes with Node.js

## Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Build Shared Package
```bash
cd shared && npm run build && cd ..
```

### 3. Start Development Servers
```bash
npm run dev
```

That's it! 🎉

## What Happens Next

- **Frontend** starts at: http://localhost:3000
- **Backend API** starts at: http://localhost:3001
- **API Docs** available at: http://localhost:3001/api/docs

## Test the Connection

Before using the explorer, test your blockchain connection:

```bash
node demo.js
```

This will verify that you can connect to the Substrate network.

## First Steps

1. **Open** http://localhost:3000 in your browser
2. **Navigate** to the Search page
3. **Enter** a Substrate address to search
4. **Explore** blocks and network information

## Troubleshooting

### Port Already in Use
If ports 3000 or 3001 are busy:
```bash
# Kill processes on those ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Connection Issues
- Check your internet connection
- Verify the RPC endpoint is accessible
- Check backend logs for errors

### Build Errors
- Ensure Node.js version is 18+
- Clear node_modules and reinstall: `rm -rf node_modules && npm run install:all`

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Look at the API documentation at http://localhost:3001/api/docs
- Check console logs for error messages

Happy exploring! 🚀
