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

    const q = query(
        collection(db, "solicitacoes"),
        orderBy("dataCriacao", "desc")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach((doc) => {

        const dados = doc.data();

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
                    -
                </td>

            </tr>
        `;

    });

}
