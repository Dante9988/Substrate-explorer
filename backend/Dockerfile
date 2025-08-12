FROM node:20-alpine

WORKDIR /app

# Copy package files from backend context
COPY backend/package*.json ./

# Copy source code
COPY backend/src/ ./src/
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./

# Install dependencies
RUN yarn install

# Build the application
RUN yarn build

# Remove devDependencies to reduce image size
RUN yarn install --production

# Expose port
EXPOSE 3001

# Start the application using the compiled JavaScript
CMD ["yarn", "start:prod"]
