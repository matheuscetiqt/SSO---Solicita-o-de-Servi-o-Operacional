import { auth, db } from "./firebase-config.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy
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

                <td>${dados.protocolo}</td>

                <td>${dados.solicitante}</td>

                <td>${dados.tipoServico}</td>

<td>
    <span class="status pendente">
        ${dados.status}
    </span>
</td>

<td>
    ${formatarData(dados.dataCriacao)}
</td>

<td>
    <button
        class="btn-visualizar"
        data-id="${doc.id}">
        Visualizar
    </button>
</td>

            </tr>
        `;

    });

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
