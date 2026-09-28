// =========================================================
// BOLETIM DIGITAL - 8º ANO (REGRAS E DADOS)
// =========================================================

// Dados brutos das 15 disciplinas do 8º Ano (Array de Objetos)
const dadosDisciplinas = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// Função para normalizar qualquer formato de nota para a escala 0 a 10
function normalizarNota(valor) {
  // Se for nulo, indefinido ou texto vazio -> nota ainda não lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Se o valor estiver em texto com vírgula, substitui por ponto (ex: "7,8" -> "7.8")
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }

  // Converte para número decimal
  let num = parseFloat(valor);

  // Se não for um número válido
  if (isNaN(num)) {
    return null;
  }

  // Se o valor estiver entre 0 e 10
  if (num >= 0 && num <= 10) {
    return num;
  }

  // Se for maior que 10 e menor ou igual a 100, divide por 10 (ex: 82 -> 8.2; 100 -> 10.0)
  if (num > 10 && num <= 100) {
    return num / 10;
  }

  // Valores fora dessas regras são inválidos
  return null;
}

// Função para formatar a exibição da nota na tabela
function formatarExibicaoNota(nota) {
  if (nota === null) {
    return "—";
  }
  return nota.toFixed(1).replace(".", ",");
}

// Função principal que processa os dados e desenha a página
function carregarBoletim() {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = ""; // Limpa a tabela

  let somaMediasGerais = 0;
  let totalDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBomDesempenho = 0;
  let qtdAtencao = 0;

  // Percorre todas as 15 disciplinas
  dadosDisciplinas.forEach((item) => {
    // Normaliza as notas dos 3 trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Calcula a média considerando apenas notas disponíveis
    let somaNotas = 0;
    let qtdNotasValidas = 0;

    if (n1 !== null) { somaNotas += n1; qtdNotasValidas++; }
    if (n2 !== null) { somaNotas += n2; qtdNotasValidas++; }
    if (n3 !== null) { somaNotas += n3; qtdNotasValidas++; }

    let mediaDisciplina = null;
    let situacao = "Nota ainda não disponível";
    let classeSituacao = "status-indisponivel";

    if (qtdNotasValidas > 0) {
      mediaDisciplina = somaNotas / qtdNotasValidas;
      somaMediasGerais += mediaDisciplina;
      totalDisciplinasComMedia++;

      if (mediaDisciplina >= 6.0) {
        situacao = "Bom desempenho";
        classeSituacao = "status-bom";
        qtdBomDesempenho++;
      } else {
        situacao = "Atenção";
        classeSituacao = "status-atencao";
        qtdAtencao++;
      }
    }

    // Soma as faltas da disciplina
    const totalFaltasDisciplina = item.faltas.reduce((acc, f) => acc + f, 0);
    totalFaltasGeral += totalFaltasDisciplina;

    // Cria a linha HTML da disciplina na tabela
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${formatarExibicaoNota(n1)}</td>
      <td>${formatarExibicaoNota(n2)}</td>
      <td>${formatarExibicaoNota(n3)}</td>
      <td><strong>${formatarExibicaoNota(mediaDisciplina)}</strong></td>
      <td>${totalFaltasDisciplina}</td>
      <td class="${classeSituacao}">${situacao}</td>
    `;
    tabelaCorpo.appendChild(tr);
  });

  // Atualiza os cards de resumo no topo
  const mediaGeralGlobal = totalDisciplinasComMedia > 0 ? (somaMediasGerais / totalDisciplinasComMedia).toFixed(1).replace(".", ",") : "—";
  
  document.getElementById("card-media").textContent = mediaGeralGlobal;
  document.getElementById("card-faltas").textContent = totalFaltasGeral;
  document.getElementById("card-bom").textContent = qtdBomDesempenho;
  document.getElementById("card-atencao").textContent = qtdAtencao;

  // NOTA: O percentual de 92% exibido no card de frequência é APENAS DEMONSTRATIVO/FICTÍCIO nesta etapa
  // e será substituído por um cálculo dinâmico no futuro.
}

// Executa a função assim que a página é carregada
document.addEventListener("DOMContentLoaded", carregarBoletim);