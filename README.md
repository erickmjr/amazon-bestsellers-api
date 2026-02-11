# Amazon Bestsellers API

API HTTP que expõe o **Top 3 de produtos por categoria** da página de mais vendidos da Amazon Brasil.

Os dados são servidos a partir do **último snapshot** persistido no DynamoDB (não é consulta em tempo real).

Stack: Node.js + TypeScript, AWS Lambda + API Gateway (HTTP API), DynamoDB, Serverless Framework e Puppeteer (scraper local).

## Base URL (prod)

https://ycnxze6fzj.execute-api.sa-east-1.amazonaws.com

## Consumo da API (Postman)

Endpoints públicos (sem autenticação):

- GET - https://ycnxze6fzj.execute-api.sa-east-1.amazonaws.com/health
- GET - https://ycnxze6fzj.execute-api.sa-east-1.amazonaws.com/bestsellers
- GET - https://ycnxze6fzj.execute-api.sa-east-1.amazonaws.com/bestsellers/{category}
  - Exemplo: https://ycnxze6fzj.execute-api.sa-east-1.amazonaws.com/bestsellers/moda
- GET - https://ycnxze6fzj.execute-api.sa-east-1.amazonaws.com/bestsellers/first-top
- GET - https://ycnxze6fzj.execute-api.sa-east-1.amazonaws.com/bestsellers/overview

## Códigos de resposta

- `GET /health`
  - `200` — `{ "status": "ok" }`

- `GET /bestsellers`
  - `200` — retorna o snapshot completo
  - `204` — ainda não há snapshot salvo (`{ "message": "No content yet, run scraper." }`)

- `GET /bestsellers/{category}`
  - `200` — retorna somente a categoria solicitada
  - `404` — categoria não encontrada no snapshot (`{ "message": "Not found." }`)

- `GET /bestsellers/first-top`
  - `200` — retorna somente a primeira categoria do snapshot
  - `404` — snapshot não encontrado (`{ "message": "Not found." }`)

- `GET /bestsellers/overview`
  - `200` — retorna um resumo agregado do snapshot
  - `204` — ainda não há snapshot salvo (`{ "message": "No content yet, run scraper." }`)

## Exemplo de resposta

Exemplo resumido (campos principais) do `GET /bestsellers`:

```json
{
  "sourceUrl": "https://www.amazon.com.br/bestsellers",
  "updatedAt": "<ISO_DATETIME>",
  "categoryOrder": ["moda"],
  "categories": {
    "moda": [{ "rank": 1, "title": "Produto...", "href": "https://www.amazon.com.br/..." }]
  }
}
```

Exemplo resumido (campos principais) do `GET /bestsellers/overview`:

```json
{
  "categoryOrder": ["moda"],
  "updatedAt": "<ISO_DATETIME>",
  "totalProducts": 12,
  "stars": { "lower": 3.2, "higher": 4.9, "avg": 4.2, "sum": 50.4 },
  "price": { "lower": 12.9, "higher": 199.9, "avg": 78.3, "sum": 939.6 },
  "reviews": { "lower": 1, "higher": 5234, "avg": 802.5, "sum": 9630 }
}
```

## Modelo de dados

### Product

Campos obrigatórios:

- `rank` (number)
- `title` (string)
- `href` (string)

Campos opcionais (quando disponíveis no scrape):

- `image` (string)
- `category` (string)
- `price` (`{ raw?: string, value?: number, currency?: string }`)
- `rating` (`{ stars?: number, reviewsCount?: number, rawStarsText?: string }`)

### Categorias (slugs)

Os slugs são gerados a partir do título da categoria (sem acento, minúsculo e com hífens).
Exemplos: `cozinha`, `moda`, `moveis`, `alimentos-e-bebidas`, `ferramentas-e-materiais-de-construcao`, `esporte`.

### Overview

Campos principais do `GET /bestsellers/overview`:

- `categoryOrder` (string[])
- `updatedAt` (string ISO)
- `totalProducts` (number)
- `stars` (`{ lower: number | null, higher: number | null, avg: number | null, sum: number }`)
- `price` (`{ lower: number | null, higher: number | null, avg: number | null, sum: number }`)
- `reviews` (`{ lower: number | null, higher: number | null, avg: number | null, sum: number }`)

## Atualização dos dados (via scraper local)

> Esta seção é para o mantenedor atualizar o snapshot. Para somente consumir a API, não é necessário.

Se a API estiver retornando `204` no `GET /bestsellers`, rode o scraper localmente para coletar os dados e popular o DynamoDB.

### 1) Configuração

Pré-requisitos:

- Node.js 18+
- `.env` (baseado em `.env.example`) com:
  - `INTERNAL_API_KEY=...`
  - `REFRESH_URL=https://ycnxze6fzj.execute-api.sa-east-1.amazonaws.com/internal/bestsellers/refresh`

### 2) Executar o scraper

- `npm install`
- `npm run scrape`

### Endpoint interno do refresh

- POST - https://ycnxze6fzj.execute-api.sa-east-1.amazonaws.com/internal/bestsellers/refresh
  - Header obrigatório: `x-api-key: <INTERNAL_API_KEY>`

Payload:

- `categoryOrder`: string[] (ordem das categorias)
- `categories`: objeto `{ [slug]: Product[] }`

Exemplo:

```json
{
  "categoryOrder": ["moda"],
  "categories": {
    "moda": [
      { "rank": 1, "title": "Produto...", "href": "https://www.amazon.com.br/..." }
    ]
  }
}
```

## Visão técnica (arquitetura e decisões)

### Stack

- Node.js 18 + TypeScript
- AWS Lambda + API Gateway (HTTP API)
- DynamoDB
- Serverless Framework v3 + `serverless-esbuild`
- Puppeteer (scraper local)
- AWS SDK v3 (DynamoDB)

### Arquitetura do código

- `src/handlers`: entrypoints das Lambdas (rotas do HTTP API)
- `src/controllers`: validação de entrada, tratamento de erros e respostas HTTP
- `src/services`: regras de negócio
- `src/repositories`: acesso ao DynamoDB (Get/Put do snapshot)
- `src/scripts`: execução do scraper local (Puppeteer)

### Infra (Serverless + DynamoDB)

- Rotas HTTP, funções e tabela DynamoDB são definidas em `serverless.yml`.
- Tabela por stage (`amazon-bestsellers-api-bestsellers-<stage>`), com um item `latest`:
  - `pk`: `source#amazon`
  - `sk`: `latest`
  - `categories`, `categoryOrder`, `sourceUrl`, `updatedAt`
- O segredo `INTERNAL_API_KEY` é injetado via env (`useDotenv: true`) e protege o endpoint interno de refresh.

### Decisões técnicas

- Endpoint interno de ingestão (`POST /internal/bestsellers/refresh`) separado dos endpoints públicos de leitura.
- Persistência de `categoryOrder`: o DynamoDB não garante ordem de mapas, categoryOrder preserva a ordem do site.
- Scraper fora da AWS por design e para evitar rodar Chromium dentro da Lambda.
