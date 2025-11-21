# 🚂 Railway Deployment Guide with Prisma + PostgreSQL

This guide explains how to deploy your Substrate Explorer to Railway with Prisma and PostgreSQL.

## 📋 Overview

Railway provides managed PostgreSQL databases, which is perfect for production. Your app is configured to:
- Use **PostgreSQL** in production (Railway)
- Use **SQLite** for local development (optional - you can also use PostgreSQL locally)

## 🗄️ Database Setup

### Step 1: Create PostgreSQL Database in Railway

1. Go to your Railway project dashboard
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL database
4. Railway will automatically set the `DATABASE_URL` environment variable for your service

### Step 2: Verify DATABASE_URL

Railway automatically provides the `DATABASE_URL` environment variable in this format:
```
postgresql://postgres:password@hostname:port/railway
```

You can verify it's set in your Railway service's environment variables.

## 🔧 Local Development Setup

### Option A: Use PostgreSQL Locally (Recommended)

1. Install PostgreSQL locally or use Docker:
   ```bash
   docker run --name postgres-dev -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=substrate_explorer -p 5432:5432 -d postgres:15
   ```

2. Create a `.env` file in `backend/`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/substrate_explorer"
   ```

3. Run migrations:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

### Option B: Use SQLite for Local Dev

If you prefer SQLite for local development, you can:

1. Create a separate schema file or use a script to switch providers
2. Or manually change `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   And set `DATABASE_URL="file:./dev.db"` in your `.env`

## 🚀 Railway Deployment Steps

### Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub and Railway is connected to your repo.

### Step 2: Railway Will Automatically:

1. **Detect your Dockerfile** - Railway uses `backend/Dockerfile`
2. **Build your app** - Runs the build process including Prisma Client generation
3. **Run migrations** - The Dockerfile CMD runs `prisma migrate deploy` before starting
4. **Start your app** - Runs `yarn start:prod`

### Step 3: Environment Variables

Set these in Railway dashboard (Settings → Variables):

**Required:**
```bash
DATABASE_URL=<automatically set by Railway PostgreSQL service>
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
```

**Optional (Blockchain):**
```bash
BLOCKCHAIN_RPC_ENDPOINT=wss://rpc.cc3-devnet-dryrun.creditcoin.network/ws
MAX_BLOCKS_TO_SCAN=10000
DEFAULT_BATCH_SIZE=100
```

**CORS (if needed):**
```bash
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Step 4: Link Services

1. In Railway, make sure your **PostgreSQL database** and **Web Service** are in the same project
2. Railway automatically links them via `DATABASE_URL`
3. If not automatic, you can manually reference the database in your service settings

## 🔄 Migration Strategy

### First Deployment

On first deploy, Railway will:
1. Build the Docker image
2. Run `prisma migrate deploy` which applies all migrations
3. Start your application

### Subsequent Deployments

When you add new migrations:

1. **Create migration locally:**
   ```bash
   cd backend
   npx prisma migrate dev --name your_migration_name
   ```

2. **Commit and push:**
   ```bash
   git add backend/prisma/migrations/
   git commit -m "Add database migration"
   git push
   ```

3. **Railway automatically:**
   - Detects the new migration files
   - Runs `prisma migrate deploy` on deploy
   - Applies only new migrations (idempotent)

## 🧪 Testing the Deployment

### 1. Check Health Endpoint
```bash
curl https://your-app.railway.app/health
```

### 2. Check Database Connection
The app logs will show:
```
📊 Database connected successfully
```

### 3. Test API Endpoints
```bash
# Get latest block
curl https://your-app.railway.app/api/blocks/latest

# Search address
curl "https://your-app.railway.app/api/search/address?address=5FTkGj29PnBA5mzoX1eD41rveYR44i8udxRELbgXJtJXbNCX"
```

## 🛠️ Troubleshooting

### Issue: "Migration failed" or "Database not found"

**Solution:**
1. Verify PostgreSQL service is running in Railway
2. Check `DATABASE_URL` is set correctly
3. Ensure database and web service are in the same Railway project

### Issue: "Prisma Client not generated"

**Solution:**
- The Dockerfile runs `prisma generate` during build
- Check build logs in Railway dashboard
- Verify `prisma` is in `devDependencies` (needed for migrations)

### Issue: "Connection timeout"

**Solution:**
- Check PostgreSQL service is running
- Verify `DATABASE_URL` format is correct
- Check Railway service logs for connection errors

### Issue: "Schema drift" (migrations out of sync)

**Solution:**
1. Reset database (⚠️ **WARNING**: Deletes all data):
   ```bash
   # In Railway, delete and recreate PostgreSQL service
   # Or use Railway CLI:
   railway run npx prisma migrate reset
   ```

2. Or manually fix:
   ```bash
   railway run npx prisma migrate deploy
   ```

## 📊 Database Management

### View Database in Railway

Railway provides a database dashboard where you can:
- View tables and data
- Run SQL queries
- Monitor database metrics

### Use Prisma Studio (Local)

To inspect your production database locally:

1. Set `DATABASE_URL` to your Railway database:
   ```bash
   export DATABASE_URL="postgresql://postgres:password@hostname:port/railway"
   ```

2. Run Prisma Studio:
   ```bash
   cd backend
   npx prisma studio
   ```

   ⚠️ **Security Note**: Only do this with proper authentication and VPN if needed.

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Railway handles secrets
2. **Use Railway's built-in secrets** - More secure than environment variables
3. **Rotate database passwords** - Railway allows this in database settings
4. **Use connection pooling** - Prisma handles this automatically
5. **Backup regularly** - Railway provides automatic backups for paid plans

## 📈 Monitoring

### Railway Dashboard

Monitor:
- Database connection count
- Query performance
- Storage usage
- Network traffic

### Application Logs

Your app logs database operations:
```
📊 Database connected successfully
✅ Indexed block #12345
```

## 🎯 Quick Reference

### Common Commands

```bash
# Generate Prisma Client
cd backend && npx prisma generate

# Create new migration
cd backend && npx prisma migrate dev --name migration_name

# Deploy migrations (production)
cd backend && npx prisma migrate deploy

# View database (local)
cd backend && npx prisma studio

# Reset database (⚠️ deletes all data)
cd backend && npx prisma migrate reset
```

### Railway CLI (Optional)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run commands in Railway environment
railway run npx prisma studio
railway run npx prisma migrate deploy
```

## ✅ Checklist

Before deploying:
- [ ] PostgreSQL service created in Railway
- [ ] `DATABASE_URL` is set (automatic)
- [ ] All migrations are committed
- [ ] Dockerfile includes Prisma setup
- [ ] Environment variables configured
- [ ] Health check endpoint works
- [ ] Database connection successful

After deploying:
- [ ] Migrations applied successfully
- [ ] API endpoints responding
- [ ] Database queries working
- [ ] Indexer running (if applicable)
- [ ] Logs show no errors

## 🆘 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Prisma Docs**: https://www.prisma.io/docs
- **Railway Discord**: https://discord.gg/railway

