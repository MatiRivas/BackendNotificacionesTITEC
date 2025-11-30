# ===== STAGE 1: Builder =====
FROM node:18-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Compilar frontend (genera /dist)
RUN pnpm build

# ===== STAGE 2: Producción =====
FROM nginx:alpine

# Copiar archivos compilados al root del servidor web
COPY --from=build /app/dist /usr/share/nginx/html

# Puerto interno del nginx del frontend
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]