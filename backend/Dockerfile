FROM node:18-alpine

WORKDIR /app

# Copy backend package files only
COPY backend/package*.json ./
COPY backend/yarn.lock ./

# Install ALL dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile

# Copy backend source code only (not the entire project)
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
