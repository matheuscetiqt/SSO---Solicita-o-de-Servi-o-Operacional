
import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const ADMINISTRADORES = [
    "mdrconceicao@cetiqt.senai.br",
    "rbenites@cetiqt.senai.br"
];

const btnSair = document.getElementById("btnSair");

if (btnSair) {
    btnSair.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "index.html";
    });
}

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const email = (user.email || "").toLowerCase().trim();

    if (ADMINISTRADORES.includes(email)) {
        return;
    }

    try {

        const consulta = query(
            collection(db, "colaboradores"),
            where("uid", "==", user.uid)
        );

        const resultado = await getDocs(consulta);

        if (resultado.empty) {

            await signOut(auth);

            alert("Seu acesso não está cadastrado no sistema.");

            window.location.href = "index.html";

            return;
        }

        const colaborador = resultado.docs[0].data();

        const status = String(
            colaborador.status || ""
        ).toLowerCase().trim();

        if (status !== "ativo") {

            await signOut(auth);

            alert("Seu acesso está inativo. Entre em contato com o administrador.");

            window.location.href = "index.html";
        }

    } catch (erro) {

        console.error("Erro ao verificar acesso:", erro);

        await signOut(auth);

        alert("Não foi possível verificar seu acesso ao sistema.");

        window.location.href = "index.html";
    }
});
