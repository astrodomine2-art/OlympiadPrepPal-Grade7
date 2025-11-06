# Stage 1: Build the application
# Use an official Node.js runtime as a parent image. We use a specific version for reproducibility.
FROM node:20-slim as builder

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json to leverage Docker's layer caching.
# Dependencies are only re-installed if this file changes.
COPY package.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application source code into the container
COPY . .

# Stage 2: Create the final production image
# Start from a fresh, slim Node.js image for a smaller final container size
FROM node:20-slim

# Set the working directory
WORKDIR /usr/src/app

# Create a non-root user and switch to it for better security
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser
USER appuser

# Copy installed dependencies and application code from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app .

# Expose the port the app runs on. Cloud Run will send requests to this port.
EXPOSE 8080

# Define the command to run your app.
# This will execute `node main.js` when the container starts.
CMD ["node", "main.js"]
