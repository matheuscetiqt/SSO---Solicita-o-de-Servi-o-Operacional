
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

// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

const numeroSSO = document.getElementById("numeroSSO");
const btnBuscar = document.getElementById("btnBuscar");
const mensagemBusca = document.getElementById("mensagemBusca");

const dadosSolicitacao = document.getElementById("dadosSolicitacao");
const secaoAtividades = document.getElementById("secaoAtividades");
const dadosManuais = document.getElementById("dadosManuais");
const acoesTR = document.getElementById("acoesTR");

const listaAtividades = document.getElementById("listaAtividades");
const cargaTotal = document.getElementById("cargaTotal");

let solicitacaoAtual = null;
let usuarioAutorizado = false;

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

function formatarMoeda(valor) {

    if (valor === undefined || valor === null || valor === "") {
        return "-";
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return String(valor);
    }

    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function converterCarga(valor) {

    if (valor === undefined || valor === null || valor === "") {
        return null;
    }

    const numero = Number(
        String(valor).replace(",", ".")
    );

    return Number.isFinite(numero) && numero > 0
        ? numero
        : null;
}

function formatarDatas(datas) {

    if (!datas) {
        return "-";
    }

    if (Array.isArray(datas)) {
        return datas.join(", ");
    }

    if (typeof datas === "object") {
        return Object.values(datas).join(", ");
    }

    return String(datas);
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

    esconderElemento(dadosSolicitacao);
    esconderElemento(secaoAtividades);
    esconderElemento(dadosManuais);
    esconderElemento(acoesTR);

    listaAtividades.innerHTML = "";

    cargaTotal.textContent = "0 horas";

    document.getElementById("infoProtocolo").textContent = "-";
    document.getElementById("infoSolicitante").textContent = "-";
    document.getElementById("infoProfessor").textContent = "-";
    document.getElementById("infoCurso").textContent = "-";
    document.getElementById("infoDisciplina").textContent = "-";
    document.getElementById("infoTipoServico").textContent = "-";
    document.getElementById("infoAnalista").textContent = "-";
    document.getElementById("infoValorHora").textContent = "-";

    document.getElementById("datasAtividades").textContent = "-";

    document.getElementById("qualificacaoTecnica").value = "";
    document.getElementById("dataContrato").value = "";

    document.getElementById("btnGerarTR").disabled = true;
}

// ==========================================
// EXIBIR DADOS DA SOLICITAÇÃO
// ==========================================

function exibirDados(dados) {

    solicitacaoAtual = dados;

    document.getElementById("infoProtocolo").textContent =
        formatarValor(dados.protocolo);

    document.getElementById("infoSolicitante").textContent =
        formatarValor(dados.solicitante);

    document.getElementById("infoProfessor").textContent =
        formatarValor(dados.professor);

    document.getElementById("infoCurso").textContent =
        formatarValor(dados.curso);

    document.getElementById("infoDisciplina").textContent =
        formatarValor(dados.disciplina);

    document.getElementById("infoTipoServico").textContent =
        formatarValor(dados.tipoServico);

    document.getElementById("infoAnalista").textContent =
        formatarValor(dados.analista);

    document.getElementById("infoValorHora").textContent =
        formatarMoeda(dados.valorHora);

    document.getElementById("datasAtividades").textContent =
        formatarDatas(dados.datasAulas);

    mostrarElemento(dadosSolicitacao);

    exibirAtividades(dados);

    mostrarElemento(dadosManuais);
    mostrarElemento(acoesTR);
    document.getElementById("btnGerarTR").disabled = false;
}

// ==========================================
// IDENTIFICAR E EXIBIR ATIVIDADES
// ==========================================

function exibirAtividades(dados) {

    listaAtividades.innerHTML = "";

    let totalHoras = 0;
    let quantidadeAtividades = 0;

    for (let i = 1; i <= 3; i++) {

        const atividade = String(
            dados[`atividade${i}`] || ""
        ).trim();

        const carga = dados[`carga${i}`];

        // Não exibir atividades vazias.
        if (!atividade) {
            continue;
        }

        quantidadeAtividades++;

        const cargaNumerica = converterCarga(carga);

        if (cargaNumerica !== null) {
            totalHoras += cargaNumerica;
        }

        const bloco = document.createElement("div");
        bloco.className = "tr-activity";

        const titulo = document.createElement("strong");
        titulo.textContent = `Atividade ${i}`;

        const nome = document.createElement("p");
        nome.textContent = atividade;

        const horas = document.createElement("p");

        horas.textContent = cargaNumerica !== null
            ? `Carga horária: ${cargaNumerica} horas`
            : "Carga horária não informada ou inválida.";

        bloco.appendChild(titulo);
        bloco.appendChild(nome);
        bloco.appendChild(horas);

        listaAtividades.appendChild(bloco);
    }

    if (quantidadeAtividades === 0) {

        listaAtividades.textContent =
            "Nenhuma atividade foi identificada nesta solicitação.";

    }

    cargaTotal.textContent =
        `${totalHoras.toLocaleString("pt-BR")} horas`;

    mostrarElemento(secaoAtividades);
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

        mensagemBusca.textContent =
            "Solicitação encontrada com sucesso!";

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
// GERAÇÃO DO TERMO DE REFERÊNCIA - WORD
// ==========================================

function identificarTipoAtividade(nome) {
    const texto = String(nome || "").toLowerCase();

    if (texto.includes("100021663") || texto.includes("ministrar aula")) {
        return "ministrar";
    }

    if (texto.includes("100022010") || texto.includes("desenvolver conteúdo")) {
        return "desenvolver";
    }

    if (texto.includes("100021664") || texto.includes("tutoria")) {
        return "tutoria";
    }

    return "desconhecida";
}

function formatarHoras(numero) {
    return Number(numero).toLocaleString("pt-BR");
}

function formatarDataDocumento(data) {
    if (!data) return "";

    const [ano, mes, dia] = data.split("-");
    const meses = [
        "janeiro", "fevereiro", "março", "abril",
        "maio", "junho", "julho", "agosto",
        "setembro", "outubro", "novembro", "dezembro"
    ];

    return `${Number(dia)} de ${meses[Number(mes) - 1]} de ${ano}.`;
}

function obterDadosParaTR(dados) {
    const atividades = [];

    for (let i = 1; i <= 3; i++) {
        const nome = String(dados[`atividade${i}`] || "").trim();

        if (!nome) continue;

        const carga = converterCarga(dados[`carga${i}`]);

        if (carga === null) {
            throw new Error(
                `A atividade "${nome}" está sem carga horária válida.`
            );
        }

        const tipo = identificarTipoAtividade(nome);

        if (tipo === "desconhecida") {
            throw new Error(
                `Não foi possível identificar a atividade "${nome}".`
            );
        }

        atividades.push({ nome, carga, tipo });
    }

    if (!atividades.length) {
        throw new Error("Nenhuma atividade válida foi encontrada.");
    }

    if (atividades.some(a => a.tipo === "tutoria")) {
        throw new Error(
            "A atividade de Tutoria precisa de uma descrição institucional aprovada antes da geração do TR."
        );
    }

    const disciplina = String(dados.disciplina || "").trim();
    const curso = String(dados.curso || "").trim();

    if (!disciplina || !curso) {
        throw new Error("A solicitação precisa ter curso e disciplina preenchidos.");
    }

    const ministrar = atividades.filter(a => a.tipo === "ministrar");
    const desenvolver = atividades.filter(a => a.tipo === "desenvolver");

    const totalMinistrar = ministrar.reduce((s, a) => s + a.carga, 0);
    const totalDesenvolver = desenvolver.reduce((s, a) => s + a.carga, 0);
    const totalGeral = totalMinistrar + totalDesenvolver;

    const descricoesObjeto = [];

    if (ministrar.length) descricoesObjeto.push("ministrar aulas");
    if (desenvolver.length) descricoesObjeto.push("desenvolver conteúdos");

    const objeto = descricoesObjeto.join(" e ");

    const descricaoMinistrar = ministrar.length
        ? `A atividade de ministrar aulas, na unidade curricular “${disciplina}”, consiste na apresentação, em formato de slides, do material didático previamente desenvolvido (dedicação de ${formatarHoras(totalMinistrar)} horas).`
        : "";

    const descricaoDesenvolver = desenvolver.length
        ? `A atividade de desenvolver conteúdo, na unidade curricular “${disciplina}”, compreende preparar os materiais didáticos e atualizar o estudo de caso (dedicação de ${formatarHoras(totalDesenvolver)} horas).`
        : "";

    const datas = formatarDatas(dados.datasAulas);

    const detalhamento = [];

    if (totalMinistrar > 0) {
        detalhamento.push(
            `${formatarHoras(totalMinistrar)} horas de ministrar aula`
        );
    }

    if (totalDesenvolver > 0) {
        detalhamento.push(
            `${formatarHoras(totalDesenvolver)} horas de desenvolver conteúdo`
        );
    }

    const datasECargas =
        `${datas} = ${formatarHoras(totalGeral)} horas (${detalhamento.join(" + ")})`;

    return {
        ATIVIDADES_OBJETO: objeto,
        UNIDADE_CURRICULAR: disciplina,
        CURSO: curso,
        DESCRICAO_MINISTRAR: descricaoMinistrar,
        DESCRICAO_DESENVOLVER: descricaoDesenvolver,
        DATAS_E_CARGAS: datasECargas,
        CARGA_TOTAL: `${formatarHoras(totalGeral)} horas`
    };
}

async function gerarTR() {
    const btnGerar = document.getElementById("btnGerarTR");
    const mensagem = document.getElementById("mensagemGeracao");

    if (!solicitacaoAtual) {
        mensagem.textContent = "Busque uma solicitação antes de gerar o TR.";
        return;
    }

    const qualificacao = document.getElementById("qualificacaoTecnica").value.trim();
    const dataDocumento = document.getElementById("dataContrato").value;

    if (!qualificacao || !dataDocumento) {
        mensagem.textContent =
            "Preencha a Qualificação Técnica e a Data do Documento.";
        return;
    }

    btnGerar.disabled = true;
    mensagem.textContent = "Preparando o documento Word...";

    try {
        // Bibliotecas para manipular arquivos DOCX no navegador.
        const [{ default: PizZip }, { default: Docxtemplater }] =
            await Promise.all([
                import("https://esm.sh/pizzip@3.1.7"),
                import("https://esm.sh/docxtemplater@3.62.0")
            ]);

        const caminhoModelo = new URL(
            "./modelos/modelo-tr-automatizado.docx",
            window.location.href
        );

        const resposta = await fetch(caminhoModelo);

        if (!resposta.ok) {
            throw new Error(
                "Não foi possível localizar o modelo Word na pasta modelos."
            );
        }

        const arquivo = await resposta.arrayBuffer();
        const zip = new PizZip(arquivo);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true
        });

        const campos = obterDadosParaTR(solicitacaoAtual);

        doc.render({
            ...campos,
            QUALIFICACAO_TECNICA: qualificacao,
            DATA_DOCUMENTO: formatarDataDocumento(dataDocumento)
        });

        const blob = doc.getZip().generate({
            type: "blob",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        const protocolo = String(solicitacaoAtual.protocolo || "SSO")
            .replace(/[^a-zA-Z0-9_-]/g, "_");

        link.href = url;
        link.download = `TR_${protocolo}.docx`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        mensagem.textContent = "Termo de Referência gerado com sucesso!";

    } catch (erro) {
        console.error("Erro ao gerar TR:", erro);

        mensagem.textContent =
            erro.message || "Não foi possível gerar o documento Word.";

    } finally {
        btnGerar.disabled = false;
    }
}

// Evento do botão de geração.
document.getElementById("btnGerarTR").addEventListener("click", gerarTR);

