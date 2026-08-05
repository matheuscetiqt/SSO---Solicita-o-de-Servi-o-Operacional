console.log("Arquivo solicitacao.js carregado");

import { auth, db } from "./firebase-config.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    console.log(user);

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

        }

    });

});

async function salvarSolicitacao(dados) {

    const { data, error } = await supabase
        .from('solicitacoes')
        .insert([dados]);

    if (error) {
        console.error(error);
        alert("Erro ao salvar solicitação.");
        return false;
    }

    alert("Solicitação enviada com sucesso!");

    return true;
}
