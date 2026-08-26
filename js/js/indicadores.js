import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    db
} from "./firebase-config.js";


// ==========================================
// ELEMENTOS DOS INDICADORES
// ==========================================

const totalSolicitacoes =
    document.getElementById(
        "indicadorTotal"
    );

const totalPendentes =
    document.getElementById(
        "indicadorPendentes"
    );

const totalAndamento =
    document.getElementById(
        "indicadorAndamento"
    );

const taxaConclusao =
    document.getElementById(
        "indicadorTaxaConclusao"
    );


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


        // CONTADORES

        let total = 0;

        let pendentes = 0;

        let andamento = 0;

        let concluidas = 0;


        // DADOS PARA OS GRÁFICOS

        const categorias = {};

        const analistas = {};

        const evolucao = {};


        // PERCORRE TODAS AS SOLICITAÇÕES

        snapshot.forEach((doc) => {

            const dados =
                doc.data();


            // ==========================================
            // TOTAL
            // ==========================================

            total++;


            // ==========================================
            // STATUS
            // ==========================================

            const status =
                (dados.status || "Pendente")
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


            // ==========================================
            // CATEGORIA
            // ==========================================

            const categoria =
                dados.categoria ||
                "Não informado";


            if (
                categorias[categoria]
            ) {

                categorias[categoria]++;

            } else {

                categorias[categoria] = 1;

            }


            // ==========================================
            // ANALISTA
            // ==========================================

            const analista =
                dados.analista ||
                dados.analistaResponsavel ||
                "Não informado";


            if (
                analistas[analista]
            ) {

                analistas[analista]++;

            } else {

                analistas[analista] = 1;

            }


            // ==========================================
            // EVOLUÇÃO POR DATA
            // ==========================================

            if (
                dados.dataCriacao?.toDate
            ) {

                const data =
                    dados.dataCriacao
                        .toDate();


                const dataFormatada =
                    data.toLocaleDateString(
                        "pt-BR"
                    );


                if (
                    evolucao[dataFormatada]
                ) {

                    evolucao[dataFormatada]++;

                } else {

                    evolucao[dataFormatada] = 1;

                }

            }

        });


        // ==========================================
        // ATUALIZA OS CARDS
        // ==========================================

        totalSolicitacoes.textContent =
            total;

        totalPendentes.textContent =
            pendentes;

        totalAndamento.textContent =
            andamento;


        // TAXA DE CONCLUSÃO

        let percentualConclusao = 0;


        if (
            total > 0
        ) {

            percentualConclusao =
                Math.round(
                    (concluidas / total) * 100
                );

        }


        taxaConclusao.textContent =
            percentualConclusao + "%";


        // ==========================================
        // GRÁFICO POR STATUS
        // ==========================================

        const ctxStatus =
            document
                .getElementById(
                    "graficoStatus"
                );


        new Chart(
            ctxStatus,
            {

                type: "doughnut",

                data: {

                    labels: [
                        "Pendentes",
                        "Em Andamento",
                        "Concluídas"
                    ],

                    datasets: [

                        {

                            data: [
                                pendentes,
                                andamento,
                                concluidas
                            ],

                            backgroundColor: [
                                "#3B82F6",
                                "#F59E0B",
                                "#10B981"
                            ]

                        }

                    ]

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

            }
        );


        // ==========================================
        // GRÁFICO POR CATEGORIA
        // ==========================================

        const ctxCategoria =
            document
                .getElementById(
                    "graficoCategoria"
                );


        new Chart(
            ctxCategoria,
            {

                type: "bar",

                data: {

                    labels:
                        Object.keys(
                            categorias
                        ),

                    datasets: [

                        {

                            label:
                                "Solicitações",

                            data:
                                Object.values(
                                    categorias
                                ),

                            backgroundColor:
                                "#005A9C",

                            borderRadius:
                                8

                        }

                    ]

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

                            ticks: {

                                precision: 0

                            }

                        }

                    }

                }

            }
        );


        // ==========================================
        // GRÁFICO DE EVOLUÇÃO
        // ==========================================

        const datasOrdenadas =
            Object.keys(
                evolucao
            ).sort(
                (a, b) => {

                    const dataA =
                        a
                            .split("/")
                            .reverse()
                            .join("-");


                    const dataB =
                        b
                            .split("/")
                            .reverse()
                            .join("-");


                    return (
                        new Date(dataA) -
                        new Date(dataB)
                    );

                }
            );


        const valoresEvolucao =
            datasOrdenadas.map(
                (data) =>
                    evolucao[data]
            );


        const ctxEvolucao =
            document
                .getElementById(
                    "graficoEvolucao"
                );


        new Chart(
            ctxEvolucao,
            {

                type: "line",

                data: {

                    labels:
                        datasOrdenadas,

                    datasets: [

                        {

                            label:
                                "Solicitações",

                            data:
                                valoresEvolucao,

                            borderColor:
                                "#005A9C",

                            backgroundColor:
                                "rgba(0, 90, 156, 0.1)",

                            fill: true,

                            tension: 0.4

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            position: "top"

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                precision: 0

                            }

                        }

                    }

                }

            }
        );


        // ==========================================
        // GRÁFICO POR ANALISTA
        // ==========================================

        const ctxAnalistas =
            document
                .getElementById(
                    "graficoAnalistas"
                );


        new Chart(
            ctxAnalistas,
            {

                type: "bar",

                data: {

                    labels:
                        Object.keys(
                            analistas
                        ),

                    datasets: [

                        {

                            label:
                                "Solicitações",

                            data:
                                Object.values(
                                    analistas
                                ),

                            backgroundColor:
                                "#003B71",

                            borderRadius:
                                8

                        }

                    ]

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

                            ticks: {

                                precision: 0

                            }

                        }

                    }

                }

            }
        );


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
