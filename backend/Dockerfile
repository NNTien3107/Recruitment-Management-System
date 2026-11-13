FROM node:22-slim

# openssl cho Prisma, procps để Nest tắt tiến trình cũ khi hot-reload
RUN apt-get update -y && apt-get install -y openssl procps && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["sh", "-c", "npx prisma generate && npm run start:dev"]