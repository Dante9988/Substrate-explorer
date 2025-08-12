FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install ALL dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application (this will create dist/ folder)
RUN yarn build

# Remove devDependencies to reduce image size
RUN yarn install --frozen-lockfile --production

# Expose port
EXPOSE 3001

# Start the application using the compiled JavaScript
CMD ["yarn", "start:prod"]
