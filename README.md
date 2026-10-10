# Verkan — Frontend

Frontend em Nuxt 4. O backend Laravel fica no projeto irmão `desafio-vercan-backend`.

## Docker

Pré-requisitos: Docker Engine e Docker Compose.

Na pasta deste projeto, inicie o frontend e o backend:

```bash
docker compose up --build
```

Acesse:

- Frontend: http://localhost:3000
- API: http://localhost:8000

Para criar o usuário e carregar estados e cidades, em outro terminal execute:

```bash
docker compose exec backend php artisan db:seed
```

O seeder de estados e cidades consulta o IBGE e precisa de acesso à internet.
Usuário de demonstração: `teste@desafio.com` / `password`.

Encerre com `Ctrl+C` e remova os containers com `docker compose down`. Para
apagar também os dados persistidos, use `docker compose down -v`.

## Execução manual

Pré-requisitos: Node.js 24 ou superior, npm, PHP e Composer. Inicie o backend
conforme o README do projeto `desafio-vercan-backend`.

Na pasta deste projeto:

```bash
npm ci
npm run dev
```

O frontend fica disponível em http://localhost:3000 e usa a API em
`http://localhost:8000` por padrão. Configure `NUXT_PUBLIC_API_BASE` se a API
estiver em outro endereço.

## Comandos úteis

```bash
npm run test
npm run lint
npm run build
```
