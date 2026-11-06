
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

