import { auth, db } from "./firebase-config.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    getDocs
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

    cards.forEach((card) => {

        card.addEventListener("click", () => {

            cards.forEach(c => c.classList.remove("active"));

            card.classList.add("active");

            const titulo = card.querySelector("h3").textContent.trim();

            if (titulo === "Solicitação de Compra") {

                blocoSC.style.display = "block";

            } else {

                blocoSC.style.display = "none";

            }

        });

    });
const radiosSC = document.querySelectorAll('input[name="tipoSC"]');

radiosSC.forEach((radio) => {

    radio.addEventListener("change", () => {

        if (radio.value === "Servico" && radio.checked) {

            document.getElementById("formServico").style.display = "block";

        } else if (radio.value === "Produto" && radio.checked) {

            document.getElementById("formServico").style.display = "none";

        }

    });

});
}
