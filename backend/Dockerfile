# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Instalacja zależności
COPY package*.json ./
RUN npm install

# Kopiowanie kodu źródłowego
COPY . .

# Generowanie Prisma Client
RUN npx prisma generate || true

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "start:dev"]
