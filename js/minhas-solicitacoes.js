import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    db
} from "./firebase-config.js";


// ==========================================
// USUÁRIO / ANALISTA LOGADO
// ==========================================

// Por enquanto, estamos utilizando o analista
// que está identificado no sistema.

const ANALISTA_RESPONSAVEL = "Matheus Damica";


// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

const tabela =
    document.getElementById(
        "tabelaMinhasSolicitacoes"
    );

const totalSolicitacoes =
    document.getElementById(
        "totalMinhasSolicitacoes"
    );

const totalPendentes =
    document.getElementById(
        "totalPendentes"
    );

const totalAndamento =
    document.getElementById(
        "totalAndamento"
    );

const totalConcluidas =
    document.getElementById(
        "totalConcluidas"
    );


// ==========================================
// CARREGAR MINHAS SOLICITAÇÕES
// ==========================================

async function carregarMinhasSolicitacoes() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "solicitacoes"
                )
            );

        let minhasSolicitacoes = [];

       snapshot.forEach((doc) => {

    const dados = doc.data();

           console.log("DADOS DA SOLICITAÇÃO:", dados);

    console.log("================================");
    console.log("ID da solicitação:", doc.id);
    console.log("Dados completos:", dados);
    console.log("Analista encontrado:", dados.analista);
    console.log("Analista procurado:", ANALISTA_RESPONSAVEL);

    if (
        dados.analista &&
        dados.analista.trim().toLowerCase() ===
        ANALISTA_RESPONSAVEL.trim().toLowerCase()
    ) {

        console.log("SOLICITAÇÃO ADICIONADA!");

        minhasSolicitacoes.push({

            id: doc.id,

            ...dados

        });

    }

});


        // ORDENA DA MAIS RECENTE
        // PARA A MAIS ANTIGA

        minhasSolicitacoes.sort(
            (a, b) => {

                const dataA =
                    a.dataCriacao?.toDate
                        ? a.dataCriacao.toDate()
                        : new Date(0);

                const dataB =
                    b.dataCriacao?.toDate
                        ? b.dataCriacao.toDate()
                        : new Date(0);

                return dataB - dataA;

            }
        );


        // LIMPA A TABELA

        tabela.innerHTML = "";


        // CONTADORES

        let pendentes = 0;

        let andamento = 0;

        let concluidas = 0;


        // PERCORRE AS SOLICITAÇÕES

        minhasSolicitacoes.forEach((dados) => {

            const status =
                (dados.status || "")
                    .toLowerCase();


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


            // FORMATA DATA

            let dataFormatada =
                "Não informado";


            if (
                dados.dataCriacao?.toDate
            ) {

                dataFormatada =
                    dados.dataCriacao
                        .toDate()
                        .toLocaleDateString(
                            "pt-BR"
                        );

            }


            // STATUS

            let classeStatus =
                "pendente";


            if (
                status === "em andamento"
            ) {

                classeStatus =
                    "andamento";

            }


            if (
                status === "concluída" ||
                status === "concluida"
            ) {

                classeStatus =
                    "concluida";

            }


            // CRIA LINHA DA TABELA

            const linha =
                document.createElement(
                    "tr"
                );


            linha.innerHTML = `

                <td>
                    ${dados.protocolo || "-"}
                </td>

                <td>
                    ${dados.nome || "-"}
                </td>

                <td>
                    ${dados.categoria || "-"}
                </td>

                <td>

                    <span
                        class="status ${classeStatus}"
                    >

                        ${dados.status || "Pendente"}

                    </span>

                </td>

                <td>
                    ${dataFormatada}
                </td>

                <td>

                    <button
                        class="btn-visualizar"
                    >

                        <i
                            class="fa-solid fa-eye"
                        ></i>

                        Visualizar

                    </button>

                </td>

            `;


            // BOTÃO VISUALIZAR

            linha
                .querySelector(
                    ".btn-visualizar"
                )
                .addEventListener(
                    "click",
                    () => {

                        abrirModalSolicitacao(
                            dados
                        );

                    }
                );


            tabela.appendChild(
                linha
            );

        });


        // ATUALIZA OS CARDS

        totalSolicitacoes.textContent =
            minhasSolicitacoes.length;

        totalPendentes.textContent =
            pendentes;

        totalAndamento.textContent =
            andamento;

        totalConcluidas.textContent =
            concluidas;


        // SE NÃO EXISTIREM SOLICITAÇÕES

        if (
            minhasSolicitacoes.length === 0
        ) {

            tabela.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        style="
                            text-align: center;
                            padding: 30px;
                        "
                    >

                        Nenhuma solicitação encontrada
                        sob sua responsabilidade.

                    </td>

                </tr>

            `;

        }


    } catch (erro) {

        console.error(
            "Erro ao carregar minhas solicitações:",
            erro
        );

    }

}


// ==========================================
// ABRIR MODAL DA SOLICITAÇÃO
// ==========================================

function abrirModalSolicitacao(dados) {

    const modal =
        document.getElementById(
            "modalSolicitacao"
        );

    const detalhes =
        document.getElementById(
            "detalhesSolicitacao"
        );


    detalhes.innerHTML = `

        <div class="detalhe-grupo">

            <span>
                Protocolo
            </span>

            <strong>
                ${dados.protocolo || "-"}
            </strong>

        </div>


        <div class="detalhe-grupo">

            <span>
                Status
            </span>

            <strong>
                ${dados.status || "-"}
            </strong>

        </div>


        <div class="detalhe-grupo">

            <span>
                Solicitante
            </span>

            <strong>
                ${dados.nome || "-"}
            </strong>

        </div>


        <div class="detalhe-grupo">

            <span>
                E-mail
            </span>

            <strong>
                ${dados.email || "-"}
            </strong>

        </div>


        <div class="detalhe-grupo">

            <span>
                Categoria
            </span>

            <strong>
                ${dados.categoria || "-"}
            </strong>

        </div>


        <div class="detalhe-grupo">

    <span>
        Analista Responsável
    </span>

    <strong>
        ${dados.analista || "-"}
    </strong>

</div>


        <div class="detalhe-grupo">

            <span>
                Descrição da Solicitação
            </span>

            <strong>
                ${dados.descricao || "-"}
            </strong>

        </div>

    `;


    modal.style.display =
        "flex";

}


// ==========================================
// FECHAR MODAL
// ==========================================

document
    .getElementById(
        "fecharModal"
    )
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "modalSolicitacao"
                )
                .style.display =
                    "none";

        }
    );


// ==========================================
// INICIAR PÁGINA
// ==========================================

carregarMinhasSolicitacoes();
