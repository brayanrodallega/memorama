# Dockerfile para Angular con SSR
FROM node:18-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar todas las dependencias (incluidas devDependencies para build)
RUN npm ci

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production

WORKDIR /app

# Copiar solo los archivos necesarios para producción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S angular -u 1001

# Cambiar ownership de los archivos
RUN chown -R angular:nodejs /app
USER angular

# Exponer puerto
EXPOSE 4000

# Comando para iniciar la aplicación
CMD ["node", "dist/memorama/server/server.mjs"] 