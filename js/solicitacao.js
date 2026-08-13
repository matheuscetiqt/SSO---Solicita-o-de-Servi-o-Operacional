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

    const nome = document.getElementById("nomeUsuario").textContent;
    const email = document.getElementById("emailUsuario").textContent;
    const analista = document.getElementById("analistaResponsavel").textContent;

    let tipoServico = "";

    const cardSelecionado = document.querySelector(".card-servico.active");

    if (cardSelecionado) {

        tipoServico = cardSelecionado.querySelector("h3").textContent;

    }

    try {

        const protocolo = "SSO-" + Date.now();

       await addDoc(collection(db, "solicitacoes"), {

    protocolo: protocolo,

    solicitante: nome,

    email: email,

    analista: analista,

    tipoServico: tipoServico,

    status: "Pendente",

    dataCriacao: serverTimestamp(),

    // DADOS DA SOLICITAÇÃO DE COMPRA - SERVIÇO

    tipoSC:
        document.querySelector('input[name="tipoSC"]:checked')?.value || "",

    professor:
        document.getElementById("professor")?.value || "",

    scAnterior:
        document.getElementById("scAnterior")?.value || "",

    cpfCnpj:
        document.querySelector('input[name="cpfcnpj"]:checked')?.value || "",

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

});
        alert("Solicitação enviada com sucesso!");

    } catch (erro) {

        console.error(erro);

        alert("Erro ao salvar a solicitação.");

    }

});
