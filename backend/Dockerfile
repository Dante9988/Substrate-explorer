FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN npm install -g yarn
RUN yarn install 

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Expose port
EXPOSE 3001

# Start the application
CMD ["yarn", "start"]
