# ===== STAGE 1: Builder =====
FROM node:18 AS builder

WORKDIR /app

# Copiamos archivos de dependencias
COPY package.json package-lock.json ./
COPY tsconfig*.json ./

# Instalamos TODAS las dependencias (incluye dev)
RUN npm ci

# Copiamos el código fuente
COPY . .

# Compilamos Nest
RUN npm run build

# ===== STAGE 2: Production =====
FROM node:18

WORKDIR /app
ENV NODE_ENV=production

# Copiar archivos necesarios para instalar dependencias
COPY package.json package-lock.json ./

# Instalar dependencias de producción
RUN npm ci --production

# Copiar solo el build final desde el builder
COPY --from=builder /app/dist ./dist

# Exponer el puerto interno del backend
EXPOSE 3000

# Ejecutar la app Nest
CMD ["node", "dist/main.js"]