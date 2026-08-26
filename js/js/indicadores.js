import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-config.js";


// ==========================================
// ELEMENTOS DOS INDICADORES
// ==========================================

const totalSolicitacoes =
    document.getElementById("indicadorTotal");

const totalPendentes =
    document.getElementById("indicadorPendentes");

const totalAndamento =
    document.getElementById("indicadorAndamento");

const totalConcluidas =
    document.getElementById("indicadorConcluidas");


// ==========================================
// CARREGAR INDICADORES
// ==========================================

async function carregarIndicadores() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "solicitacoes"
                )
            );


        let total = 0;

        let pendentes = 0;

        let andamento = 0;

        let concluidas = 0;


        snapshot.forEach((doc) => {

            const dados =
                doc.data();

            total++;


            const status =
                (dados.status || "")
                    .toLowerCase()
                    .trim();


            if (
                status === "pendente"
            ) {

                pendentes++;

            }


            if (
                status === "em andamento"
            ) {

                andamento++;

            }


            if (
                status === "concluída" ||
                status === "concluida"
            ) {

                concluidas++;

            }

        });


        totalSolicitacoes.textContent =
            total;

        totalPendentes.textContent =
            pendentes;

        totalAndamento.textContent =
            andamento;

        totalConcluidas.textContent =
            concluidas;


    } catch (erro) {

        console.error(
            "Erro ao carregar indicadores:",
            erro
        );

    }

}


// ==========================================
// INICIAR
// ==========================================

carregarIndicadores();
