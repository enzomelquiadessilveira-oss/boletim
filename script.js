// =========================================================
// BOLETIM DIGITAL - 8º ANO (REGRAS, DADOS E API)
// =========================================================

// Configuração fixa do aluno
const CONFIG_ALUNO = {
  turma: "8B",
  numeroChamada: 10,
  apiUrl: "https://boletim-api.profbt.com.br"
};

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

// Estado da sessão em memória
let pinSessao = "";
let disciplinasAtuais = [];
let modoEdicao = false;

// Instâncias dos gráficos (Etapa 3)
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Função para normalizar qualquer formato de nota antiga para a escala 0 a 10
function normalizarNota(valor) {
  // Se for nulo, indefinido ou texto vazio -> nota ainda não lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Se o valor estiver em texto com vírgula, substitui por ponto (ex: "7,8" -> "7.8")
  if (typeof valor === "string") {
    valor = valor.trim().replace(",", ".");
  }

  // Converte para número decimal
  let num = Number(valor);

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

// Prepara lista de disciplinas convertendo notas antigas para a escala 0 a 10
function prepararDisciplinasLocais(lista) {
  return lista.map((item) => ({
    disciplina: item.disciplina,
    tri1: normalizarNota(item.tri1),
    tri2: normalizarNota(item.tri2),
    tri3: normalizarNota(item.tri3),
    faltas: Array.isArray(item.faltas) ? [...item.faltas] : [0, 0, 0]
  }));
}

// Função para formatar a exibição da nota na tabela
function formatarExibicaoNota(nota) {
  if (nota === null || nota === undefined) {
    return "—";
  }
  return nota.toFixed(1).replace(".", ",");
}

// Formata valor para preencher input de edição
function formatarParaInput(nota) {
  if (nota === null || nota === undefined) {
    return "";
  }
  return String(nota).replace(".", ",");
}

// Valida nota digitada pelo aluno no editor (aceita apenas 0 a 10 ou vazio)
function validarNotaEditor(texto) {
  const limpo = texto.trim();
  if (limpo === "") {
    return { valido: true, valor: null };
  }

  const comPonto = limpo.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(comPonto)) {
    return { valido: false, valor: null };
  }

  const num = Number(comPonto);
  if (isNaN(num) || num < 0 || num > 10) {
    return { valido: false, valor: null };
  }

  return { valido: true, valor: num };
}

// Valida falta digitada pelo aluno no editor (aceita apenas inteiro >= 0)
function validarFaltaEditor(texto) {
  const limpo = texto.trim();
  if (limpo === "" || !/^\d+$/.test(limpo)) {
    return { valido: false, valor: null };
  }

  const num = parseInt(limpo, 10);
  if (isNaN(num) || num < 0) {
    return { valido: false, valor: null };
  }

  return { valido: true, valor: num };
}

// Exibe mensagens de status na tela
function exibirMensagem(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = "status-msg";
  if (tipo) {
    elemento.classList.add(tipo);
  }
}

// Função principal que processa os dados e desenha a página
function carregarBoletim() {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = ""; // Limpa a tabela antes de reconstruir

  // Limpa os cards antes de recalcular
  document.getElementById("card-media").textContent = "—";
  document.getElementById("card-faltas").textContent = "—";
  document.getElementById("card-bom").textContent = "—";
  document.getElementById("card-atencao").textContent = "—";

  let somaMediasGerais = 0;
  let totalDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBomDesempenho = 0;
  let qtdAtencao = 0;

  // Percorre todas as disciplinas atuais
  disciplinasAtuais.forEach((item, index) => {
    const n1 = item.tri1;
    const n2 = item.tri2;
    const n3 = item.tri3;

    // Calcula a média considerando apenas notas disponíveis
    let somaNotas = 0;
    let qtdNotasValidas = 0;

    if (n1 !== null && n1 !== undefined) { somaNotas += n1; qtdNotasValidas++; }
    if (n2 !== null && n2 !== undefined) { somaNotas += n2; qtdNotasValidas++; }
    if (n3 !== null && n3 !== undefined) { somaNotas += n3; qtdNotasValidas++; }

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
    const faltasArr = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const totalFaltasDisciplina = faltasArr.reduce((acc, f) => acc + Number(f || 0), 0);
    totalFaltasGeral += totalFaltasDisciplina;

    // Cria a linha HTML usando DOM seguro (textContent)
    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    const strongNome = document.createElement("strong");
    strongNome.textContent = item.disciplina;
    tdNome.appendChild(strongNome);
    tr.appendChild(tdNome);

    if (!modoEdicao) {
      const tdTri1 = document.createElement("td");
      tdTri1.textContent = formatarExibicaoNota(n1);
      tr.appendChild(tdTri1);

      const tdTri2 = document.createElement("td");
      tdTri2.textContent = formatarExibicaoNota(n2);
      tr.appendChild(tdTri2);

      const tdTri3 = document.createElement("td");
      tdTri3.textContent = formatarExibicaoNota(n3);
      tr.appendChild(tdTri3);
    } else {
      [n1, n2, n3].forEach((notaAtual, triIdx) => {
        const tdTri = document.createElement("td");
        const inputNota = document.createElement("input");
        inputNota.type = "text";
        inputNota.className = "input-edit";
        inputNota.dataset.index = String(index);
        inputNota.dataset.campo = `tri${triIdx + 1}`;
        inputNota.value = formatarParaInput(notaAtual);
        inputNota.placeholder = "0-10";
        tdTri.appendChild(inputNota);
        tr.appendChild(tdTri);
      });
    }

    const tdMedia = document.createElement("td");
    const strongMedia = document.createElement("strong");
    strongMedia.textContent = formatarExibicaoNota(mediaDisciplina);
    tdMedia.appendChild(strongMedia);
    tr.appendChild(tdMedia);

    const tdFaltas = document.createElement("td");
    if (!modoEdicao) {
      tdFaltas.textContent = String(totalFaltasDisciplina);
    } else {
      const grupoFaltas = document.createElement("div");
      grupoFaltas.className = "faltas-edit-group";
      [0, 1, 2].forEach((fIdx) => {
        const inputFalta = document.createElement("input");
        inputFalta.type = "text";
        inputFalta.className = "input-edit";
        inputFalta.dataset.index = String(index);
        inputFalta.dataset.campo = `falta${fIdx + 1}`;
        inputFalta.value = String(faltasArr[fIdx] !== undefined ? faltasArr[fIdx] : 0);
        inputFalta.title = `Faltas ${fIdx + 1}º Tri`;
        grupoFaltas.appendChild(inputFalta);
      });
      tdFaltas.appendChild(grupoFaltas);
    }
    tr.appendChild(tdFaltas);

    const tdSituacao = document.createElement("td");
    tdSituacao.className = classeSituacao;
    tdSituacao.textContent = situacao;
    tr.appendChild(tdSituacao);

    tabelaCorpo.appendChild(tr);
  });

  // Atualiza os cards de resumo no topo
  const mediaGeralGlobal = totalDisciplinasComMedia > 0
    ? (somaMediasGerais / totalDisciplinasComMedia).toFixed(1).replace(".", ",")
    : "—";

  document.getElementById("card-media").textContent = mediaGeralGlobal;
  document.getElementById("card-faltas").textContent = String(totalFaltasGeral);
  document.getElementById("card-bom").textContent = String(qtdBomDesempenho);
  document.getElementById("card-atencao").textContent = String(qtdAtencao);

  // Atualiza os gráficos somente leitura com os dados atuais em memória
  atualizarGraficos();

  // NOTA: O percentual de 92% exibido no card de frequência é APENAS DEMONSTRATIVO/FICTÍCIO nesta etapa
  // e será substituído por um cálculo dinâmico no futuro.
}

// Envia requisição para abrir o boletim na API
async function abrirBoletim(event) {
  event.preventDefault();

  const inputPin = document.getElementById("input-pin");
  const msgLogin = document.getElementById("mensagem-login");
  const btnEntrar = document.getElementById("btn-entrar");
  const pinDigitado = inputPin.value.trim();

  if (!pinDigitado) {
    exibirMensagem(msgLogin, "Digite seu PIN para entrar.", "erro");
    return;
  }

  btnEntrar.disabled = true;
  exibirMensagem(msgLogin, "Conectando...", "info");

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      exibirMensagem(msgLogin, "Turma, chamada ou PIN inválidos.", "erro");
      btnEntrar.disabled = false;
      return;
    }

    if (resposta.status === 429) {
      exibirMensagem(msgLogin, "Muitas tentativas. Aguarde um minuto e tente novamente.", "erro");
      btnEntrar.disabled = false;
      return;
    }

    if (!resposta.ok) {
      exibirMensagem(msgLogin, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
      btnEntrar.disabled = false;
      return;
    }

    const resultado = await resposta.json();

    // Guarda PIN somente em memória e limpa o campo
    pinSessao = pinDigitado;
    inputPin.value = "";
    exibirMensagem(msgLogin, "", "");

    // Se dados não for null, usa exatamente os dados recebidos da API; caso contrário, usa os dados locais
    if (resultado && resultado.dados !== null && Array.isArray(resultado.dados.disciplinas)) {
      disciplinasAtuais = resultado.dados.disciplinas.map((d) => ({
        disciplina: String(d.disciplina || ""),
        tri1: d.tri1 !== undefined ? d.tri1 : null,
        tri2: d.tri2 !== undefined ? d.tri2 : null,
        tri3: d.tri3 !== undefined ? d.tri3 : null,
        faltas: Array.isArray(d.faltas) ? d.faltas.map((f) => Number(f || 0)) : [0, 0, 0]
      }));
    } else {
      disciplinasAtuais = prepararDisciplinasLocais(dadosDisciplinas);
    }

    document.getElementById("area-acesso").classList.add("hidden");
    document.getElementById("area-boletim").classList.remove("hidden");

    modoEdicao = false;
    atualizarBotoesEdicao();
    carregarBoletim();
  } catch (erro) {
    exibirMensagem(msgLogin, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
  } finally {
    btnEntrar.disabled = false;
  }
}

// Alterna visibilidade dos botões de edição
function atualizarBotoesEdicao() {
  const btnAlterar = document.getElementById("btn-alterar");
  const btnSalvar = document.getElementById("btn-salvar");
  const btnCancelar = document.getElementById("btn-cancelar");

  if (modoEdicao) {
    btnAlterar.classList.add("hidden");
    btnSalvar.classList.remove("hidden");
    btnCancelar.classList.remove("hidden");
  } else {
    btnAlterar.classList.remove("hidden");
    btnSalvar.classList.add("hidden");
    btnCancelar.classList.add("hidden");
  }
}

// Ativa o modo de edição na tabela
function iniciarEdicao() {
  const msgEdicao = document.getElementById("mensagem-edicao");
  exibirMensagem(msgEdicao, "", "");
  modoEdicao = true;
  atualizarBotoesEdicao();
  carregarBoletim();
}

// Cancela a edição sem salvar alterações
function cancelarEdicao() {
  const msgEdicao = document.getElementById("mensagem-edicao");
  exibirMensagem(msgEdicao, "", "");
  modoEdicao = false;
  atualizarBotoesEdicao();
  carregarBoletim();
}

// Valida todos os campos editados e salva na API
async function salvarAlteracoes() {
  const msgEdicao = document.getElementById("mensagem-edicao");
  const btnSalvar = document.getElementById("btn-salvar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const inputs = document.querySelectorAll("#tabela-corpo .input-edit");

  let temErro = false;
  const copiaDisciplinas = disciplinasAtuais.map((d) => ({
    disciplina: d.disciplina,
    tri1: d.tri1,
    tri2: d.tri2,
    tri3: d.tri3,
    faltas: [...d.faltas]
  }));

  inputs.forEach((input) => {
    input.classList.remove("invalido");
    const idx = parseInt(input.dataset.index, 10);
    const campo = input.dataset.campo;

    if (campo.startsWith("tri")) {
      const res = validarNotaEditor(input.value);
      if (!res.valido) {
        input.classList.add("invalido");
        temErro = true;
      } else {
        copiaDisciplinas[idx][campo] = res.valor;
      }
    } else if (campo.startsWith("falta")) {
      const fIdx = parseInt(campo.replace("falta", ""), 10) - 1;
      const res = validarFaltaEditor(input.value);
      if (!res.valido) {
        input.classList.add("invalido");
        temErro = true;
      } else {
        copiaDisciplinas[idx].faltas[fIdx] = res.valor;
      }
    }
  });

  if (temErro) {
    exibirMensagem(msgEdicao, "Existem campos inválidos destacados em vermelho. Notas devem ser de 0 a 10 (ou vazio) e faltas números inteiros maiores ou iguais a zero.", "erro");
    return;
  }

  btnSalvar.disabled = true;
  btnCancelar.disabled = true;
  exibirMensagem(msgEdicao, "Salvando...", "info");

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: copiaDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      exibirMensagem(msgEdicao, "Erro ao salvar alterações no servidor. Tente novamente.", "erro");
      return;
    }

    disciplinasAtuais = copiaDisciplinas;
    modoEdicao = false;
    atualizarBotoesEdicao();
    carregarBoletim();
    exibirMensagem(msgEdicao, "Dados salvos com sucesso.", "sucesso");
  } catch (erro) {
    exibirMensagem(msgEdicao, "Não foi possível conectar ao servidor para salvar. Tente novamente.", "erro");
  } finally {
    btnSalvar.disabled = false;
    btnCancelar.disabled = false;
  }
}

// =========================================================
// FUNÇÕES DOS GRÁFICOS (SOMENTE LEITURA - ETAPA 3)
// =========================================================

function atualizarGraficoMedias() {
  const canvas = document.getElementById("graficoMediasDisciplinas");
  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  if (graficoMedias) {
    graficoMedias.destroy();
  }

  const labels = disciplinasAtuais.map((d) => d.disciplina);
  const medias = disciplinasAtuais.map((d) => {
    const notas = [d.tri1, d.tri2, d.tri3].filter((n) => n !== null && n !== undefined);
    if (notas.length === 0) {
      return null;
    }
    const soma = notas.reduce((acc, val) => acc + Number(val), 0);
    return Number((soma / notas.length).toFixed(2));
  });

  const coresBarras = medias.map((m) => {
    if (m === null) {
      return "rgba(136, 136, 160, 0.35)";
    }
    return m >= 6.0 ? "rgba(0, 255, 136, 0.75)" : "rgba(255, 0, 51, 0.8)";
  });

  const bordasBarras = medias.map((m) => {
    if (m === null) {
      return "#8888a0";
    }
    return m >= 6.0 ? "#00ff88" : "#ff0033";
  });

  graficoMedias = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Média",
          data: medias,
          backgroundColor: coresBarras,
          borderColor: bordasBarras,
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "#141420",
          titleColor: "#ffd700",
          bodyColor: "#f0f0f5",
          borderColor: "#ff0033",
          borderWidth: 1,
          callbacks: {
            label: function (context) {
              const valor = context.parsed.x;
              if (valor === null || valor === undefined) {
                return `${context.label}: Sem nota`;
              }
              return `${context.label}: ${valor.toFixed(1).replace(".", ",")}`;
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 10,
          ticks: {
            color: "#aaaabb",
            font: { size: 11 }
          },
          grid: {
            color: "rgba(255, 255, 255, 0.08)"
          }
        },
        y: {
          ticks: {
            color: "#f0f0f5",
            font: { size: 10 },
            autoSkip: false
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function atualizarGraficoEvolucao() {
  const canvas = document.getElementById("graficoEvolucaoTrimestres");
  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  if (graficoEvolucao) {
    graficoEvolucao.destroy();
  }

  const calcularMediaTrimestre = (chaveTri) => {
    const validas = disciplinasAtuais
      .map((d) => d[chaveTri])
      .filter((n) => n !== null && n !== undefined && !isNaN(Number(n)));

    if (validas.length === 0) {
      return null;
    }

    const soma = validas.reduce((acc, n) => acc + Number(n), 0);
    return Number((soma / validas.length).toFixed(2));
  };

  const dadosTrimestres = [
    calcularMediaTrimestre("tri1"),
    calcularMediaTrimestre("tri2"),
    calcularMediaTrimestre("tri3")
  ];

  graficoEvolucao = new Chart(canvas, {
    type: "line",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [
        {
          label: "Média Geral",
          data: dadosTrimestres,
          borderColor: "#ffd700",
          backgroundColor: "rgba(255, 215, 0, 0.2)",
          pointBackgroundColor: "#ff0033",
          pointBorderColor: "#ffd700",
          pointBorderWidth: 2,
          pointRadius: 5,
          borderWidth: 3,
          tension: 0.25,
          fill: true,
          spanGaps: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "#141420",
          titleColor: "#ffd700",
          bodyColor: "#f0f0f5",
          borderColor: "#ff0033",
          borderWidth: 1,
          callbacks: {
            label: function (context) {
              const valor = context.parsed.y;
              if (valor === null || valor === undefined) {
                return "Média Geral: Sem nota";
              }
              return `Média Geral: ${valor.toFixed(1).replace(".", ",")}`;
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: {
            color: "#aaaabb",
            font: { size: 11 }
          },
          grid: {
            color: "rgba(255, 255, 255, 0.08)"
          }
        },
        x: {
          ticks: {
            color: "#f0f0f5",
            font: { size: 11 }
          },
          grid: {
            color: "rgba(255, 255, 255, 0.05)"
          }
        }
      }
    }
  });
}

function atualizarGraficoFaltas() {
  const canvas = document.getElementById("graficoFaltasTrimestres");
  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  if (graficoFaltas) {
    graficoFaltas.destroy();
  }

  let faltasTri1 = 0;
  let faltasTri2 = 0;
  let faltasTri3 = 0;

  disciplinasAtuais.forEach((d) => {
    const arr = Array.isArray(d.faltas) ? d.faltas : [0, 0, 0];
    faltasTri1 += Number(arr[0] || 0);
    faltasTri2 += Number(arr[1] || 0);
    faltasTri3 += Number(arr[2] || 0);
  });

  const totalFaltas = faltasTri1 + faltasTri2 + faltasTri3;
  const referenciaInterna = 350;
  const situacaoCritica = totalFaltas >= referenciaInterna * 0.75;

  const badgePerigo = document.getElementById("estadoFaltas");
  const cardFaltas = document.getElementById("card-grafico-faltas");

  if (badgePerigo && cardFaltas) {
    if (situacaoCritica) {
      badgePerigo.classList.remove("hidden");
      cardFaltas.classList.add("estado-perigo");
    } else {
      badgePerigo.classList.add("hidden");
      cardFaltas.classList.remove("estado-perigo");
    }
  }

  graficoFaltas = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [
        {
          label: "Faltas",
          data: [faltasTri1, faltasTri2, faltasTri3],
          backgroundColor: [
            "rgba(255, 0, 51, 0.78)",
            "rgba(255, 215, 0, 0.78)",
            "rgba(255, 51, 102, 0.78)"
          ],
          borderColor: ["#ff0033", "#ffd700", "#ff3366"],
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "#141420",
          titleColor: "#ffd700",
          bodyColor: "#f0f0f5",
          borderColor: "#ff0033",
          borderWidth: 1,
          callbacks: {
            label: function (context) {
              const qtd = context.parsed.y;
              return `${context.label}: ${qtd} ${qtd === 1 ? "falta" : "faltas"}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: "#aaaabb",
            precision: 0,
            font: { size: 11 }
          },
          grid: {
            color: "rgba(255, 255, 255, 0.08)"
          }
        },
        x: {
          ticks: {
            color: "#f0f0f5",
            font: { size: 11 }
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function atualizarGraficos() {
  atualizarGraficoMedias();
  atualizarGraficoEvolucao();
  atualizarGraficoFaltas();
}

// Configura os eventos da página ao carregar
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form-login").addEventListener("submit", abrirBoletim);
  document.getElementById("btn-alterar").addEventListener("click", iniciarEdicao);
  document.getElementById("btn-salvar").addEventListener("click", salvarAlteracoes);
  document.getElementById("btn-cancelar").addEventListener("click", cancelarEdicao);
});