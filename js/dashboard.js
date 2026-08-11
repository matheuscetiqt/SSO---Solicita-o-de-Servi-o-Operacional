import { auth, db } from "./firebase-config.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "index.html";
        return;

    }

    carregarSolicitacoes();

});

async function carregarSolicitacoes() {

    const tabela = document.getElementById("tabelaSolicitacoes");

    tabela.innerHTML = "";

    let total = 0;
let pendentes = 0;
let andamento = 0;
let concluidas = 0;

    const q = query(
        collection(db, "solicitacoes"),
        orderBy("dataCriacao", "desc")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach((doc) => {

        const dados = doc.data();

        total++;

        document.getElementById("totalSolicitacoes").textContent = total;
document.getElementById("totalPendentes").textContent = pendentes;
document.getElementById("totalAndamento").textContent = andamento;
document.getElementById("totalConcluidas").textContent = concluidas;

if (dados.status === "Pendente") {
    pendentes++;
}

if (dados.status === "Em andamento") {
    andamento++;
}

if (dados.status === "Concluída") {
    concluidas++;
}

       tabela.innerHTML += `
    <tr>

        <td>${dados.protocolo || "-"}</td>

        <td>${dados.solicitante || "-"}</td>

        <td>${dados.tipoServico || "-"}</td>

        <td>
            <span class="status pendente">
                ${dados.status || "-"}
            </span>
        </td>

        <td>
            ${formatarData(dados.dataCriacao)}
        </td>

        <td>
            <button
                type="button"
                class="btn-visualizar"
                data-id="${doc.id}">
                <i class="fa-solid fa-eye"></i>
                Visualizar
            </button>
        </td>

    </tr>
`;

    });

    document.querySelectorAll(".btn-visualizar").forEach((botao) => {

    botao.addEventListener("click", async () => {

        const idSolicitacao = botao.dataset.id;

        console.log("Solicitação selecionada:", idSolicitacao);

        try {

            const referencia = doc(
                db,
                "solicitacoes",
                idSolicitacao
            );

            const resultado = await getDoc(referencia);

            if (!resultado.exists()) {

                alert("Solicitação não encontrada.");
                return;

            }

            const dados = resultado.data();

            abrirModalSolicitacao(dados);

        } catch (erro) {

            console.error("Erro ao buscar solicitação:", erro);

            alert("Não foi possível carregar a solicitação.");

        }

    });

});

}
function abrirModalSolicitacao(dados) {

    const modal = document.getElementById("modalSolicitacao");

    const detalhes = document.getElementById("detalhesSolicitacao");

            <div class="detalhe-grupo">
            <span>Protocolo</span>
            <strong>${dados.protocolo || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Solicitante</span>
            <strong>${dados.solicitante || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>E-mail</span>
            <strong>${dados.email || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Analista Responsável</span>
            <strong>${dados.analista || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Tipo de Serviço</span>
            <strong>${dados.tipoServico || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Status</span>
            <strong>${dados.status || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Data da Solicitação</span>
            <strong>${formatarData(dados.dataCriacao)}</strong>
        </div>

        <hr>

        <h3>📦 Dados da Solicitação de Compra</h3>

        <div class="detalhe-grupo">
            <span>Tipo de Solicitação</span>
            <strong>${dados.tipoSC || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Nome do Professor / Especialista</span>
            <strong>${dados.professor || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>SC anterior de Referência</span>
            <strong>${dados.scAnterior || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>CPF ou CNPJ</span>
            <strong>${dados.cpfCnpj || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Curso</span>
            <strong>${dados.curso || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Atividade I</span>
            <strong>${dados.atividade1 || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Carga Horária I</span>
            <strong>${dados.carga1 || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Atividade II</span>
            <strong>${dados.atividade2 || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Carga Horária II</span>
            <strong>${dados.carga2 || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Unidade Curricular / Disciplina</span>
            <strong>${dados.disciplina || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Datas das Aulas</span>
            <strong>${dados.datasAulas || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Valor da Hora Aula</span>
            <strong>${dados.valorHora ? "R$ " + dados.valorHora : "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Histórico de Contratação</span>
            <strong>${dados.historico || "-"}</strong>
        </div>

    modal.style.display = "flex";

}

function formatarData(timestamp) {

    if (!timestamp) return "-";

    const data = timestamp.toDate();

    return data.toLocaleDateString("pt-BR") + " " +
           data.toLocaleTimeString("pt-BR", {
               hour: "2-digit",
               minute: "2-digit"
           });

}

document.getElementById("fecharModal").addEventListener("click", () => {

    document.getElementById("modalSolicitacao").style.display = "none";

});


document.getElementById("modalSolicitacao").addEventListener("click", (evento) => {

    if (evento.target.id === "modalSolicitacao") {

        evento.currentTarget.style.display = "none";

    }

});
document.getElementById("fecharModal").addEventListener("click", () => {

    document.getElementById("modalSolicitacao").style.display = "none";

});
document.getElementById("modalSolicitacao").addEventListener("click", (evento) => {

    if (evento.target.id === "modalSolicitacao") {

        evento.currentTarget.style.display = "none";

    }

});
