# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:1.25-alpine
LABEL org.opencontainers.image.description="OlivePro frontend (Vite + React)"

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a small nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add entrypoint to substitute runtime env into a JS file
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 5173 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx","-g","daemon off;"]

