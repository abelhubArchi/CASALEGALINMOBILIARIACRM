# Etapa 1: Build de la aplicación SvelteKit
FROM node:20-slim AS builder

WORKDIR /app

# Copiar manifiestos de paquetes
COPY package*.json ./

# Instalar dependencias para compilar
RUN npm ci

# Copiar el código fuente completo
COPY . .

# Aumentar límite de memoria de Node para la compilación
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_ENV=production
RUN npm run build

# Dejar únicamente dependencias de producción
RUN npm prune --omit=dev

# Etapa 2: Contenedor ligero de ejecución para Cloud Run
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

# Exponer puerto para Cloud Run
EXPOSE 8080

# Iniciar servidor Node.js
CMD ["node", "build"]

