# packages/web/Dockerfile

FROM node:20-alpine

WORKDIR /app

# Copiamos dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

COPY . .

# El puerto por defecto de Astro es 4321
EXPOSE 4321

# IMPORTANTE: Agregamos --host 0.0.0.0 para que sea accesible desde fuera del contenedor
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]