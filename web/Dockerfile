# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Argumento de build para VITE_API_URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build para produção
# VITE_API_URL será injetado via build arg
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

