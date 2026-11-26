
import { auth, db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    serverTimestamp,
    writeBatch,
    limit,
    query
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// ELEMENTOS DA TELA

const inputArquivo = document.getElementById("arquivoBaseAlunos");
const btnSelecionar = document.getElementById("btnSelecionarArquivo");
const nomeArquivo = document.getElementById("nomeArquivoBase");
const status = document.getElementById("statusImportacaoBase");
const resumo = document.getElementById("resumoImportacaoBase");
const secaoPrevia = document.getElementById("secaoPreviaBase");
const btnSair = document.getElementById("btnSair");
const btnImportar = document.getElementById("btnImportarBase");

let linhasPlanilhaAtual = [];



// CONTROLE DE ACESSO À BASE DE ALUNOS

let usuarioAtual = null;
let ehAdministrador = false;

const cardImportacao = document.getElementById("cardImportacaoBase");

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    try {

        usuarioAtual = user;

        // Buscar cadastro de acesso pelo UID
        const referenciaAcesso = doc(
            db,
            "acessos_base_alunos",
            user.uid
        );

        const resultadoAcesso = await getDoc(referenciaAcesso);

        if (!resultadoAcesso.exists()) {
            atualizarStatus(
                "Você não possui autorização para acessar a Base de Alunos.",
                "erro"
            );
            return;
        }

        const acesso = resultadoAcesso.data();

        if (acesso.ativo !== true) {
            atualizarStatus(
                "Seu acesso à Base de Alunos está inativo.",
                "erro"
            );
            return;
        }

        ehAdministrador = acesso.perfil === "administrador";

        // Somente administradores visualizam a importação
        if (cardImportacao) {
            cardImportacao.hidden = !ehAdministrador;
        }

        console.log(
            ehAdministrador
                ? "Acesso administrativo à Base de Alunos."
                : "Acesso de consulta à Base de Alunos."
        );

        await carregarDashboard();

    } catch (erro) {

        console.error("Erro ao validar acesso:", erro);

        atualizarStatus(
            "Não foi possível validar seu acesso. Entre novamente no CPE.",
            "erro"
        );

    }

});


// SAIR DO SISTEMA

if (btnSair) {

    btnSair.addEventListener("click", async () => {

        await signOut(auth);

        window.location.href = "index.html";

    });

}

// ABRIR SELETOR DE ARQUIVO

btnSelecionar.addEventListener("click", () => {

    inputArquivo.click();

});

// LER ARQUIVO

inputArquivo.addEventListener("change", processarArquivo);


// ATUALIZAR MENSAGEM

function atualizarStatus(mensagem, tipo = "") {

    status.textContent = mensagem;

    status.className = `base-alunos-status ${tipo}`.trim();

}


// NORMALIZAR TEXTO

function normalizarTexto(valor) {

    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


// LOCALIZAR COLUNA DE PERÍODO


function localizarColunaPeriodo(colunas) {

    return colunas.find(coluna => {

        const nome = normalizarTexto(coluna);

        return nome === "codperlet";

    });

}



// IDENTIFICAR REGISTROS DE 2026

function registroEhDe2026(valor) {

    if (valor === null || valor === undefined || valor === "") {
        return false;
    }

    const texto = String(valor).trim();

    return /(^|\D)2026(\D|$)/.test(texto);

}


function normalizarCampo(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
}

function identificarDuplicidades(linhas) {

    const contagem = new Map();

    linhas.forEach(linha => {

        const cpf = String(linha.CPF ?? "")
            .replace(/\D/g, "");

        const curso = normalizarCampo(linha.CURSO);
        const periodo = normalizarCampo(linha.CODPERLET);

        if (!cpf || !curso || !periodo) return;

        const chave = `${cpf}|${curso}|${periodo}`;

        contagem.set(chave, (contagem.get(chave) || 0) + 1);

    });

    return [...contagem.values()]
        .filter(quantidade => quantidade > 1)
        .length;
}



// PROCESSAR ARQUIVO EXCEL

async function processarArquivo(evento) {

    const arquivo = evento.target.files?.[0];

    if (!arquivo) return;

    nomeArquivo.textContent = `Arquivo selecionado: ${arquivo.name}`;

    resumo.hidden = true;

    secaoPrevia.hidden = true;

    atualizarStatus("Lendo e validando a planilha...");

    try {

        if (!window.XLSX) {

            throw new Error(
                "A biblioteca de leitura do Excel não carregou. Atualize a página e tente novamente."
            );

        }

        const dados = await arquivo.arrayBuffer();

        const workbook = XLSX.read(dados, {
            type: "array",
            cellDates: true
        });

        const primeiraAba = workbook.SheetNames[0];

        if (!primeiraAba) {

            throw new Error("A planilha não possui abas para leitura.");

        }

        const linhas = XLSX.utils.sheet_to_json(
            workbook.Sheets[primeiraAba],
            {
                defval: "",
                raw: false
            }
        );

        if (!linhas.length) {

            throw new Error("Não encontrei registros na primeira aba da planilha.");

        }

        const colunas = Object.keys(linhas[0]);
        linhasPlanilhaAtual = linhas;

        const colunaPeriodo = localizarColunaPeriodo(colunas);

        if (!colunaPeriodo) {

            throw new Error(
                "Não identifiquei uma coluna de período/semestre. Confira o cabeçalho da planilha."
            );

        }

        const registros2026 = linhas.filter(linha => {

            return registroEhDe2026(linha[colunaPeriodo]);

        });

        // ATUALIZAR INDICADORES

        document.getElementById("totalLinhasBase").textContent =
            linhas.length.toLocaleString("pt-BR");

        document.getElementById("total2026Base").textContent =
            registros2026.length.toLocaleString("pt-BR");

        document.getElementById("totalColunasBase").textContent =
            colunas.length.toLocaleString("pt-BR");

        const totalDuplicados = identificarDuplicidades(linhas);

document.getElementById("totalDuplicadosBase").textContent =
    totalDuplicados.toLocaleString("pt-BR");

        resumo.hidden = false;


        // MONTAR TABELA DE PRÉVIA

        const cabecalho = document.getElementById("cabecalhoPreviaBase");

        const corpo = document.getElementById("corpoPreviaBase");

        cabecalho.innerHTML = "";

        corpo.innerHTML = "";


        // MOSTRAR ATÉ 7 COLUNAS

        const colunasPrevia = colunas.slice(0, 7);

        const trCabecalho = document.createElement("tr");

        colunasPrevia.forEach(coluna => {

            const th = document.createElement("th");

            th.textContent = coluna;

            trCabecalho.appendChild(th);

        });

        cabecalho.appendChild(trCabecalho);


        // MOSTRAR ATÉ 15 REGISTROS

        linhas.slice(0, 15).forEach(registro => {
            const tr = document.createElement("tr");

            colunasPrevia.forEach(coluna => {

                const td = document.createElement("td");

                td.textContent = String(registro[coluna] ?? "");

                tr.appendChild(td);

            });

            corpo.appendChild(tr);

        });


        // MENSAGEM DA PRÉVIA

        document.getElementById("mensagemPreviaBase").textContent =
    `Exibindo até 15 dos ${linhas.length.toLocaleString("pt-BR")} registros da planilha. Foram identificados ${registros2026.length.toLocaleString("pt-BR")} registros de 2026. Coluna utilizada: ${colunaPeriodo}.`;


        secaoPrevia.hidden = false;

        if (btnImportar) {
    btnImportar.hidden = !ehAdministrador;
}

        atualizarStatus(
            "Planilha lida com sucesso. Nenhum dado foi enviado ao Firebase.",
            "sucesso"
        );

    } catch (erro) {

        console.error("Erro ao ler a base de alunos:", erro);

        atualizarStatus(
            erro.message || "Não foi possível ler a planilha.",
            "erro"
        );

    }

}
async function testarConexaoFirestore() {

    try {

        const consulta = query(
            collection(db, "base_alunos"),
            limit(1)
        );

        await getDocs(consulta);

        console.log("Conexão com Firestore funcionando.");

    } catch (erro) {

        console.error("Erro na conexão com Firestore:", erro);

    }

}
testarConexaoFirestore();


// GERAR IDENTIFICADOR ACADÊMICO ESTÁVEL

function gerarHash(texto) {
    let hash = 14695981039346656037n;

    for (let i = 0; i < texto.length; i++) {
        hash ^= BigInt(texto.charCodeAt(i));
        hash = BigInt.asUintN(64, hash * 1099511628211n);
    }

    return hash.toString(16);
}


// IMPORTAR BASE PARA O FIRESTORE

async function importarBaseFirestore() {

    if (!ehAdministrador || !usuarioAtual) {
        atualizarStatus(
            "Você não possui permissão para importar dados.",
            "erro"
        );
        return;
    }

    if (!linhasPlanilhaAtual.length) {
        atualizarStatus(
            "Selecione e valide uma planilha antes de importar.",
            "erro"
        );
        return;
    }

    const confirmar = window.confirm(
        `Você está prestes a importar ${linhasPlanilhaAtual.length.toLocaleString("pt-BR")} registros. Deseja continuar?`
    );

    if (!confirmar) return;

    btnImportar.disabled = true;

    const total = linhasPlanilhaAtual.length;
    const tamanhoLote = 400;

    let processados = 0;
    let historicoRef = null;

    try {

        atualizarStatus(
            "Preparando importação para o Firebase...",
            "sucesso"
        );

        // Criar registro inicial no histórico

        historicoRef = await addDoc(
            collection(db, "historico_importacoes_alunos"),
            {
                arquivo: nomeArquivo.textContent,
                totalRegistros: total,
                processados: 0,
                status: "em andamento",
                usuario: usuarioAtual.email || "",
                usuarioUid: usuarioAtual.uid,
                iniciadoEm: serverTimestamp()
            }
        );

        const ocorrencias = new Map();

        // Preparar identificadores sem perder duplicidades

        const registros = linhasPlanilhaAtual.map(linha => {

            const cpf = String(linha.CPF ?? "")
                .replace(/\D/g, "");

            const curso = normalizarCampo(linha.CURSO);
            const periodo = normalizarCampo(linha.CODPERLET);

            if (!cpf || !curso || !periodo) {
                throw new Error(
                    "Existem registros sem CPF, CURSO ou CODPERLET. Corrija a planilha antes de importar."
                );
            }

            const chave = `${cpf}|${curso}|${periodo}`;

            const ocorrencia = ocorrencias.get(chave) || 0;

            ocorrencias.set(chave, ocorrencia + 1);

            const identificador =
                `aluno_${gerarHash(chave)}_${ocorrencia}`;

            return {
                identificador,
                dados: {
                    ...linha,
                    _chaveAcademica: chave,
                    _ocorrenciaChave: ocorrencia,
                    _atualizadoEm: serverTimestamp()
                }
            };

        });

        // Gravar em lotes de até 400 documentos

        for (
            let inicio = 0;
            inicio < registros.length;
            inicio += tamanhoLote
        ) {

            const lote = writeBatch(db);

            const grupo = registros.slice(
                inicio,
                inicio + tamanhoLote
            );

            grupo.forEach(registro => {

                const referencia = doc(
                    db,
                    "base_alunos",
                    registro.identificador
                );

                lote.set(referencia, registro.dados);

            });

            await lote.commit();

            processados += grupo.length;

            atualizarStatus(
                `Importação em andamento: ${processados.toLocaleString("pt-BR")} de ${total.toLocaleString("pt-BR")} registros.`,
                "sucesso"
            );

            await updateDoc(historicoRef, {
                processados,
                atualizadoEm: serverTimestamp()
            });

        }

        // Finalizar histórico

        await updateDoc(historicoRef, {
            status: "concluída",
            processados,
            finalizadoEm: serverTimestamp()
        });

        atualizarStatus(
            `Importação concluída! ${processados.toLocaleString("pt-BR")} registros processados.`,
            "sucesso"
        );

        console.log("Importação concluída:", {
            total: processados,
            historico: historicoRef.id
        });

    } catch (erro) {

        console.error("Erro na importação:", erro);

        if (historicoRef) {
            try {
                await updateDoc(historicoRef, {
                    status: "erro ou parcial",
                    processados,
                    mensagemErro: erro.message,
                    finalizadoEm: serverTimestamp()
                });
            } catch (erroHistorico) {
                console.error(
                    "Não foi possível atualizar o histórico:",
                    erroHistorico
                );
            }
        }

        atualizarStatus(
            `Falha na importação. ${processados} registros foram processados. ${erro.message}`,
            "erro"
        );

    } finally {

        btnImportar.disabled = false;

    }

}


// EVENTO DO BOTÃO

if (btnImportar) {
    btnImportar.addEventListener(
        "click",
        importarBaseFirestore
    );
}

// ==========================================
// DASHBOARD DA BASE DE ALUNOS
// ==========================================

let graficosDashboard = {};

async function carregarDashboard() {

    const dashboard = document.getElementById("dashboardAlunos");

    try {

        atualizarStatus("Carregando indicadores da Base de Alunos...");

        // Buscar os registros existentes no Firestore
        const consulta = await getDocs(
            collection(db, "base_alunos")
        );

        const alunos = consulta.docs.map(documento => documento.data());

        if (!alunos.length) {
            atualizarStatus("A coleção ainda não possui registros.", "erro");
            return;
        }

        // Normalizar situações
        const situacoes = alunos.map(aluno =>
            normalizarCampo(aluno.STATUSCURSO)
        );

        const contarSituacao = (termo) =>
            situacoes.filter(situacao => situacao === termo).length;

        // Atualizar indicadores
        document.getElementById("kpiTotalAlunos").textContent =
            alunos.length.toLocaleString("pt-BR");

        document.getElementById("kpiConcluintes").textContent =
            contarSituacao("CONCLUINTE").toLocaleString("pt-BR");

        document.getElementById("kpiMatriculados").textContent =
            contarSituacao("MATRICULADO").toLocaleString("pt-BR");

        document.getElementById("kpiReprovados").textContent =
            contarSituacao("REPROVADO").toLocaleString("pt-BR");

        document.getElementById("kpiTrancados").textContent =
            contarSituacao("TRANCADO").toLocaleString("pt-BR");

        document.getElementById("kpiPreMatriculados").textContent =
            contarSituacao("PRE-MATRICULADO").toLocaleString("pt-BR");

        // Função para agrupar informações
        function agrupar(campo) {

            const resultado = {};

            alunos.forEach(aluno => {

                const valor = normalizarCampo(aluno[campo]) || "SEM INFORMAÇÃO";

                resultado[valor] = (resultado[valor] || 0) + 1;

            });

            return resultado;
        }

        // Cores dos gráficos
        const cores = [
            "#1769aa",
            "#2697c8",
            "#22a699",
            "#e5a13b",
            "#df6b75",
            "#8064a2",
            "#64748b",
            "#91b8d8",
            "#80b7a5",
            "#c18b61"
        ];

        // Função para criar ou atualizar gráficos
  

function criarGrafico(id, tipo, labels, valores, titulo) {

    const canvas = document.getElementById(id);

    if (!canvas || !window.Chart) return;

    if (graficosDashboard[id]) {
        graficosDashboard[id].destroy();
    }

    const graficoCursos = id === "graficoCursos";
    const graficoRosca = tipo === "doughnut" || tipo === "pie";

    const cores = [
        "#1769aa",
        "#2697c8",
        "#22a699",
        "#e5a13b",
        "#df6b75",
        "#8064a2",
        "#64748b",
        "#91b8d8",
        "#80b7a5",
        "#c18b61"
    ];

    graficosDashboard[id] = new Chart(canvas, {

        type: tipo,

        data: {
            labels,

            datasets: [{
                label: titulo,
                data: valores,

                backgroundColor: graficoRosca
                    ? cores
                    : graficoCursos
                        ? "#1769aa"
                        : "#2697c8",

                borderRadius: graficoRosca ? 0 : 6,
                borderWidth: graficoRosca ? 2 : 0,
                borderColor: "#ffffff"
            }]
        },

        options: {

            indexAxis: graficoCursos ? "y" : "x",

            responsive: true,
            maintainAspectRatio: false,

            plugins: {

                legend: {
    display: graficoRosca,
    position: "bottom",
    labels: {
        usePointStyle: true,
        pointStyle: "circle",
        padding: 10,
        boxWidth: 7,
        boxHeight: 7,
        font: {
            family: "Poppins",
            size: 9
        }
    }
},

                tooltip: {
                    backgroundColor: "#123b5d",
                    padding: 12,
                    cornerRadius: 8,

                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${context.raw.toLocaleString("pt-BR")} alunos`;
                        }
                    }
                }
            },

            scales: graficoRosca ? {} : {

                x: {
                    beginAtZero: true,

                    grid: {
                        display: false
                    },

                    ticks: {
                        font: {
                            family: "Poppins",
                            size: 10
                        }
                    }
                },

                y: {
                    beginAtZero: true,

                    grid: {
                        color: "#edf1f5"
                    },

                    ticks: {
                        font: {
                            family: "Poppins",
                            size: 10
                        }
                    }
                }
            }
        }
    });
}


        // 1. Alunos por curso - Top 10
        const cursos = Object.entries(agrupar("CURSO"))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        criarGrafico(
            "graficoCursos",
            "bar",
            cursos.map(item => item[0]),
            cursos.map(item => item[1]),
            "Alunos"
        );

        // 2. Situação acadêmica
        const dadosSituacao = agrupar("STATUSCURSO");

        criarGrafico(
            "graficoSituacao",
            "doughnut",
            Object.keys(dadosSituacao),
            Object.values(dadosSituacao),
            "Registros"
        );

        // 3. Evolução por período
        const periodos = Object.entries(agrupar("CODPERLET"))
            .sort((a, b) => a[0].localeCompare(b[0], "pt-BR", {
                numeric: true
            }));

        criarGrafico(
            "graficoPeriodos",
            "bar",
            periodos.map(item => item[0]),
            periodos.map(item => item[1]),
            "Registros"
        );

        // 4. Distribuição por sexo
        const sexos = agrupar("SEXO");

        criarGrafico(
            "graficoSexo",
            "doughnut",
            Object.keys(sexos),
            Object.values(sexos),
            "Alunos"
        );

        // 5. Faixa etária
        const faixas = {
            "Até 20 anos": 0,
            "21 a 30 anos": 0,
            "31 a 40 anos": 0,
            "41 a 50 anos": 0,
            "Acima de 50 anos": 0,
            "Sem informação": 0
        };

        alunos.forEach(aluno => {
            const idade = Number(aluno.IDADE);

            if (!Number.isFinite(idade) || idade <= 0) {
                faixas["Sem informação"]++;
            } else if (idade <= 20) {
                faixas["Até 20 anos"]++;
            } else if (idade <= 30) {
                faixas["21 a 30 anos"]++;
            } else if (idade <= 40) {
                faixas["31 a 40 anos"]++;
            } else if (idade <= 50) {
                faixas["41 a 50 anos"]++;
            } else {
                faixas["Acima de 50 anos"]++;
            }
        });

        criarGrafico(
            "graficoIdade",
            "bar",
            Object.keys(faixas),
            Object.values(faixas),
            "Alunos"
        );

        // 6. Distribuição por estado - Top 10
        const estados = Object.entries(agrupar("ESTADO"))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        criarGrafico(
            "graficoEstados",
            "bar",
            estados.map(item => item[0]),
            estados.map(item => item[1]),
            "Alunos"
        );

        // Exibir dashboard
        dashboard.hidden = false;

        atualizarStatus(
            `Dashboard atualizado com ${alunos.length.toLocaleString("pt-BR")} registros.`,
            "sucesso"
        );

        console.log("Dashboard carregado:", alunos.length, "registros.");

    } catch (erro) {

        console.error("Erro ao carregar dashboard:", erro);

        atualizarStatus(
            "Não foi possível carregar os indicadores. Verifique a conexão e as permissões do Firestore.",
            "erro"
        );

    }

}


// BOTÃO ATUALIZAR DASHBOARD

const btnAtualizarDashboard = document.getElementById("btnAtualizarDashboard");

if (btnAtualizarDashboard) {
    btnAtualizarDashboard.addEventListener("click", carregarDashboard);
}

