FROM node:18-alpine

WORKDIR /app

# Copy root yarn.lock and package files
COPY yarn.lock ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./

# Install shared dependencies and build shared package
WORKDIR /app/shared
RUN yarn install --frozen-lockfile
RUN yarn build

# Go back to main app directory
WORKDIR /app

# Install backend dependencies
RUN yarn install --frozen-lockfile

# Copy backend source code
COPY backend/src/ ./src/
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./

# Build the application (this will create dist/ folder)
RUN yarn build

# Remove devDependencies to reduce image size
RUN yarn install --frozen-lockfile --production

# Expose port
EXPOSE 3001

# Start the application using the compiled JavaScript
CMD ["yarn", "start:prod"]
