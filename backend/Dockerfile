FROM node:20-alpine

WORKDIR /app

# Copy package files from backend context
COPY backend/package*.json ./
COPY backend/yarn.lock* ./

# Install dependencies (including Prisma CLI)
RUN yarn install

# Copy Prisma schema and migrations
COPY backend/prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY backend/src/ ./src/
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./

# Build the application
RUN yarn build

# Remove devDependencies to reduce image size (but keep Prisma CLI for migrations)
RUN yarn install --production && yarn add -D prisma

# Expose port
EXPOSE 3001

# Run migrations and start the application
CMD ["sh", "-c", "npx prisma migrate deploy && yarn start:prod"]
