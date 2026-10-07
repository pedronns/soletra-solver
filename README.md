# Soletra Helper

Aplicação web para encontrar palavras possíveis no jogo Soletra, do G1, e API para manter o dicionário e o status conhecido de cada palavra. O frontend Next.js está em [`frontend/`](./frontend/) e o backend NestJS independente em [`backend/`](./backend/).

O backend considera `ACCEPTED` e `REJECTED` como o conhecimento atual sobre a aceitação da palavra pelo jogo. `NULL` significa que ela ainda não foi classificada. A presença no dicionário não implica aceitação pelo Soletra.

## Requisitos

- Node.js 20.19 ou superior e npm.
- PostgreSQL 17 ou superior. Docker e Docker Compose são opcionais para executar o banco localmente.

## Instalação e configuração

Na raiz do repositório, instale as dependências dos dois projetos:

```bash
npm --prefix frontend install
npm --prefix backend install
```

Crie `backend/.env` copiando [`backend/.env.example`](./backend/.env.example) e substitua `REPLACE_ME` por uma senha forte. O mesmo arquivo contém as variáveis usadas pelo Docker Compose:

```env
DATABASE_URL="postgresql://soletra:REPLACE_ME@localhost:5432/soletra?schema=public"
PORT=3001
FRONTEND_ORIGINS="http://localhost:3000"
POSTGRES_DB=soletra
POSTGRES_USER=soletra
POSTGRES_PASSWORD=REPLACE_ME
```

`FRONTEND_ORIGINS` aceita uma lista de origens separadas por vírgula. Se omitida, o CORS permite `http://localhost:3000`. Não exponha credenciais reais em arquivos versionados.

Opcionalmente, crie `frontend/.env.local` copiando [`frontend/.env.example`](./frontend/.env.example) para configurar `NEXT_PUBLIC_BACKEND_URL`. O padrão é `http://localhost:3001`.

## PostgreSQL local

Com Docker Compose instalado:

```bash
docker compose --env-file backend/.env up -d
```

O serviço cria um banco PostgreSQL configurado pelas variáveis do arquivo `.env` e persiste os dados no volume `soletra-postgres-data`.

## Migrations e importação do dicionário

Execute os comandos a partir da raiz do repositório:

```bash
npm --prefix backend run prisma:migrate:dev -- --name create_words
npm --prefix backend run import:dictionary
```

A migration cria a tabela `Word` e a restrição única sobre `word`. O importador lê `frontend/lib/dicionario.txt` em streaming e insere em lotes de 1.000 palavras. Linhas vazias são ignoradas; duplicatas são descartadas pelo PostgreSQL. A operação usa inserção `ON CONFLICT DO NOTHING` via `createMany({ skipDuplicates: true })`, sem atualizar palavras já existentes ou substituir seus status, portanto pode ser executada novamente com segurança.

Opcionalmente, defina `DICTIONARY_PATH` em `backend/.env` para importar outro arquivo UTF-8.

## Executar

Desenvolvimento do backend, com recarga automática:

```bash
npm --prefix backend run start:dev
```

A API estará em `http://localhost:3001`. Importe o dicionário antes de classificar palavras. Para iniciar o frontend em outro terminal, use `npm --prefix frontend run dev`.

O frontend consulta `GET /words?words=...` para carregar as classificações das palavras exibidas e usa `PATCH /words/:word` com `ACCEPTED`, `REJECTED` ou `null` ao confirmar, rejeitar ou remover uma classificação. As alterações são atualizadas imediatamente na interface e persistidas no backend.

O formulário no painel de resultados envia novas palavras para `POST /words`. O backend valida e normaliza a entrada e salva no mesmo modelo `Word`; palavras adicionadas ficam disponíveis nas buscas e são recarregadas pela rota `GET /words/added`, inclusive em sessões futuras.

Build e execução de produção:

```bash
npm --prefix backend run build
npm --prefix backend run prisma:migrate:deploy
npm --prefix backend run start:prod
```

Configure `DATABASE_URL`, `PORT` e `FRONTEND_ORIGINS` no ambiente de produção. O backend consulta exclusivamente o PostgreSQL em runtime; o arquivo de texto é usado apenas pelo comando de importação.

## API REST

As rotas abaixo são servidas pelo backend NestJS em `/words`. Entradas e palavras importadas são normalizadas com remoção de espaços nas extremidades, Unicode NFC e conversão para minúsculas independente de locale. Acentos e `ç` são preservados; por exemplo, `AÇÃO` e `ação` identificam a mesma entrada, enquanto `ação` e `acao` são distintas.

### Consultar uma palavra

```http
GET /words/abacaxi
```

Resposta `200`:

```json
{
  "word": "abacaxi",
  "status": null
}
```

Uma palavra que não existe no dicionário retorna `404 Not Found`; uma palavra existente sem classificação retorna `200` com `status: null`.

### Consultar várias palavras

```http
GET /words?words=abacaxi,abacate,abajur
```

Retorna as palavras encontradas no dicionário, incluindo as ainda não classificadas:

```json
[
  { "word": "abacaxi", "status": "ACCEPTED" },
  { "word": "abacate", "status": null }
]
```

Palavras inexistentes são omitidas desta resposta. O endpoint aceita até 500 palavras por chamada e consulta o banco em uma única operação.

### Listar palavras adicionadas pela interface

```http
GET /words/added
```

Retorna as palavras inseridas pelo formulário, no mesmo formato de consulta:

```json
[
  { "word": "pinhao", "status": null }
]
```

### Adicionar uma palavra

```http
POST /words
Content-Type: application/json

{
  "word": "pinhao",
  "letters": ["P", "I", "N", "H", "A", "O", "Q"],
  "requiredLetter": "A"
}
```

Resposta `201 Created`:

```json
{ "word": "pinhão", "status": null }
```

Palavras com menos de quatro letras, espaços internos, caracteres que não formem palavras, letras fora das sete letras selecionadas, ou sem a letra central são rejeitadas com `400 Bad Request`. A API valida as sete letras distintas e o uso da letra central informadas no pedido; duplicatas normalizadas retornam `409 Conflict`.

### Atualizar ou limpar a classificação

```http
PATCH /words/abacaxi
Content-Type: application/json

{ "status": "ACCEPTED" }
```

Valores válidos são `ACCEPTED`, `REJECTED` e `null`. Enviar `null` remove a classificação. Resposta `200`:

```json
{ "word": "abacaxi", "status": "ACCEPTED" }
```

Status fora desses valores, campos extras ou corpo inválido retornam `400 Bad Request`. Atualizar uma palavra que não existe no dicionário retorna `404 Not Found`.

## Testes

```bash
npm --prefix backend test
```

Os testes cobrem normalização, inserção em lotes sem perda de classificações, validação de status e operações de consulta e atualização. Eles usam doubles do Prisma e não precisam de uma conexão PostgreSQL.

## Organização do backend

```text
backend/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── scripts/
│   └── import-dictionary.ts
├── src/
│   ├── prisma/
│   └── words/
└── test/
```

O frontend existente ainda carrega seu dicionário por meio de sua rota Next.js. A API e a persistência descritas aqui ficam isoladas no backend para permitir integração do frontend separadamente, sem mudar o fluxo atual de busca.
