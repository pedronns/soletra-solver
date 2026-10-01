# Soletra Helper

Aplicação web que procura, no dicionário local, palavras formadas apenas pelas sete letras escolhidas para uma rodada do jogo Soletra. Cada palavra precisa conter também a letra obrigatória.

## Executar

Instale as dependências com `npm install` e inicie a aplicação com `npm run dev`.

## Regras de busca

A aplicação lê `lib/dicionario.txt` em UTF-8, considerando cada linha não vazia como uma palavra e removendo espaços ao redor. As palavras precisam ter pelo menos 4 caracteres, conter a letra obrigatória e usar somente as sete letras selecionadas. A comparação remove acentos e preserva `ç` como letra distinta de `c`.

Grafias que diferem apenas por acentuação são agrupadas. Os resultados são organizados por tamanho e exibidos em uma grade responsiva.