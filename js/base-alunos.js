
import { auth, db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
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

        registros2026.slice(0, 15).forEach(registro => {

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
            registros2026.length
                ? `Exibindo até 15 dos ${registros2026.length.toLocaleString("pt-BR")} registros identificados em 2026. Coluna utilizada: ${colunaPeriodo}.`
                : `Nenhum registro de 2026 foi identificado na coluna ${colunaPeriodo}. A planilha pode ainda conter somente períodos anteriores.`;


        secaoPrevia.hidden = false;

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
