import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    db,
    auth
} from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// ==========================================
// AGUARDAR USUÁRIO LOGADO
// ==========================================

onAuthStateChanged(
    auth,
    (usuario) => {

        if (!usuario) {

            window.location.href =
                "index.html";

            return;

        }

        carregarIndicadores();

    }
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


        // ==========================================
        // CONTADORES
        // ==========================================

        let total = 0;

        let pendentes = 0;

        let andamento = 0;

        let concluidas = 0;


        // DADOS PARA OS GRÁFICOS

        const categorias = {};

        const datas = {};

        const analistas = {};


        // ==========================================
        // PERCORRER SOLICITAÇÕES
        // ==========================================

        snapshot.forEach((doc) => {

            const dados =
                doc.data();

            total++;


            // ==========================================
            // STATUS
            // ==========================================

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


            // ==========================================
            // CATEGORIAS
            // ==========================================

            const categoria =
                dados.tipoServico ||
                dados.categoria ||
                "Não informado";


            if (!categorias[categoria]) {

                categorias[categoria] = 0;

            }

            categorias[categoria]++;


            // ==========================================
            // ANALISTA RESPONSÁVEL
            // ==========================================

            const analista =
                dados.analista ||
                "Não informado";


            if (!analistas[analista]) {

                analistas[analista] = 0;

            }

            analistas[analista]++;


            // ==========================================
            // DATA DA SOLICITAÇÃO
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
                    !datas[dataFormatada]
                ) {

                    datas[dataFormatada] = 0;

                }

                datas[dataFormatada]++;

            }

        });


        // ==========================================
        // ATUALIZAR CARDS
        // ==========================================

        document.getElementById(
            "indicadorTotal"
        ).textContent = total;


        document.getElementById(
            "indicadorPendentes"
        ).textContent = pendentes;


        document.getElementById(
            "indicadorAndamento"
        ).textContent = andamento;


        // TAXA DE CONCLUSÃO

        let taxaConclusao = 0;


        if (
            total > 0
        ) {

            taxaConclusao =
                Math.round(
                    (concluidas / total) * 100
                );

        }


        document.getElementById(
            "indicadorTaxaConclusao"
        ).textContent =
            taxaConclusao + "%";


        // ==========================================
        // GRÁFICO DE STATUS
        // ==========================================

        new Chart(
            document.getElementById(
                "graficoStatus"
            ),
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

                            ]

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false

                }

            }

        );


        // ==========================================
        // GRÁFICO DE CATEGORIAS
        // ==========================================

        new Chart(
            document.getElementById(
                "graficoCategoria"
            ),
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
                                )

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

                    }

                }

            }

        );


        // ==========================================
        // GRÁFICO DE EVOLUÇÃO
        // ==========================================

        const datasOrdenadas =
            Object.keys(datas)
                .sort(
                    (a, b) => {

                        const partesA =
                            a.split("/");

                        const partesB =
                            b.split("/");


                        const dataA =
                            new Date(
                                partesA[2],
                                partesA[1] - 1,
                                partesA[0]
                            );


                        const dataB =
                            new Date(
                                partesB[2],
                                partesB[1] - 1,
                                partesB[0]
                            );


                        return dataA - dataB;

                    }
                );


        new Chart(
            document.getElementById(
                "graficoEvolucao"
            ),
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
                                datasOrdenadas.map(
                                    data =>
                                        datas[data]
                                ),

                            tension: 0.3,

                            fill: false

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false

                }

            }

        );


        // ==========================================
        // GRÁFICO DE ANALISTAS
        // ==========================================

        new Chart(
            document.getElementById(
                "graficoAnalistas"
            ),
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
                                )

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
// BOTÃO SAIR
// ==========================================

const btnSair =
    document.getElementById(
        "btnSair"
    );


if (btnSair) {

    btnSair.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );


                window.location.href =
                    "index.html";

            } catch (erro) {

                console.error(
                    "Erro ao sair:",
                    erro
                );

                alert(
                    "Não foi possível sair do sistema."
                );

            }

        }
    );

}
