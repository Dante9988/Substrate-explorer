FROM node:18-alpine

WORKDIR /app

# Copy package files from backend context
COPY package*.json ./
COPY yarn.lock ./

# Copy source code
COPY src/ ./src/
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Build the application
RUN yarn build

# Remove devDependencies to reduce image size
RUN yarn install --frozen-lockfile --production

# Expose port
EXPOSE 3001

# Start the application using the compiled JavaScript
CMD ["yarn", "start:prod"]
