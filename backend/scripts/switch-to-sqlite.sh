#!/bin/bash
# Helper script to switch Prisma schema to SQLite for local development

echo "🔄 Switching Prisma schema to SQLite for local development..."

# Backup current schema
cp prisma/schema.prisma prisma/schema.prisma.backup

# Replace PostgreSQL with SQLite
sed -i 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma

echo "✅ Switched to SQLite"
echo "📝 Updated: prisma/schema.prisma"
echo "💾 Backup saved: prisma/schema.prisma.backup"
echo ""
echo "⚠️  Remember to:"
echo "   1. Set DATABASE_URL='file:./dev.db' in your .env"
echo "   2. Run: npx prisma migrate dev --name init"
echo "   3. Run: npx prisma generate"

