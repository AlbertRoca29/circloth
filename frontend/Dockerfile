# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install --legacy-peer-deps
RUN npm run build
# Add serve.json rewrite for /PrivacyPolicy
RUN echo '{\n  "rewrites": [\n    { "source": "/PrivacyPolicy", "destination": "/PrivacyPolicy.html" }\n  ]\n}' > /app/build/serve.json

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build
CMD ["serve", "-s", "build"]
