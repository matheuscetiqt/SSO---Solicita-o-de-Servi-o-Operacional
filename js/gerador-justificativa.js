
import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ==========================================
// CONFIGURAÇÕES DE ACESSO
// ==========================================

const ADMINISTRADORES = [
    "mdrconceicao@cetiqt.senai.br",
    "rbenites@cetiqt.senai.br"
];

let usuarioAutorizado = false;
let solicitacaoAtual = null;

// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

const numeroSSO = document.getElementById("numeroSSO");
const btnBuscar = document.getElementById("btnBuscar");
const mensagemBusca = document.getElementById("mensagemBusca");

const dadosSolicitacao = document.getElementById("dadosSolicitacao");
const secaoCurriculo = document.getElementById("secaoCurriculo");
const secaoData = document.getElementById("secaoData");
const acoesJustificativa = document.getElementById("acoesJustificativa");

const listaAtividades = document.getElementById("listaAtividades");

// ==========================================
// AUTENTICAÇÃO E PERMISSÕES
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const email = (user.email || "").toLowerCase().trim();

    if (ADMINISTRADORES.includes(email)) {
        usuarioAutorizado = true;
        return;
    }

    try {

        const consulta = query(
            collection(db, "colaboradores"),
            where("uid", "==", user.uid)
        );

        const resultado = await getDocs(consulta);

        if (resultado.empty) {
            await signOut(auth);
            alert("Seu acesso não está cadastrado no sistema.");
            window.location.href = "index.html";
            return;
        }

        const colaborador = resultado.docs[0].data();

        const status = String(
            colaborador.status || ""
        ).toLowerCase().trim();

        if (status !== "ativo") {
            await signOut(auth);
            alert("Seu acesso está inativo. Entre em contato com o administrador.");
            window.location.href = "index.html";
            return;
        }

        usuarioAutorizado = true;

    } catch (erro) {

        console.error("Erro ao verificar acesso:", erro);

        await signOut(auth);

        alert("Não foi possível verificar seu acesso ao sistema.");

        window.location.href = "index.html";
    }
});

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function formatarValor(valor) {

    if (valor === undefined || valor === null || valor === "") {
        return "-";
    }

    return String(valor);
}

function converterNumero(valor) {

    if (valor === undefined || valor === null || valor === "") {
        return 0;
    }

    if (typeof valor === "number") {
        return Number.isFinite(valor) ? valor : 0;
    }

    const numero = Number(
        String(valor).trim().replace(",", ".")
    );

    return Number.isFinite(numero) ? numero : 0;
}

function formatarMoeda(valor) {

    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarHoras(valor) {

    return Number(valor).toLocaleString("pt-BR") + " horas";
}

function mostrarElemento(elemento) {
    elemento.classList.remove("tr-hidden");
}

function esconderElemento(elemento) {
    elemento.classList.add("tr-hidden");
}

// ==========================================
// LIMPAR RESULTADOS ANTERIORES
// ==========================================

function limparResultados() {

    solicitacaoAtual = null;

    mostrarElemento(dadosSolicitacao);

    esconderElemento(dadosSolicitacao);
    esconderElemento(secaoCurriculo);
    esconderElemento(secaoData);
    esconderElemento(acoesJustificativa);

    const campos = [
        "infoProtocolo",
        "infoProfessor",
        "infoCurso",
        "infoDisciplina",
        "infoValorHora",
        "infoCargaTotal",
        "infoValorTotal"
    ];

    campos.forEach(id => {
        document.getElementById(id).textContent = "-";
    });

    listaAtividades.innerHTML = "";

    document.getElementById("arquivoCurriculo").value = "";
    document.getElementById("textoInstitucional").value = "";
    document.getElementById("dataContrato").value = "";

    document.getElementById("btnInterpretar").disabled = true;
    document.getElementById("btnGerarJustificativa").disabled = true;

    document.getElementById("mensagemCurriculo").textContent = "";
    document.getElementById("mensagemGeracao").textContent = "";
}

// ==========================================
// EXIBIR DADOS DA SOLICITAÇÃO
// ==========================================

function exibirDados(dados) {

    solicitacaoAtual = dados;

    document.getElementById("infoProtocolo").textContent =
        formatarValor(dados.protocolo);

    document.getElementById("infoProfessor").textContent =
        formatarValor(dados.professor);

    document.getElementById("infoCurso").textContent =
        formatarValor(dados.curso);

    document.getElementById("infoDisciplina").textContent =
        formatarValor(dados.disciplina);

    const valorHora = converterNumero(dados.valorHora);

    document.getElementById("infoValorHora").textContent =
        formatarMoeda(valorHora);

    // ======================================
    // IDENTIFICAR ATIVIDADES E CARGA HORÁRIA
    // ======================================

    listaAtividades.innerHTML = "";

    let totalHoras = 0;
    let quantidadeAtividades = 0;

    for (let i = 1; i <= 3; i++) {

        const atividade = String(
            dados[`atividade${i}`] || ""
        ).trim();

        const carga = converterNumero(dados[`carga${i}`]);

        if (!atividade) {
            continue;
        }

        quantidadeAtividades++;

        totalHoras += carga;

        const bloco = document.createElement("div");
        bloco.className = "tr-activity";

        const titulo = document.createElement("strong");
        titulo.textContent = `Atividade ${i}`;

        const nome = document.createElement("p");
        nome.textContent = atividade;

        const horas = document.createElement("p");
        horas.textContent = `Carga horária: ${formatarHoras(carga)}`;

        bloco.appendChild(titulo);
        bloco.appendChild(nome);
        bloco.appendChild(horas);

        listaAtividades.appendChild(bloco);
    }

    if (quantidadeAtividades === 0) {

        listaAtividades.textContent =
            "Nenhuma atividade foi identificada nesta solicitação.";
    }

    // ======================================
    // CÁLCULO FINANCEIRO
    // ======================================

    const valorTotal = totalHoras * valorHora;

    document.getElementById("infoCargaTotal").textContent =
        formatarHoras(totalHoras);

    document.getElementById("infoValorTotal").textContent =
        formatarMoeda(valorTotal);

    // Guarda os cálculos para a geração do documento.
    solicitacaoAtual.cargaTotalCalculada = totalHoras;
    solicitacaoAtual.valorTotalCalculado = valorTotal;

    // ======================================
    // LIBERAR PRÓXIMAS ETAPAS
    // ======================================

    mostrarElemento(dadosSolicitacao);
    mostrarElemento(secaoCurriculo);
    mostrarElemento(secaoData);

    document.getElementById("btnInterpretar").disabled = false;

    mensagemBusca.textContent =
        "Solicitação encontrada com sucesso!";
}

// ==========================================
// BUSCAR SSO NO FIRESTORE
// ==========================================

async function buscarSSO() {

    if (!usuarioAutorizado) {
        mensagemBusca.textContent =
            "Aguarde a validação do seu acesso.";
        return;
    }

    const protocolo = numeroSSO.value.trim();

    if (!protocolo) {
        mensagemBusca.textContent =
            "Informe o número da SSO para realizar a busca.";
        return;
    }

    limparResultados();

    btnBuscar.disabled = true;

    mensagemBusca.textContent =
        "Consultando solicitação...";

    try {

        const consulta = query(
            collection(db, "solicitacoes"),
            where("protocolo", "==", protocolo)
        );

        const resultado = await getDocs(consulta);

        if (resultado.empty) {
            mensagemBusca.textContent =
                "Nenhuma solicitação encontrada com esse protocolo.";
            return;
        }

        if (resultado.size > 1) {
            mensagemBusca.textContent =
                "Foram encontradas várias solicitações com esse protocolo. Verifique o cadastro.";
            return;
        }

        const documento = resultado.docs[0];

        const dados = documento.data();

        exibirDados(dados);

    } catch (erro) {

        console.error("Erro ao buscar SSO:", erro);

        mensagemBusca.textContent =
            "Erro ao consultar a solicitação. Verifique sua conexão e tente novamente.";

    } finally {

        btnBuscar.disabled = false;
    }
}

// ==========================================
// EVENTOS
// ==========================================

btnBuscar.addEventListener("click", buscarSSO);

numeroSSO.addEventListener("keydown", (evento) => {

    if (evento.key === "Enter") {
        buscarSSO();
    }
});

// ==========================================
// INTERPRETAÇÃO DO CURRÍCULO
// ==========================================

const arquivoCurriculoInput =
    document.getElementById("arquivoCurriculo");

const btnInterpretarCurriculo =
    document.getElementById("btnInterpretar");

const textoInstitucional =
    document.getElementById("textoInstitucional");

const mensagemCurriculo =
    document.getElementById("mensagemCurriculo");

// ==========================================
// VALIDAR ARQUIVO SELECIONADO
// ==========================================

arquivoCurriculoInput.addEventListener("change", () => {

    const arquivo = arquivoCurriculoInput.files[0];

    textoInstitucional.value = "";
    mensagemCurriculo.textContent = "";

    btnInterpretarCurriculo.disabled = true;

    if (!arquivo) {
        return;
    }

    if (arquivo.type !== "application/pdf") {
        mensagemCurriculo.textContent =
            "Selecione um arquivo PDF válido.";
        arquivoCurriculoInput.value = "";
        return;
    }

    if (arquivo.size > 15 * 1024 * 1024) {
        mensagemCurriculo.textContent =
            "O currículo ultrapassa o limite de 15 MB.";
        arquivoCurriculoInput.value = "";
        return;
    }

    if (!solicitacaoAtual) {
        mensagemCurriculo.textContent =
            "Primeiro, localize uma solicitação SSO.";
        arquivoCurriculoInput.value = "";
        return;
    }

    btnInterpretarCurriculo.disabled = false;

    mensagemCurriculo.textContent =
        "Currículo selecionado. Pronto para interpretação.";
});

// ==========================================
// INTERPRETAR CURRÍCULO
// ==========================================

btnInterpretarCurriculo.addEventListener("click", async () => {

    const arquivo = arquivoCurriculoInput.files[0];

    if (!arquivo) {
        mensagemCurriculo.textContent =
            "Selecione um currículo antes de continuar.";
        return;
    }

    if (!solicitacaoAtual) {
        mensagemCurriculo.textContent =
            "Localize uma SSO antes de interpretar o currículo.";
        return;
    }

    btnInterpretarCurriculo.disabled = true;

    mensagemCurriculo.textContent =
        "Extraindo informações e interpretando currículo...";

    textoInstitucional.value = "";

    try {

        // 1. Extrair texto do PDF
        const textoExtraido = await window.lerCurriculoPDF(arquivo);

        // 2. Interpretar informações profissionais
        const resultado = window.interpretarCurriculo(textoExtraido);

        // 3. Preencher texto institucional
        textoInstitucional.value = resultado.textoGerado;

        if (
            !resultado.textoGerado ||
            resultado.textoGerado.trim().length === 0
        ) {
            throw new Error(
                "Não foi possível gerar o texto institucional."
            );
        }

        mensagemCurriculo.textContent =
            "Currículo interpretado com sucesso! Revise o texto antes de continuar.";

    } catch (erro) {

        console.error("Erro ao interpretar currículo:", erro);

        mensagemCurriculo.textContent =
            erro.message || "Não foi possível interpretar o currículo.";

    } finally {

        btnInterpretarCurriculo.disabled = false;
    }
});

// ==========================================
// GERAÇÃO DA JUSTIFICATIVA EM WORD
// ==========================================

const btnGerarJustificativa =
    document.getElementById("btnGerarJustificativa");

const dataContratoInput =
    document.getElementById("dataContrato");

// ==========================================
// FORMATAÇÃO DA DATA
// ==========================================

function formatarDataJustificativa(data) {

    if (!data) return "";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
}

// ==========================================
// FORMATAÇÃO DO CURSO
// ==========================================

function obterCursoJustificativa(curso) {

    if (!curso) return "";

    const partes = String(curso).split("-");

    return partes[partes.length - 1].trim();
}

// ==========================================
// MONTAR ATIVIDADES
// ==========================================

function obterAtividadesJustificativa(dados) {

    const atividades = [];

    for (let i = 1; i <= 3; i++) {

        const atividade = String(
            dados[`atividade${i}`] || ""
        ).trim();

        if (atividade) {
            atividades.push(atividade);
        }
    }

    return atividades.join("; ");
}

// ==========================================
// VALIDAR LIBERAÇÃO DA GERAÇÃO
// ==========================================

function atualizarDisponibilidadeGeracao() {

    const curriculo = textoInstitucional.value.trim();
    const data = dataContratoInput.value;

    const pronto =
        Boolean(solicitacaoAtual) &&
        Boolean(curriculo) &&
        Boolean(data);

    btnGerarJustificativa.disabled = !pronto;

    if (pronto) {
        mostrarElemento(acoesJustificativa);
    } else {
        esconderElemento(acoesJustificativa);
    }
}

// ==========================================
// EVENTOS DE PREENCHIMENTO
// ==========================================

dataContratoInput.addEventListener("change", () => {
    atualizarDisponibilidadeGeracao();
});

textoInstitucional.addEventListener("input", () => {
    atualizarDisponibilidadeGeracao();
});

// ==========================================
// GERAR DOCUMENTO
// ==========================================

async function gerarJustificativa() {

    const mensagem = document.getElementById("mensagemGeracao");

    if (!solicitacaoAtual) {
        mensagem.textContent =
            "Localize uma solicitação SSO antes de gerar o documento.";
        return;
    }

    const curriculo = textoInstitucional.value.trim();
    const data = dataContratoInput.value;

    if (!curriculo || !data) {
        mensagem.textContent =
            "Preencha o currículo institucional e a data do contrato.";
        return;
    }

    btnGerarJustificativa.disabled = true;

    mensagem.textContent =
        "Preparando a justificativa em Word...";

    try {

        // Carregar bibliotecas DOCX
        const [
            { default: PizZip },
            { default: Docxtemplater }
        ] = await Promise.all([
            import("https://esm.sh/pizzip@3.1.7"),
            import("https://esm.sh/docxtemplater@3.62.0")
        ]);

        // Buscar modelo institucional
        const caminhoModelo = new URL(
            "./modelos/Modelo_Justificativa.docx",
            window.location.href
        );

        const resposta = await fetch(caminhoModelo);

        if (!resposta.ok) {
            throw new Error(
                "Não foi possível localizar o modelo de justificativa na pasta modelos."
            );
        }

        const arquivo = await resposta.arrayBuffer();

        const zip = new PizZip(arquivo);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true
        });

        // Dados financeiros
        const valorHora = converterNumero(
            solicitacaoAtual.valorHora
        );

        const valorTotal =
            solicitacaoAtual.valorTotalCalculado ??
            (valorHora * (solicitacaoAtual.cargaTotalCalculada || 0));

        // Dados da justificativa
        const campos = {

            atividades: obterAtividadesJustificativa(
                solicitacaoAtual
            ),

            disciplina: formatarValor(
                solicitacaoAtual.disciplina
            ),

            curso: obterCursoJustificativa(
                solicitacaoAtual.curso
            ),

            professor: formatarValor(
                solicitacaoAtual.professor
            ),

            curriculo: curriculo,

            valorHora: formatarMoeda(valorHora),

            valorTotal: formatarMoeda(valorTotal),

            dataContrato: formatarDataJustificativa(data)
        };

        // Substituir marcadores
        doc.render(campos);

        // Gerar arquivo Word
        const blob = doc.getZip().generate({
            type: "blob",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });

        // Preparar download
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        const protocolo = String(
            solicitacaoAtual.protocolo || "SSO"
        ).replace(/[^a-zA-Z0-9_-]/g, "_");

        link.href = url;
        link.download = `Justificativa_${protocolo}.docx`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        mensagem.textContent =
            "Justificativa gerada com sucesso!";

    } catch (erro) {

        console.error("Erro ao gerar justificativa:", erro);

        mensagem.textContent =
            erro.message ||
            "Não foi possível gerar a justificativa.";

    } finally {

        atualizarDisponibilidadeGeracao();
    }
}

// ==========================================
// EVENTO DO BOTÃO
// ==========================================

btnGerarJustificativa.addEventListener(
    "click",
    gerarJustificativa
);
