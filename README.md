# Soletra

Ferramenta em Node.js que procura, no dicionário local, palavras formadas apenas pelas letras escolhidas para uma rodada do jogo Soletra. Cada palavra precisa conter também a letra obrigatória.

## Requisitos

- Node.js instalado.
- O arquivo `dicionario.txt` na raiz do projeto.

## Executar

No terminal, na pasta do projeto:

```bash
node index.js
```

Informe as letras disponíveis e, em seguida, a letra obrigatória. A letra obrigatória precisa estar entre as letras disponíveis; se não estiver, o programa informa o erro e encerra.

## Regras de busca

- As letras e palavras são convertidas para minúsculas.
- Cada palavra deve ter pelo menos 4 letras, conforme a regra do `g1.globo.com/jogos/soletra/`.
- Todas as letras da palavra devem estar entre as letras informadas.
- A palavra deve conter a letra obrigatória.
- Para validar as palavras do dicionário, os acentos são removidos, mas `ç` é preservado como uma letra diferente de `c`. Digite as letras disponíveis e a letra obrigatória sem acentos.
- Entradas repetidas no dicionário são descartadas.
- Os grupos de resultados são ordenados pelo tamanho e, em seguida, alfabeticamente em português. Grafias equivalentes após a remoção dos acentos ficam juntas, mantendo a grafia original do dicionário.

## Dicionário

O programa lê `dicionario.txt` como texto UTF-8, uma entrada por linha. A primeira linha é ignorada (normalmente contém a quantidade de entradas); nas linhas seguintes, qualquer conteúdo após `/` é tratado como flag e removido. Espaços em volta das entradas também são descartados.

Por exemplo, `abacate/SM` é lido como `abacate`. Mantenha o dicionário na raiz do projeto, pois o script procura o arquivo pelo caminho relativo `dicionario.txt`.

## Resultados

As palavras são exibidas em grupos pelo número de letras. Formas que ficam iguais após a remoção dos acentos aparecem juntas, separadas por `/`. O número no cabeçalho conta os grupos daquele tamanho, e o total final conta todos os grupos, não cada grafia individual.

```text
=== Palavras com 5 letras (1) ===

pônei

Total de palavras: 1
```