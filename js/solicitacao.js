import { auth, db } from "./firebase-config.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
window.addEventListener("load", () => {

    carregarUsuario();

    configurarCards();

});

async function carregarUsuario() {

    onAuthStateChanged(auth, async (user) => {

        if (!user) {

            window.location.href = "index.html";
            return;

        }

        const emailUsuario = user.email.toLowerCase();

        const usuarios = await getDocs(collection(db, "usuarios"));

        usuarios.forEach((doc) => {

            const dados = doc.data();

           if (dados.email.toLowerCase() === emailUsuario) {

    document.getElementById("nomeUsuario").textContent = dados.nome;

    document.getElementById("emailUsuario").textContent = dados.email;

    document.getElementById("analistaResponsavel").textContent = dados.analista;

}

        });

    });

}

function configurarCards() {

    const cards = document.querySelectorAll(".card-servico");

    const blocoSC = document.getElementById("blocoSC");
    const blocoPrenota = document.getElementById("blocoPrenota");
    const blocoPedidoVenda = document.getElementById("blocoPedidoVenda");
    const blocoDocumentoEntrada = document.getElementById("blocoDocumentoEntrada");

    const formProduto = document.getElementById("formProduto");
    const formServico = document.getElementById("formServico");


    cards.forEach((card) => {

        card.addEventListener("click", () => {

            // Remove a seleção dos outros cards
            cards.forEach(c => c.classList.remove("active"));

            // Marca o card selecionado
            card.classList.add("active");


            const titulo = card.querySelector("h3").textContent.trim();


            // ==========================================
            // ESCONDE TODOS OS BLOCOS
            // ==========================================

            blocoSC.style.display = "none";

            blocoPrenota.style.display = "none";

            blocoPedidoVenda.style.display = "none";

            blocoDocumentoEntrada.style.display = "none";

            formProduto.style.display = "none";

            formServico.style.display = "none";


            // ==========================================
            // SOLICITAÇÃO DE COMPRA
            // ==========================================

            if (titulo === "Solicitação de Compra") {

                blocoSC.style.display = "block";

            }


            // ==========================================
            // ABERTURA DE PRÉ-NOTA
            // ==========================================

            else if (titulo === "Abertura de Pré-nota") {

                blocoPrenota.style.display = "block";

            }

            else if (titulo === "Pedido de Venda") {

    blocoPedidoVenda.style.display = "block";

}

            else if (titulo === "Documento de Entrada") {

    blocoDocumentoEntrada.style.display = "block";

}

        });

    });


    // ==========================================
    // PRODUTO / SERVIÇO DA SC
    // ==========================================

    const radiosSC = document.querySelectorAll(
        'input[name="tipoSC"]'
    );


    radiosSC.forEach((radio) => {

        radio.addEventListener("change", () => {

            if (radio.value === "Produto" && radio.checked) {

                formProduto.style.display = "block";

                formServico.style.display = "none";

            }


            if (radio.value === "Servico" && radio.checked) {

                formProduto.style.display = "none";

                formServico.style.display = "block";

            }

        });

    });

}
const formulario = document.querySelector("form");

formulario.addEventListener("submit", async (e) => {

    e.preventDefault();

    const nome =
        document.getElementById("nomeUsuario").textContent.trim();

    const email =
        document.getElementById("emailUsuario").textContent.trim();

    const analista =
        document.getElementById("analistaResponsavel").textContent.trim();


    // ==========================================
    // IDENTIFICA O TIPO DE SERVIÇO
    // ==========================================

    let tipoServico = "";

    const cardSelecionado =
        document.querySelector(".card-servico.active");

    if (cardSelecionado) {

        tipoServico =
            cardSelecionado.querySelector("h3").textContent.trim();

    }


    // ==========================================
    // DADOS DA PRÉ-NOTA
    // ==========================================

    let dadosPrenota = {

        valorPrenota: "",
        bancoPrenota: "",
        agenciaPrenota: "",
        contaCorrentePrenota: "",
        observacoesPrenota: ""

    };


    if (tipoServico === "Abertura de Pré-nota") {

        dadosPrenota = {

            valorPrenota:
                document.getElementById("valorPrenota")?.value || "",

            bancoPrenota:
                document.getElementById("bancoPrenota")?.value || "",

            agenciaPrenota:
                document.getElementById("agenciaPrenota")?.value || "",

            contaCorrentePrenota:
                document.getElementById("contaCorrentePrenota")?.value || "",

            observacoesPrenota:
                document.getElementById("observacoesPrenota")?.value || ""

        };

    }

        // ==========================================
    // DADOS DO PEDIDO DE VENDA
    // ==========================================

    let dadosPedidoVenda = {

        numeroNotaFiscalSGF: "",
        valorPedidoVenda: "",
        favorecido: "",
        previsaoRepasse: "",
        numeroUO: "",
        numeroCR: "",
        numeroProduto: "",
        numeroCliente: "",
        numeroLoja: "",
        numeroNatureza: ""

    };


    if (tipoServico === "Pedido de Venda") {

        dadosPedidoVenda = {

            numeroNotaFiscalSGF:
                document.getElementById("numeroNotaFiscalSGF")?.value || "",

            valorPedidoVenda:
                document.getElementById("valorPedidoVenda")?.value || "",

            favorecido:
                document.getElementById("favorecido")?.value || "",

            previsaoRepasse:
                document.getElementById("previsaoRepasse")?.value || "",

            numeroUO:
                document.getElementById("numeroUO")?.value || "",

            numeroCR:
                document.getElementById("numeroCR")?.value || "",

            numeroProduto:
                document.getElementById("numeroProduto")?.value || "",

            numeroCliente:
                document.getElementById("numeroCliente")?.value || "",

            numeroLoja:
                document.getElementById("numeroLoja")?.value || "",

            numeroNatureza:
                document.getElementById("numeroNatureza")?.value || ""

        };

    }




    // ==========================================
    // DADOS DA SOLICITAÇÃO DE COMPRA
    // ==========================================

    const dadosSC = {

        tipoSC:
            document.querySelector(
                'input[name="tipoSC"]:checked'
            )?.value || "",

        professor:
            document.getElementById("professor")?.value || "",

        scAnterior:
            document.getElementById("scAnterior")?.value || "",

        cpfCnpj:
            document.querySelector(
                'input[name="cpfcnpj"]:checked'
            )?.value || "",

        curso:
            document.getElementById("curso")?.value || "",

        atividade1:
            document.getElementById("atividade1")?.value || "",

        carga1:
            document.getElementById("carga1")?.value || "",

        atividade2:
            document.getElementById("atividade2")?.value || "",

        carga2:
            document.getElementById("carga2")?.value || "",

        disciplina:
            document.getElementById("disciplina")?.value || "",

        datasAulas:
            document.getElementById("datasAulas")?.value || "",

        valorHora:
            document.getElementById("valorHora")?.value || "",

        historico:
            document.getElementById("historico")?.value || ""

    };


    // ==========================================
    // SALVAR SOLICITAÇÃO
    // ==========================================

    try {

        const protocolo =
            "SSO-" + Date.now();


        await addDoc(
            collection(db, "solicitacoes"),
            {

                // ------------------------------
                // DADOS GERAIS
                // ------------------------------

                protocolo: protocolo,

                solicitante: nome,

                email: email,

                analista: analista,

                tipoServico: tipoServico,

                status: "Pendente",

                dataCriacao: serverTimestamp(),


                // ------------------------------
                // DADOS DA PRÉ-NOTA
                // ------------------------------

                valorPrenota:
                    dadosPrenota.valorPrenota,

                bancoPrenota:
                    dadosPrenota.bancoPrenota,

                agenciaPrenota:
                    dadosPrenota.agenciaPrenota,

                contaCorrentePrenota:
                    dadosPrenota.contaCorrentePrenota,

                observacoesPrenota:
                    dadosPrenota.observacoesPrenota,


                // ------------------------------
                // DADOS DA SOLICITAÇÃO DE COMPRA
                // ------------------------------

                tipoSC:
                    dadosSC.tipoSC,

                professor:
                    dadosSC.professor,

                scAnterior:
                    dadosSC.scAnterior,

                cpfCnpj:
                    dadosSC.cpfCnpj,

                curso:
                    dadosSC.curso,

                atividade1:
                    dadosSC.atividade1,

                carga1:
                    dadosSC.carga1,

                atividade2:
                    dadosSC.atividade2,

                carga2:
                    dadosSC.carga2,

                disciplina:
                    dadosSC.disciplina,

                datasAulas:
                    dadosSC.datasAulas,

                valorHora:
                    dadosSC.valorHora,

                                historico:
                    dadosSC.historico,


                // ------------------------------
                // DADOS DO PEDIDO DE VENDA
                // ------------------------------

                numeroNotaFiscalSGF:
                    dadosPedidoVenda.numeroNotaFiscalSGF,

                valorPedidoVenda:
                    dadosPedidoVenda.valorPedidoVenda,

                favorecido:
                    dadosPedidoVenda.favorecido,

                previsaoRepasse:
                    dadosPedidoVenda.previsaoRepasse,

                numeroUO:
                    dadosPedidoVenda.numeroUO,

                numeroCR:
                    dadosPedidoVenda.numeroCR,

                numeroProduto:
                    dadosPedidoVenda.numeroProduto,

                numeroCliente:
                    dadosPedidoVenda.numeroCliente,

                numeroLoja:
                    dadosPedidoVenda.numeroLoja,

                numeroNatureza:
                    dadosPedidoVenda.numeroNatureza

            }
        );


        alert("Solicitação enviada com sucesso!");


        // Limpa o formulário

        formulario.reset();


        // Remove seleção dos cards

        document
            .querySelectorAll(".card-servico")
            .forEach(card => {

                card.classList.remove("active");

            });


        // Esconde os formulários

        const blocoSC =
            document.getElementById("blocoSC");

        const blocoPrenota =
            document.getElementById("blocoPrenota");

                const blocoPedidoVenda =
            document.getElementById("blocoPedidoVenda");

        const formProduto =
            document.getElementById("formProduto");

        const formServico =
            document.getElementById("formServico");


        if (blocoSC) {
            blocoSC.style.display = "none";
        }

        if (blocoPrenota) {
            blocoPrenota.style.display = "none";
        }

                if (blocoPedidoVenda) {
            blocoPedidoVenda.style.display = "none";
        }

        if (formProduto) {
            formProduto.style.display = "none";
        }

        if (formServico) {
            formServico.style.display = "none";
        }


    } catch (erro) {

        console.error(
            "Erro ao salvar a solicitação:",
            erro
        );

        alert(
            "Erro ao salvar a solicitação."
        );

    }

});

   
