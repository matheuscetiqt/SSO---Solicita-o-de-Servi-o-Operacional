console.log("Arquivo solicitacao.js carregado");

import { auth, db } from "./firebase-config.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    console.log(user);
    console.log("Usuário logado:", user.email);

    if (!user) {

        window.location.href = "index.html";
        return;

    }

    const emailUsuario = user.email.toLowerCase();

    const usuarios = await getDocs(collection(db, "usuarios"));
    console.log("Quantidade de usuários:", usuarios.size);

    usuarios.forEach((doc) => {

        const dados = doc.data();
        console.log("Documento:", dados);

        if (dados.email.toLowerCase() === emailUsuario) {

            document.getElementById("nomeUsuario").textContent = dados.nome;

            document.getElementById("emailUsuario").textContent = dados.email;

        }

    });

});

document.addEventListener("DOMContentLoaded", () => {

    const cards = document.querySelectorAll(".card-servico");

    console.log("Cards encontrados:", cards.length);

    cards.forEach((card) => {

        card.addEventListener("click", () => {

            const titulo = card.querySelector("h3").textContent.trim();

            console.log("Você clicou em:", titulo);

            if (titulo === "Solicitação de Compra") {

                document.getElementById("blocoSC").style.display = "block";

            } else {

                document.getElementById("blocoSC").style.display = "none";

            }

        });

    });

});

