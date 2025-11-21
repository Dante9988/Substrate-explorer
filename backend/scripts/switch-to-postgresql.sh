#!/bin/bash
# Helper script to switch Prisma schema back to PostgreSQL

echo "🔄 Switching Prisma schema to PostgreSQL..."

# Replace SQLite with PostgreSQL
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

echo "✅ Switched to PostgreSQL"
echo "📝 Updated: prisma/schema.prisma"
echo ""
echo "⚠️  Remember to:"
echo "   1. Set DATABASE_URL to your PostgreSQL connection string"
echo "   2. Run: npx prisma migrate deploy (for production)"
echo "   3. Or: npx prisma migrate dev (for development)"

