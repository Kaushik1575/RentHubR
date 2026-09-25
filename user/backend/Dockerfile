# Use an official lightweight Node.js runtime as the base image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency files first to take advantage of Docker layer caching
COPY package*.json ./

# Install project dependencies
RUN npm install --omit=dev

# Copy the rest of the backend application code
COPY . .

# Ensure the uploads directory exists
RUN mkdir -p uploads

# Define default environment variables
ENV PORT=3005
ENV NODE_ENV=production
ENV RENDER=true

# Expose backend port
EXPOSE 3005

# Command to run the server
CMD ["node", "server-supabase.js"]
