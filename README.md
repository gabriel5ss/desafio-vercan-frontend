# vercan — Frontend

Frontend em Nuxt 4, com **Nuxt UI** (`@nuxt/ui`) para componentes e **Tailwind
CSS 4** para estilos. O backend Laravel fica no projeto irmão
`desafio-vercan-backend`.

Backend: https://github.com/gabriel5ss/desafio-vercan-backend

## Docker

Pré-requisitos: Docker Engine e Docker Compose.

Na pasta deste projeto, copie o ambiente local e inicie o frontend e o backend.
Os arquivos gerados pelo Laravel usam por padrão UID/GID `1000`. Se seu usuário
tiver outros valores, informe-os ao iniciar:

```bash
cp .env.example .env.local
HOST_UID=$(id -u) HOST_GID=$(id -g) docker compose --env-file .env.local up --build
```

Acesse:

- Frontend: http://localhost:3000
- API: http://localhost:8089

O frontend escuta na porta `3000` do container e o Compose a publica em
`3000` no host (`3000:3000`). O backend de desenvolvimento escuta em `8000` no
container e é publicado em `8089` no host (`8089:8000`). A URL pública usada
pelo navegador vem de `NUXT_PUBLIC_API_BASE` em `.env.local`; mantenha-a
apontando para a porta publicada do backend, sem acrescentar `/api`.

Se trocar somente uma porta do host, altere o valor à esquerda do mapeamento no
`docker-compose.yml` e atualize `NUXT_PUBLIC_API_BASE` para a porta publicada da
API. A porta interna do backend é `8000` nesta configuração integrada. O
Compose standalone do backend usa `8089:8089`; como ambos publicam `8089` no
host, não inicie os dois Composes ao mesmo tempo sem mudar uma das portas do
host.

O Compose também inicia o MySQL e persiste os dados no volume `mysql_data`.

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

Na pasta deste projeto, copie o exemplo para o ambiente local:

```bash
cp .env.example .env.local
npm ci
npm run dev
```

O frontend fica disponível em http://localhost:3000 e usa a API em
`http://localhost:8089` por padrão. Ajuste `NUXT_PUBLIC_API_BASE` em
`.env.local` para usar outro endereço. Informe a URL raiz do backend, sem `/api`,
pois os caminhos da API já incluem esse prefixo.

Se mudar a porta local do backend, atualize `NUXT_PUBLIC_API_BASE` para a nova
porta acessível pelo navegador.

### Cloudflare

Configure `NUXT_PUBLIC_API_BASE` nas variáveis de ambiente do projeto Cloudflare,
com o endereço público do backend. Defina o valor para produção e para previews
conforme os respectivos ambientes. O frontend lê essa variável do runtime config
público do Nuxt, então não é necessário alterar URLs no código ao trocar o host
do backend. Se o projeto for publicado como site estático, altere a variável e
faça um novo build/deploy para incorporá-la ao frontend.

Para builds locais, use `npm run build:local` com `.env.local` ou crie
`.env.production` a partir de `.env.production.example` e use
`npm run build:production`. O deploy do Cloudflare usa `npm run build` e recebe a
URL pelas variáveis configuradas no painel.

## Comandos úteis

```bash
npm run test
npm run lint
npm run build
```

## Hooks locais do Git

Para executar os testes e o lint antes de cada commit, ative o hook uma vez:

```bash
./scripts/install-git-hooks.sh
```

O hook usa as dependências instaladas pelo `npm ci`.
