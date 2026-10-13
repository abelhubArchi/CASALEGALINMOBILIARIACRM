# Etapa 1: Build de la aplicación SvelteKit
FROM node:20-slim AS builder

WORKDIR /app

# Copiar manifiestos de paquetes
COPY package*.json ./

# Instalar dependencias para compilar
RUN npm ci

# Copiar el código fuente completo
COPY . .

# Compilar proyecto con @sveltejs/adapter-node
ENV NODE_ENV=production
RUN npm run build

# Etapa 2: Contenedor ligero de ejecución para Cloud Run
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Copiar manifiesto e instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar build generado
COPY --from=builder /app/build ./build

# Exponer puerto para Cloud Run
EXPOSE 8080

# Iniciar servidor Node.js
CMD ["node", "build"]
