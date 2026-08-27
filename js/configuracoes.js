import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    auth
} from "./firebase-config.js";


// ==========================================
// ADMINISTRADORES DO SISTEMA
// ==========================================

const ADMINISTRADORES = [

    "rbenites@cetiqt.senai.br",

    "mdrconceicao@cetiqt.senai.br"

];


// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

const nomeUsuario =
    document.getElementById(
        "nomeUsuario"
    );

const emailUsuario =
    document.getElementById(
        "emailUsuario"
    );

const areaAdministracao =
    document.getElementById(
        "areaAdministracao"
    );

const btnSair =
    document.getElementById(
        "btnSair"
    );


// ==========================================
// VERIFICAR USUÁRIO LOGADO
// ==========================================

onAuthStateChanged(
    auth,
    (usuario) => {

        // SE NÃO ESTIVER LOGADO

        if (!usuario) {

            window.location.href =
                "index.html";

            return;

        }


        // ==================================
        // MOSTRAR DADOS DO USUÁRIO
        // ==================================

        nomeUsuario.textContent =
            usuario.displayName ||
            "Não informado";

        emailUsuario.textContent =
            usuario.email ||
            "Não informado";


        // ==================================
        // VERIFICAR SE É ADMINISTRADOR
        // ==================================

        const email =
            usuario.email
                .toLowerCase()
                .trim();


        const ehAdministrador =
            ADMINISTRADORES.includes(
                email
            );


        // ==================================
        // MOSTRAR ÁREA ADMINISTRATIVA
        // ==================================

        if (ehAdministrador) {

            areaAdministracao.style.display =
                "block";

        } else {

            areaAdministracao.style.display =
                "none";

        }

    }
);


// ==========================================
// BOTÃO SAIR
// ==========================================

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

        }

    }
);
