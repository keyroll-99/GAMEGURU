# Frontend Dockerfile
FROM node:22.18.0-alpine

WORKDIR /app

# Instalacja zależności
COPY package*.json ./
RUN npm install

# Kopiowanie kodu źródłowego
COPY . .

# Expose port
EXPOSE 5173

# Start development server z dostępem z zewnątrz
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
