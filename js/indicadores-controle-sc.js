
import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

let solicitacoesSC = [];
let graficosSC = {};

const $ = (id) => document.getElementById(id);

// =====================================================
// AUTENTICAÇÃO
// =====================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    await carregarIndicadoresSC();
});

$("btnSair")?.addEventListener("click", async () => {

    try {
        await signOut(auth);
        window.location.href = "index.html";

    } catch (erro) {
        console.error("Erro ao sair:", erro);
        alert("Não foi possível sair do sistema.");
    }
});

// =====================================================
// CARREGAMENTO DOS DADOS
// =====================================================

async function carregarIndicadoresSC() {

    $("ultimaAtualizacaoSC").textContent =
        "Carregando informações do Firebase...";

    try {

        const snapshot = await getDocs(
            collection(db, "solicitacoes")
        );

        solicitacoesSC = snapshot.docs
            .map((registro) => ({
                id: registro.id,
                ...registro.data()
            }))
            .filter((item) =>
                normalizar(item.tipoServico) === "solicitacao de compra"
            );

        preencherFiltrosSC();
        atualizarIndicadoresSC();

        $("ultimaAtualizacaoSC").textContent =
            `Atualizado em ${new Date().toLocaleString("pt-BR")}`;

    } catch (erro) {

        console.error("Erro ao carregar indicadores de SC:", erro);

        $("ultimaAtualizacaoSC").textContent =
            "Não foi possível carregar os dados.";

        alert("Erro ao carregar os indicadores de Controle de SC.");
    }
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function normalizar(valor) {

    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function obterData(valor) {

    if (!valor) return null;

    if (typeof valor.toDate === "function") {
        const data = valor.toDate();
        return Number.isNaN(data.getTime()) ? null : data;
    }

    if (
        typeof valor === "object" &&
        typeof valor.seconds === "number"
    ) {
        return new Date(valor.seconds * 1000);
    }

    if (typeof valor === "string") {

        const texto = valor.trim();

        const br = texto.match(
            /^(\d{2})\/(\d{2})\/(\d{4})$/
        );

        if (br) {
            return new Date(
                Number(br[3]),
                Number(br[2]) - 1,
                Number(br[1])
            );
        }

        const iso = texto.match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );

        if (iso) {
            return new Date(
                Number(iso[1]),
                Number(iso[2]) - 1,
                Number(iso[3])
            );
        }

        const data = new Date(texto);

        return Number.isNaN(data.getTime()) ? null : data;
    }

    return null;
}

function dataLocalHoje() {

    const agora = new Date();

    return new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
    );
}

// =====================================================
// DATAS DE NECESSIDADE
// =====================================================

function obterDataNecessidade(item) {

    const campos = [
        item.datasNecessidades,
        item.datasAulas
    ];

    for (const campo of campos) {

        if (!campo) continue;

        const datas = String(campo).match(
            /\b(?:\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/g
        );

        if (!datas) continue;

        for (const valor of datas) {

            const data = obterData(valor);

            if (data) {
                return new Date(
                    data.getFullYear(),
                    data.getMonth(),
                    data.getDate()
                );
            }
        }
    }

    return null;
}

// =====================================================
// CALENDÁRIO DE FERIADOS - RIO DE JANEIRO
// Mesma regra utilizada no Controle de SC
// =====================================================

function calcularPascoa(ano) {

    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(ano, mes - 1, dia);
}

function adicionarDias(data, quantidade) {

    const resultado = new Date(
        data.getFullYear(),
        data.getMonth(),
        data.getDate()
    );

    resultado.setDate(resultado.getDate() + quantidade);

    return resultado;
}

function chaveData(data) {

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function obterFeriadosRio(ano) {

    const feriados = new Set([

        `${ano}-01-01`,
        `${ano}-04-21`,
        `${ano}-05-01`,
        `${ano}-09-07`,
        `${ano}-10-12`,
        `${ano}-11-02`,
        `${ano}-11-15`,
        `${ano}-11-20`,
        `${ano}-12-25`,

        `${ano}-01-20`,
        `${ano}-04-23`
    ]);

    const pascoa = calcularPascoa(ano);

    feriados.add(
        chaveData(adicionarDias(pascoa, -2))
    );

    feriados.add(
        chaveData(adicionarDias(pascoa, -47))
    );

    return feriados;
}

function ehDiaUtil(data, cache = new Map()) {

    const diaSemana = data.getDay();

    if (diaSemana === 0 || diaSemana === 6) {
        return false;
    }

    const ano = data.getFullYear();

    if (!cache.has(ano)) {
        cache.set(ano, obterFeriadosRio(ano));
    }

    return !cache.get(ano).has(chaveData(data));
}

function calcularDiasUteis(dataInicial, dataFinal) {

    const inicio = new Date(
        dataInicial.getFullYear(),
        dataInicial.getMonth(),
        dataInicial.getDate()
    );

    const fim = new Date(
        dataFinal.getFullYear(),
        dataFinal.getMonth(),
        dataFinal.getDate()
    );

    if (inicio.getTime() === fim.getTime()) {
        return 0;
    }

    const cache = new Map();
    const sentido = inicio < fim ? 1 : -1;

    let diasUteis = 0;
    const data = new Date(inicio);

    while (data.getTime() !== fim.getTime()) {

        data.setDate(data.getDate() + sentido);

        if (ehDiaUtil(data, cache)) {
            diasUteis += sentido;
        }
    }

    return diasUteis;
}

// =====================================================
// PRIORIDADE
// =====================================================

function pedidoEntregue(item) {

    return (
        item.pedidoEntregue === true ||
        Boolean(item.dataEntregaSC)
    );
}

function calcularPrioridade(item) {

    if (pedidoEntregue(item)) {
        return 5;
    }

    const necessidade = obterDataNecessidade(item);

    if (!necessidade) {
        return null;
    }

    const dias = calcularDiasUteis(
        dataLocalHoje(),
        necessidade
    );

    if (dias < 0) return 6;
    if (dias <= 5) return 1;
    if (dias <= 10) return 2;
    if (dias <= 28) return 3;

    return 4;
}

// =====================================================
// FILTROS
// =====================================================

function preencherFiltrosSC() {

    const filtroAno = $("filtroAnoSC");
    const filtroAnalista = $("filtroAnalistaSC");

    const anos = [
        ...new Set(
            solicitacoesSC
                .map((item) => obterData(item.dataCriacao))
                .filter(Boolean)
                .map((data) => data.getFullYear())
        )
    ].sort((a, b) => b - a);

    filtroAno.innerHTML =
        '<option value="todos">Todos os anos</option>';

    anos.forEach((ano) => {

        const opcao = document.createElement("option");

        opcao.value = ano;
        opcao.textContent = ano;

        filtroAno.appendChild(opcao);
    });

    const analistas = [
        ...new Set(
            solicitacoesSC
                .map((item) => item.analista)
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));

    filtroAnalista.innerHTML =
        '<option value="">Todos os analistas</option>';

    analistas.forEach((analista) => {

        const opcao = document.createElement("option");

        opcao.value = analista;
        opcao.textContent = analista;

        filtroAnalista.appendChild(opcao);
    });
}

$("filtroAnoSC")?.addEventListener(
    "change",
    atualizarIndicadoresSC
);

$("filtroAnalistaSC")?.addEventListener(
    "change",
    atualizarIndicadoresSC
);

$("btnAtualizarIndicadores")?.addEventListener(
    "click",
    carregarIndicadoresSC
);

// =====================================================
// BASE FILTRADA
// =====================================================

function obterBaseFiltrada() {

    const ano = $("filtroAnoSC").value;
    const analista = $("filtroAnalistaSC").value;

    return solicitacoesSC.filter((item) => {

        const data = obterData(item.dataCriacao);

        if (ano !== "todos") {

            if (!data || String(data.getFullYear()) !== ano) {
                return false;
            }
        }

        if (analista && item.analista !== analista) {
            return false;
        }

        return true;
    });
}

// =====================================================
// ATUALIZAÇÃO GERAL
// =====================================================

function atualizarIndicadoresSC() {

    const base = obterBaseFiltrada();

    const total = base.length;

    const entregues = base.filter(pedidoEntregue);

    const pendentes = base.filter(
        (item) => !pedidoEntregue(item)
    );

    const urgentes = base.filter(
        (item) => calcularPrioridade(item) === 1
    );

    const vencidas = base.filter(
        (item) => calcularPrioridade(item) === 6
    );

    const taxaEntrega = total
        ? (entregues.length / total) * 100
        : 0;

    $("indTotalSC").textContent = total;
    $("indEntreguesSC").textContent = entregues.length;
    $("indPendentesSC").textContent = pendentes.length;
    $("indUrgentesSC").textContent = urgentes.length;
    $("indVencidasSC").textContent = vencidas.length;

    $("indTaxaEntregaSC").textContent =
        `${taxaEntrega.toFixed(1).replace(".", ",")}%`;

    renderizarGraficoPrioridade(base);
    renderizarGraficoAnalista(base);
    renderizarGraficoEntrega(base);
    renderizarGraficoMensal(base);
    renderizarGraficoEntregaAnalista(base);
}

// =====================================================
// FUNÇÃO DE GRÁFICOS
// =====================================================

function criarGrafico(id, configuracao) {

    if (graficosSC[id]) {
        graficosSC[id].destroy();
    }

    const canvas = $(id);

    if (!canvas) return;

    graficosSC[id] = new Chart(
        canvas,
        configuracao
    );
}

// =====================================================
// 1. PRIORIDADE
// =====================================================

function renderizarGraficoPrioridade(base) {

    const categorias = [
        { numero: 5, nome: "5 - Concluído" },
        { numero: 4, nome: "4 - Futuras (≥ 29d)" },
        { numero: 3, nome: "3 - No prazo (11-28d)" },
        { numero: 2, nome: "2 - Atenção (6-10d)" },
        { numero: 1, nome: "1 - Urgente (≤ 5d)" },
        { numero: 6, nome: "6 - Vencido" }
    ];

    const dados = categorias.map((categoria) =>
        base.filter(
            (item) => calcularPrioridade(item) === categoria.numero
        ).length
    );

    criarGrafico("graficoPrioridadeSC", {

        type: "bar",

        data: {
            labels: categorias.map((item) => item.nome),

            datasets: [{
                label: "Quantidade de SCs",
                data: dados,
                backgroundColor: "#e94b0c",
                borderRadius: 5,
                barThickness: 25
            }]
        },

        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: { display: false }
            },

            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

// =====================================================
// 2. ANALISTAS
// =====================================================

function renderizarGraficoAnalista(base) {

    const contagem = {};

    base.forEach((item) => {

        const nome = item.analista || "Não informado";

        contagem[nome] = (contagem[nome] || 0) + 1;
    });

    const ranking = Object.entries(contagem)
        .sort((a, b) => b[1] - a[1]);

    criarGrafico("graficoAnalistaSC", {

        type: "bar",

        data: {
            labels: ranking.map((item) => item[0]),

            datasets: [{
                label: "Quantidade de SCs",
                data: ranking.map((item) => item[1]),
                backgroundColor: "#e94b0c",
                borderRadius: 4
            }]
        },

        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: { display: false }
            },

            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

// =====================================================
// 3. ENTREGUES X PENDENTES
// =====================================================

function renderizarGraficoEntrega(base) {

    const entregues = base.filter(pedidoEntregue).length;
    const pendentes = base.length - entregues;

    criarGrafico("graficoEntregaSC", {

        type: "doughnut",

        data: {
            labels: [
                "Entregues",
                "Aguardando entrega"
            ],

            datasets: [{
                data: [entregues, pendentes],
                backgroundColor: [
    "#0066A1",
    "#E94B0C"
],
                borderWidth: 2,
                borderColor: "#ffffff"
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

// =====================================================
// 4. EVOLUÇÃO MENSAL
// =====================================================

function renderizarGraficoMensal(base) {

    const anoSelecionado = $("filtroAnoSC").value;

    let ano = anoSelecionado === "todos"
        ? new Date().getFullYear()
        : Number(anoSelecionado);

    const meses = [
        "Jan", "Fev", "Mar", "Abr",
        "Mai", "Jun", "Jul", "Ago",
        "Set", "Out", "Nov", "Dez"
    ];

    const dados = Array(12).fill(0);

    base.forEach((item) => {

        const data = obterData(item.dataCriacao);

        if (!data || data.getFullYear() !== ano) {
            return;
        }

        dados[data.getMonth()]++;
    });

    criarGrafico("graficoMensalSC", {

        type: "line",

        data: {
            labels: meses,

            datasets: [{
                label: "SCs abertas",
                data: dados,
                borderColor: "#1769aa",
                backgroundColor: "rgba(23, 105, 170, 0.12)",
                fill: true,
                tension: 0.3,
                pointRadius: 4
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

// =====================================================
// 5. ENTREGAS POR ANALISTA
// =====================================================

function renderizarGraficoEntregaAnalista(base) {

    const contagem = {};

    base.forEach((item) => {

        const nome = item.analista || "Não informado";

        if (!contagem[nome]) {
            contagem[nome] = {
                entregues: 0,
                pendentes: 0
            };
        }

        if (pedidoEntregue(item)) {
            contagem[nome].entregues++;
        } else {
            contagem[nome].pendentes++;
        }
    });

    const ranking = Object.entries(contagem)
        .sort((a, b) =>
            (b[1].entregues + b[1].pendentes) -
            (a[1].entregues + a[1].pendentes)
        );

    criarGrafico("graficoEntregaAnalistaSC", {

        type: "bar",

        data: {
            labels: ranking.map((item) => item[0]),

            datasets: [
                {
                    label: "Entregues",
                    data: ranking.map(
                        (item) => item[1].entregues
                    ),
                    backgroundColor: "#0066A1"
                },
                {
                    label: "Pendentes",
                    data: ranking.map(
                        (item) => item[1].pendentes
                    ),
                    backgroundColor: "#e99a24"
                }
            ]
        },

        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom"
                }
            },

            scales: {
                x: {
                    beginAtZero: true,
                    stacked: true,
                    ticks: { precision: 0 }
                },
                y: {
                    stacked: true
                }
            }
        }
    });
}
