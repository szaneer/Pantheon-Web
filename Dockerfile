# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Set build-time environment variables
ARG VITE_SIGNALING_SERVER_URL=http://localhost:3001
ARG VITE_AUTH_KEY=pantheon

# Build the application
RUN VITE_SIGNALING_SERVER_URL=$VITE_SIGNALING_SERVER_URL VITE_AUTH_KEY=$VITE_AUTH_KEY npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]