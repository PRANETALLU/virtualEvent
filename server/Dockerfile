# Use official Node.js LTS image
FROM node:20

# Set working directory
WORKDIR /server

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your source code
COPY . .

# Copy .env (optional, if using dotenv in code)
COPY .env ./

# Expose server port
EXPOSE 5000

# Start server
CMD ["node", "src/index.js"]
