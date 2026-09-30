const fs = require("fs");
const readline = require("readline");

// Remove acentos, mas preserva o ç
function normalizar(str) {
  return str
    .replace(/ç/g, "__CEDILHA__")
    .replace(/Ç/g, "__CEDILHA_MAIUSCULA__")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/__CEDILHA__/g, "ç")
    .replace(/__CEDILHA_MAIUSCULA__/g, "Ç")
    .normalize("NFC");
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Digite as letras disponíveis: ", (entradaLetras) => {
  rl.question("Digite a letra obrigatória: ", (entradaObrigatoria) => {
    const LETRAS = new Set(entradaLetras.trim().toLowerCase());
    const OBRIGATORIA = entradaObrigatoria.trim().toLowerCase();
    const MIN_LENGTH = 4;

    if (!LETRAS.has(OBRIGATORIA)) {
      console.log(
        "Erro: a letra obrigatória precisa estar entre as letras disponíveis."
      );

      rl.close();
      return;
    }

    const palavras = fs
      .readFileSync("dicionario.txt", "utf8")
      .split(/\r?\n/)
      .slice(1)
      .map((linha) => linha.split("/")[0])
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);

    const validas = [];
    const vistas = new Set();

    for (const original of palavras) {
      if (vistas.has(original)) continue;

      vistas.add(original);

      const palavra = normalizar(original);

      if (palavra.length < MIN_LENGTH) continue;
      if (!palavra.includes(OBRIGATORIA)) continue;

      if ([...palavra].every((letra) => LETRAS.has(letra))) {
        validas.push(original);
      }
    }

    // Agrupa palavras que são iguais após a remoção dos acentos
    const grupos = new Map();

    for (const palavra of validas) {
      const chave = normalizar(palavra);

      if (!grupos.has(chave)) {
        grupos.set(chave, []);
      }

      grupos.get(chave).push(palavra);
    }

    // Ordena os grupos por tamanho e depois alfabeticamente
    const gruposOrdenados = [...grupos.entries()].sort(
      ([chaveA], [chaveB]) => {
        if (chaveA.length !== chaveB.length) {
          return chaveA.length - chaveB.length;
        }

        return chaveA.localeCompare(chaveB, "pt-BR");
      }
    );

    // Agrupa os grupos por tamanho
    const gruposPorTamanho = new Map();

    for (const [chave, palavrasGrupo] of gruposOrdenados) {
      const tamanho = chave.length;

      if (!gruposPorTamanho.has(tamanho)) {
        gruposPorTamanho.set(tamanho, []);
      }

      gruposPorTamanho.get(tamanho).push(palavrasGrupo);
    }

    for (const [tamanho, gruposDoTamanho] of gruposPorTamanho) {
      console.log(
        `\n=== Palavras com ${tamanho} letras (${gruposDoTamanho.length}) ===\n`
      );

      for (const grupo of gruposDoTamanho) {
        console.log(grupo.join("/"));
      }
    }

    // Cada grupo conta como uma única palavra
    console.log(`\nTotal de palavras: ${grupos.size}`);

    rl.close();
  });
});