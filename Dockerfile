# Dockerfile optimizado para producción (Backend Node.js)
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el código fuente y compilar TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Imagen final de producción
FROM node:20-alpine AS production

WORKDIR /app

# Copiar solo dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar los archivos compilados del builder
COPY --from=builder /app/dist ./dist

# Copiar carpeta public con el APK para descarga directa de Android
COPY public/ ./public/

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Exponer el puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
