
import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

let solicitacoesSC = [];
let usuarioAutenticado = null;

const $ = (id) => document.getElementById(id);

// =====================================================
// INICIALIZAÇÃO E AUTENTICAÇÃO
// =====================================================

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    usuarioAutenticado = user;

    await carregarSolicitacoesSC();
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
// CARREGAR SOLICITAÇÕES DE COMPRA DO SSO
// =====================================================

async function carregarSolicitacoesSC() {
    const corpo = $("scTabelaCorpo");

    if (corpo) {
        corpo.innerHTML = `
            <tr>
                <td colspan="11" class="sc-tabela-vazia">
                    Carregando solicitações de compra...
                </td>
            </tr>
        `;
    }

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
        normalizar(item.tipoServico) ===
        "solicitacao de compra"
    )
    .sort((a, b) => {
        const dataA = a.dataCriacao?.toDate
            ? a.dataCriacao.toDate().getTime()
            : 0;

        const dataB = b.dataCriacao?.toDate
            ? b.dataCriacao.toDate().getTime()
            : 0;

        return dataB - dataA;
    });


        atualizarFiltroAnalistas();
        atualizarResumo();
        renderizarTabela();

    } catch (erro) {
        console.error(
            "Erro ao carregar solicitações de compra:",
            erro
        );

        if (corpo) {
            corpo.innerHTML = `
                <tr>
                    <td colspan="11" class="sc-tabela-vazia">
                        Não foi possível carregar os dados.
                        Verifique sua conexão e as permissões do Firebase.
                    </td>
                </tr>
            `;
        }

        alert(
            "Erro ao carregar o Controle de Dados de SC."
        );
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

function escaparHTML(valor) {
    return String(valor ?? "").replace(
        /[&<>"']/g,
        (caractere) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caractere]
    );
}

function formatarData(valor) {
    if (!valor) return "—";

    let data;

    if (typeof valor.toDate === "function") {
        data = valor.toDate();
    } else if (
        typeof valor === "object" &&
        typeof valor.seconds === "number"
    ) {
        data = new Date(valor.seconds * 1000);
    } else if (typeof valor === "string") {
        const texto = valor.trim();

        const br = texto.match(
            /^(\d{2})\/(\d{2})\/(\d{4})$/
        );

        if (br) {
            data = new Date(
                Number(br[3]),
                Number(br[2]) - 1,
                Number(br[1])
            );
        } else {
            const iso = texto.match(
                /^(\d{4})-(\d{2})-(\d{2})$/
            );

            if (iso) {
                data = new Date(
                    Number(iso[1]),
                    Number(iso[2]) - 1,
                    Number(iso[3])
                );
            } else {
                data = new Date(texto);
            }
        }
    } else {
        return "—";
    }

    if (!data || Number.isNaN(data.getTime())) {
        return escaparHTML(valor);
    }

    return data.toLocaleDateString("pt-BR");
}

function paraInputDate(valor) {
    if (!valor) return "";

    let data;

    if (typeof valor.toDate === "function") {
        data = valor.toDate();
    } else if (typeof valor === "string") {
        const br = valor.trim().match(
            /^(\d{2})\/(\d{2})\/(\d{4})$/
        );

        if (br) {
            return `${br[3]}-${br[2]}-${br[1]}`;
        }

        const iso = valor.trim().match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );

        if (iso) return valor.trim();

        data = new Date(valor);
    } else {
        return "";
    }

    if (!data || Number.isNaN(data.getTime())) {
        return "";
    }

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

// Aceita datas nos formatos dd/mm/aaaa e aaaa-mm-dd.
// Se houver várias datas, utiliza a primeira data reconhecida.
function obterDataNecessidade(item) {
    const campos = [
        item.datasNecessidades,
        item.datasAulas
    ];

    for (const campo of campos) {
        if (!campo) continue;

        const texto = String(campo);

        const datas = texto.match(
            /\b(?:\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/g
        );

        if (!datas) continue;

        for (const valor of datas) {
            const data = paraInputDate(valor);

            if (data) {
                const [ano, mes, dia] = data.split("-").map(Number);
                const resultado = new Date(ano, mes - 1, dia);

                if (!Number.isNaN(resultado.getTime())) {
                    return resultado;
                }
            }
        }
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
// PRIORIDADE AUTOMÁTICA
// =====================================================

function calcularPrioridade(item) {
    if (
        item.pedidoEntregue === true ||
        Boolean(item.dataEntregaSC)
    ) {
        return {
            numero: 5,
            texto: "5 - Concluído",
            classe: "concluido"
        };
    }

    const necessidade = obterDataNecessidade(item);

    if (!necessidade) {
        return {
            numero: null,
            texto: "Sem data válida",
            classe: "sem-data"
        };
    }

    const hoje = dataLocalHoje();

    const dias = Math.round(
        (necessidade.getTime() - hoje.getTime()) /
        86400000
    );

    if (dias < 0) {
        return {
            numero: 6,
            texto: "6 - Vencido",
            classe: "vencido"
        };
    }

    if (dias <= 5) {
        return {
            numero: 1,
            texto: "1 - Urgente (≤ 5d)",
            classe: "urgente"
        };
    }

    if (dias <= 10) {
        return {
            numero: 2,
            texto: "2 - Atenção (6-10d)",
            classe: "atencao"
        };
    }

    if (dias <= 28) {
        return {
            numero: 3,
            texto: "3 - No prazo (11-28d)",
            classe: "noprazo"
        };
    }

    return {
        numero: 4,
        texto: "4 - Futuras (≥ 29d)",
        classe: "futuras"
    };
}

// =====================================================
// PRODUTO / PROFESSOR E DATAS
// =====================================================

function obterNomeProdutoProfessor(item) {
    if (item.tipoSC === "Produto") {
        return item.nomeProduto || "Produto não informado";
    }

    if (item.tipoSC === "Servico") {
        return item.professor || "Professor não informado";
    }

    return (
        item.nomeProduto ||
        item.professor ||
        "Não informado"
    );
}

function obterDataNecessidadeTexto(item) {
    if (item.tipoSC === "Produto") {
        return item.datasNecessidades || "";
    }

    if (item.tipoSC === "Servico") {
        return item.datasAulas || "";
    }

    return item.datasNecessidades || item.datasAulas || "";
}

// =====================================================
// CARDS DE RESUMO
// =====================================================

function atualizarResumo() {
    const prioridades = solicitacoesSC.map(
        calcularPrioridade
    );

    $("scTotal").textContent = solicitacoesSC.length;

    $("scUrgentes").textContent = prioridades.filter(
        (p) => p.numero === 1
    ).length;

    $("scVencidas").textContent = prioridades.filter(
        (p) => p.numero === 6
    ).length;

    $("scEntregues").textContent = solicitacoesSC.filter(
        (item) =>
            item.pedidoEntregue === true ||
            Boolean(item.dataEntregaSC)
    ).length;

    $("scPendentes").textContent = solicitacoesSC.filter(
        (item) =>
            item.pedidoEntregue !== true &&
            !item.dataEntregaSC
    ).length;
}

// =====================================================
// FILTRO DE ANALISTAS
// =====================================================

function atualizarFiltroAnalistas() {
    const filtro = $("scFiltroAnalista");
    if (!filtro) return;

    const selecionado = filtro.value;

    const analistas = [
        ...new Set(
            solicitacoesSC
                .map((item) => item.analista)
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));

    filtro.innerHTML =
        '<option value="">Todos os analistas</option>';

    analistas.forEach((analista) => {
        const opcao = document.createElement("option");
        opcao.value = analista;
        opcao.textContent = analista;
        filtro.appendChild(opcao);
    });

    filtro.value = analistas.includes(selecionado)
        ? selecionado
        : "";
}

// =====================================================
// TABELA E FILTROS
// =====================================================

function renderizarTabela() {
    const busca = normalizar($("scBusca")?.value);
    const analista = $("scFiltroAnalista")?.value || "";
    const prioridade = $("scFiltroPrioridade")?.value || "";
    const entrega = $("scFiltroEntrega")?.value || "";

    const filtradas = solicitacoesSC.filter((item) => {
        const nome = obterNomeProdutoProfessor(item);

        const textoBusca = normalizar(
            `${item.numeroSC || ""} ${item.protocolo || ""} ${nome}`
        );

        const p = calcularPrioridade(item);

        const entregue =
            item.pedidoEntregue === true ||
            Boolean(item.dataEntregaSC);

        if (busca && !textoBusca.includes(busca)) {
            return false;
        }

        if (analista && item.analista !== analista) {
            return false;
        }

        if (
            prioridade &&
            String(p.numero ?? "") !== prioridade
        ) {
            return false;
        }

        if (entrega === "sim" && !entregue) {
            return false;
        }

        if (entrega === "nao" && entregue) {
            return false;
        }

        return true;
    });

    const corpo = $("scTabelaCorpo");

    $("scQuantidadeResultados").textContent =
        `${filtradas.length} registro(s) encontrado(s)`;

    if (filtradas.length === 0) {
        corpo.innerHTML = `
            <tr>
                <td colspan="11" class="sc-tabela-vazia">
                    Nenhuma solicitação de compra encontrada.
                </td>
            </tr>
        `;
        return;
    }

    corpo.innerHTML = filtradas.map((item) => {
        const p = calcularPrioridade(item);
        const entregue =
            item.pedidoEntregue === true ||
            Boolean(item.dataEntregaSC);

        const tipo = item.tipoSC === "Servico"
            ? "Serviço"
            : item.tipoSC === "Produto"
                ? "Produto"
                : "Não informado";

        return `
            <tr>
                <td>${escaparHTML(item.analista || "—")}</td>

                <td>
                    <strong>${escaparHTML(item.numeroSC || "Não informado")}</strong>
                    <div class="sc-protocolo">
                        ${escaparHTML(item.protocolo || "")}
                    </div>
                    <button
                        type="button"
                        class="sc-link-acao"
                        data-acao="numero"
                        data-id="${escaparHTML(item.id)}"
                    >
                        ${item.numeroSC ? "Editar número" : "Informar número"}
                    </button>
                </td>

                <td>${escaparHTML(obterNomeProdutoProfessor(item))}</td>

                <td>${formatarData(item.dataCriacao)}</td>

                <td>${escaparHTML(obterDataNecessidadeTexto(item) || "—")}</td>

                <td>${tipo}</td>

                <td>
                    <span class="sc-prioridade ${p.classe}">
                        ${escaparHTML(p.texto)}
                    </span>
                </td>

                <td>
                    <span class="sc-entrega ${entregue ? "sim" : "nao"}">
                        ${entregue ? "Sim" : "Não"}
                    </span>
                </td>

                <td>${formatarData(item.dataEntregaSC)}</td>

                <td>${escaparHTML(item.status || "—")}</td>

                <td>
                    ${
                        entregue
                        ? `
                            <button
                                type="button"
                                class="sc-link-acao"
                                data-acao="desfazer"
                                data-id="${escaparHTML(item.id)}"
                            >
                                Reabrir entrega
                            </button>
                        `
                        : `
                            <button
                                type="button"
                                class="sc-link-acao"
                                data-acao="entrega"
                                data-id="${escaparHTML(item.id)}"
                            >
                                Registrar entrega
                            </button>
                        `
                    }
                </td>
            </tr>
        `;
    }).join("");
}

// =====================================================
// INFORMAR / EDITAR NÚMERO OFICIAL DA SC
// =====================================================

async function informarNumeroSC(id) {
    const item = solicitacoesSC.find(
        (registro) => registro.id === id
    );

    if (!item) return;

    const numero = prompt(
        "Informe o número oficial da SC:",
        item.numeroSC || ""
    );

    if (numero === null) return;

    const numeroLimpo = numero.trim();

    if (!numeroLimpo) {
        alert("Informe um número de SC válido.");
        return;
    }

    try {
        await updateDoc(doc(db, "solicitacoes", id), {
            numeroSC: numeroLimpo,
            controleSCAtualizadoEm: serverTimestamp(),
            controleSCAtualizadoPor: usuarioAutenticado.email || ""
        });

        item.numeroSC = numeroLimpo;

        atualizarResumo();
        renderizarTabela();

        alert("Número da SC salvo com sucesso.");

    } catch (erro) {
        console.error("Erro ao salvar o número da SC:", erro);
        alert("Não foi possível salvar o número da SC.");
    }
}

// =====================================================
// REGISTRAR ENTREGA
// =====================================================

function abrirModalEntrega(id) {
    const item = solicitacoesSC.find(
        (registro) => registro.id === id
    );

    if (!item) return;

    $("scEntregaId").value = id;
    $("scEntregaNumero").value = item.numeroSC || "";
    $("scDataEntrega").value =
        paraInputDate(item.dataEntregaSC) ||
        paraInputDate(new Date().toISOString().slice(0, 10));

    $("modalEntregaSC").style.display = "flex";
}

function fecharModalEntrega() {
    $("modalEntregaSC").style.display = "none";
}

$("fecharModalEntregaSC")?.addEventListener(
    "click",
    fecharModalEntrega
);

$("cancelarEntregaSC")?.addEventListener(
    "click",
    fecharModalEntrega
);

$("modalEntregaSC")?.addEventListener("click", (evento) => {
    if (evento.target === $("modalEntregaSC")) {
        fecharModalEntrega();
    }
});

$("formEntregaSC")?.addEventListener(
    "submit",
    async (evento) => {
        evento.preventDefault();

        const id = $("scEntregaId").value;
        const dataEntrega = $("scDataEntrega").value;

        if (!id || !dataEntrega) {
            alert("Informe a data de entrega.");
            return;
        }

        const item = solicitacoesSC.find(
            (registro) => registro.id === id
        );

        if (!item) return;

        const numeroSC = $("scEntregaNumero").value.trim();

        if (!numeroSC) {
            alert(
                "Informe primeiro o número oficial da SC antes de registrar a entrega."
            );
            return;
        }

        const botao = $("salvarEntregaSC");
        botao.disabled = true;
        botao.textContent = "Salvando...";

        try {
            await updateDoc(doc(db, "solicitacoes", id), {
                numeroSC,
                pedidoEntregue: true,
                dataEntregaSC: dataEntrega,
                controleSCAtualizadoEm: serverTimestamp(),
                controleSCAtualizadoPor: usuarioAutenticado.email || ""
            });

            item.numeroSC = numeroSC;
            item.pedidoEntregue = true;
            item.dataEntregaSC = dataEntrega;

            fecharModalEntrega();
            atualizarResumo();
            renderizarTabela();

            alert(
                "Entrega registrada! A prioridade agora é 5 - Concluído."
            );

        } catch (erro) {
            console.error("Erro ao registrar entrega:", erro);
            alert("Não foi possível registrar a entrega.");

        } finally {
            botao.disabled = false;
            botao.innerHTML =
                '<i class="fa-solid fa-check"></i>Registrar entrega';
        }
    }
);

// =====================================================
// REABRIR ENTREGA REGISTRADA POR ENGANO
// =====================================================

async function reabrirEntrega(id) {
    const item = solicitacoesSC.find(
        (registro) => registro.id === id
    );

    if (!item) return;

    const confirmar = confirm(
        "Deseja desfazer o registro de entrega desta SC? " +
        "O número da SC será mantido e a prioridade será recalculada."
    );

    if (!confirmar) return;

    try {
        await updateDoc(doc(db, "solicitacoes", id), {
            pedidoEntregue: false,
            dataEntregaSC: "",
            controleSCAtualizadoEm: serverTimestamp(),
            controleSCAtualizadoPor: usuarioAutenticado.email || ""
        });

        item.pedidoEntregue = false;
        item.dataEntregaSC = "";

        atualizarResumo();
        renderizarTabela();

        alert("Registro de entrega desfeito.");

    } catch (erro) {
        console.error("Erro ao reabrir entrega:", erro);
        alert("Não foi possível desfazer o registro de entrega.");
    }
}

// =====================================================
// AÇÕES DA TABELA
// =====================================================

$("scTabelaCorpo")?.addEventListener("click", async (evento) => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const { acao, id } = botao.dataset;

    if (acao === "numero") {
        await informarNumeroSC(id);
    }

    if (acao === "entrega") {
        abrirModalEntrega(id);
    }

    if (acao === "desfazer") {
        await reabrirEntrega(id);
    }
});

// =====================================================
// EVENTOS DE FILTRO E ATUALIZAÇÃO
// =====================================================

$("scBusca")?.addEventListener("input", renderizarTabela);

$("scFiltroAnalista")?.addEventListener(
    "change",
    renderizarTabela
);

$("scFiltroPrioridade")?.addEventListener(
    "change",
    renderizarTabela
);

$("scFiltroEntrega")?.addEventListener(
    "change",
    renderizarTabela
);

$("btnAtualizarSC")?.addEventListener(
    "click",
    carregarSolicitacoesSC
);
