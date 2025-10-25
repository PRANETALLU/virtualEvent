# Stage 1: Build Stage (optional for TypeScript)
FROM node:20 AS build

# Set working directory
WORKDIR /server

# Copy package files first (allows caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# If using TypeScript, build it
# RUN npm run build

# Stage 2: Production Stage
FROM node:20

# Set working directory
WORKDIR /server

# Copy everything from the build stage
COPY --from=build /server /server

# Expose the port your server uses
EXPOSE 5000

# Start the backend server
CMD ["node", "src/index.js"]  # replace with your entry file if different
