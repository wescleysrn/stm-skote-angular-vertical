# Skote - Angular Responsive Admin Dashboard Template

Projeto Angular conteinerizado com suporte a builds otimizados via Docker e implantação facilitada utilizando Docker Compose.

---

## 🚀 Desenvolvimento Local (Sem Docker)

### Servidor de Desenvolvimento

Execute o comando abaixo para iniciar o servidor local de desenvolvimento:

```bash
npm run start
# Ou diretamente via Angular CLI:
# ng serve
```

Acesse http://localhost:4200/ no navegador. A aplicação será recarregada automaticamente a cada alteração no código.

Gerando Componentes

```bash
ng generate component nome-do-componente
```

Testes Unitários e E2E

```bash
# Testes Unitários
npm run test

# Testes End-to-End
npm run e2e
```

## 🐳 Conteinerização & Docker

Este projeto utiliza Multi-Stage Builds com Nginx Alpine para garantir uma imagem final leve, rápida e segura.

Nota: Nas instruções abaixo, substitua seu-usuario pelo seu nome de usuário no Docker Hub.

1. Build da Imagem Docker
Para construir a imagem Docker localmente:

```bash
docker build -t seu-usuario/skote-angular-vertical:latest .
```

2. Autenticação e Publicação no Docker Hub (PAT)
A. Gerando um Personal Access Token (PAT)
Acesse sua conta no Docker Hub.

Vá em Account Settings -> Security -> Personal Access Tokens.

Clique em Generate new token, defina uma descrição (ex: cli-access) e defina as permissões (Read, Write, Delete).

Copie e guarde o token gerado com segurança.

B. Autenticação via CLI
Execute o comando abaixo e insira o seu PAT gerado como senha:

```bash
docker login -u seu-usuario
```

C. Publicando a Imagem
Após a autenticação, envie a imagem compilada para o Docker Hub:

```bash
docker push seu-usuario/skote-angular-vertical:latest
```

3. Baixando e Executando a Imagem em Outro Ambiente
Para obter e rodar a imagem a partir do repositório remoto sem utilizar Docker Compose:

```bash
# 1. Faça o pull da imagem do Docker Hub
docker pull seu-usuario/skote-angular-vertical:latest

# 2. Execute o container mapeando a porta 80
docker run -d --name skote_angular_app -p 4200:80 seu-usuario/skote-angular-vertical:latest
```

4. Execução via Docker Compose (Recomendado)
A forma mais prática e robusta para executar em produção ou homologação é utilizando o Docker Compose.

A. Iniciar a Aplicação
O Docker Compose fará o download da imagem (se necessário) e iniciará o container em segundo plano:

```bash
docker compose up -d
```

B. Atualizar para a Versão Mais Recente
Para garantir que está rodando a imagem atualizada disponível no Docker Hub:

```bash
# Baixa a imagem mais recente do registro
docker compose pull

# Recria os containers com a nova imagem sem downtime perceptível
docker compose up -d --remove-orphans
```

C. Visualizar Logs

```bash
docker compose logs -f web
```

D. Parar e Remover os Containers

```bash
docker compose down
```

## 🛠️ Tecnologias Utilizadas

Framework: Angular 17

Servidor Web: Nginx (Alpine)

Conteinerização: Docker & Docker Compose
