# ==============================================================================
# ETAPA 1: Build da Aplicação
# ==============================================================================
FROM node:20-alpine AS build

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia primeiro apenas os arquivos de dependências.
# Isso garante que a camada de cache do Docker só seja descartada quando dependências mudarem.
COPY package*.json ./

# Instala todas as dependências necessárias para a compilação.
# A flag '--legacy-peer-deps' evita falhas com conflitos estritos de versão de pacotes legados.
RUN npm ci --legacy-peer-deps

# Copia todo o código-fonte para dentro do container
COPY . .

# Executa a compilação do Angular para produção.
# Usamos o comando "build-prod" definido no seu package.json, elevando o limite de memória do Node.
RUN npm run build-prod

# ==============================================================================
# ETAPA 2: Imagem de Execução/Produção
# ==============================================================================
FROM nginx:alpine

# Remove a página padrão do Nginx para evitar conflitos ou exposição desnecessária
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos compilados da etapa anterior para o diretório público do Nginx.
# Observação: Ajuste 'dist/skote' se o 'angular.json' gerar a saída em outro subdiretório.
COPY --from=build /app/dist/skote /usr/share/nginx/html

# Copia uma configuração customizada do Nginx para suportar o roteamento do Angular (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80 onde o Nginx estará escutando
EXPOSE 80

# Inicia o servidor Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
