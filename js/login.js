import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector("form");

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email =
            document
                .querySelector('input[type="email"]')
                .value
                .trim()
                .toLowerCase();

        const senha =
            document
                .querySelector('input[type="password"]')
                .value;


        // ==========================================
        // VALIDAÇÃO DOS CAMPOS
        // ==========================================

        if (!email || !senha) {

            alert("Informe o e-mail e a senha.");

            return;
        }


        try {

            // ==========================================
            // FAZ LOGIN NO FIREBASE
            // ==========================================

            const credencial =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    senha
                );


            const usuario =
                credencial.user;


            // ==========================================
            // BUSCA O COLABORADOR PELO UID
            // ==========================================

            const consulta =
                query(
                    collection(db, "colaboradores"),
                    where("uid", "==", usuario.uid)
                );


            const resultado =
                await getDocs(consulta);


            // ==========================================
            // VERIFICA SE É ADMINISTRADOR
            // ==========================================

            const ADMINISTRADORES = [

                "mdrconceicao@cetiqt.senai.br",
                "rbenites@cetiqt.senai.br"

            ];


            const ehAdministrador =
                ADMINISTRADORES.includes(email);


            // ==========================================
            // SE NÃO FOR ADMINISTRADOR,
            // PRECISA ESTAR CADASTRADO COMO COLABORADOR
            // ==========================================

            if (!ehAdministrador) {

                if (resultado.empty) {

                    await signOut(auth);

                    alert(
                        "Seu acesso não está cadastrado como colaborador."
                    );

                    return;
                }


                // ==========================================
                // PEGA OS DADOS DO COLABORADOR
                // ==========================================

                const colaborador =
                    resultado.docs[0].data();


                // ==========================================
                // VERIFICA O STATUS
                // ==========================================

                const status =
                    String(
                        colaborador.status || ""
                    )
                    .toLowerCase()
                    .trim();


                // ==========================================
                // COLABORADOR INATIVO
                // ==========================================

                if (status !== "ativo") {

                    await signOut(auth);

                    alert(
                        "Seu acesso está inativo. Entre em contato com o administrador."
                    );

                    return;
                }

            }


            // ==========================================
            // ACESSO LIBERADO
            // ==========================================

            window.location.href =
                "dashboard.html";


        } catch (error) {

            console.error(
                "Erro ao fazer login:",
                error
            );


            // ==========================================
            // ERRO DE LOGIN
            // ==========================================

            alert(
                "E-mail ou senha inválidos."
            );

        }

    });

});
