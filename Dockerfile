# ===== STAGE 1: Builder =====
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json ./

# Instalar dependencias (incluyendo devDependencies para el build)
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar TypeScript a JavaScript
RUN npm run build

# ===== STAGE 2: Production =====
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copiar package files
COPY package.json package-lock.json ./

# Instalar solo dependencias de producción
RUN npm ci --production && npm cache clean --force

# Copiar el código compilado desde el builder
COPY --from=builder /app/dist ./dist

# Exponer puerto 4500
EXPOSE 4500

# Comando para iniciar la aplicación
CMD ["node", "dist/main.js"]
