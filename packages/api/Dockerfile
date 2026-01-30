# packages/api/Dockerfile

# 1. Usamos una imagen ligera de Node.js (Versión LTS Alpine)
FROM node:20-alpine

# 2. Instalamos OpenSSL, necesario para que Prisma funcione en Alpine Linux
RUN apk add --no-cache openssl

# 3. Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# 4. Copiamos los archivos de dependencias primero (para aprovechar la caché de Docker)
COPY package*.json ./
# Nota: Si usas Prisma, copiamos la carpeta prisma para generar el cliente
COPY prisma ./prisma/

# 5. Instalamos las dependencias
RUN npm install --legacy-peer-deps

# 6. Generamos el cliente de Prisma
RUN npx prisma generate

# 7. Copiamos el resto del código (aunque usaremos volúmenes, esto es buena práctica)
COPY . .

# 8. Compilamos el proyecto TypeScript
RUN npm run build

# 9. Exponemos el puerto donde corre tu API (ajusta si usas otro, ej: 3001)
EXPOSE 3001

# 10. Comando por defecto: arrancar en modo producción
CMD ["npm", "start"]