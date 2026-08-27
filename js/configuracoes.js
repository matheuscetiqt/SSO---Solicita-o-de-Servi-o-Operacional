import {
    onAuthStateChanged,
    signOut,
    updatePassword,
    createUserWithEmailAndPassword,
    getAuth,
    initializeAuth,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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
// ELEMENTOS - ALTERAR SENHA
// ==========================================

const btnAlterarSenha =
    document.getElementById(
        "btnAlterarSenha"
    );

const modalAlterarSenha =
    document.getElementById(
        "modalAlterarSenha"
    );

const fecharModalSenha =
    document.getElementById(
        "fecharModalSenha"
    );

const novaSenha =
    document.getElementById(
        "novaSenha"
    );

const confirmarSenha =
    document.getElementById(
        "confirmarSenha"
    );

const salvarNovaSenha =
    document.getElementById(
        "salvarNovaSenha"
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
// ==========================================
// ABRIR MODAL ALTERAR SENHA
// ==========================================

btnAlterarSenha.addEventListener(
    "click",
    () => {

        novaSenha.value = "";

        confirmarSenha.value = "";

        modalAlterarSenha.style.display =
            "flex";

    }
);


// ==========================================
// FECHAR MODAL ALTERAR SENHA
// ==========================================

fecharModalSenha.addEventListener(
    "click",
    () => {

        modalAlterarSenha.style.display =
            "none";

    }
);


// ==========================================
// SALVAR NOVA SENHA
// ==========================================

salvarNovaSenha.addEventListener(
    "click",
    async () => {

        const senha =
            novaSenha.value.trim();

        const confirmar =
            confirmarSenha.value.trim();


        // VALIDAÇÕES

        if (!senha) {

            alert(
                "Digite a nova senha."
            );

            return;

        }


        if (senha.length < 6) {

            alert(
                "A senha deve possuir pelo menos 6 caracteres."
            );

            return;

        }


        if (senha !== confirmar) {

            alert(
                "As senhas não coincidem."
            );

            return;

        }


        try {

            const usuario =
                auth.currentUser;


            if (!usuario) {

                alert(
                    "Usuário não identificado."
                );

                return;

            }


            // ALTERAR SENHA

            await updatePassword(
                usuario,
                senha
            );


            alert(
                "Senha alterada com sucesso!"
            );


            modalAlterarSenha.style.display =
                "none";


        } catch (erro) {

            console.error(
                "Erro ao alterar senha:",
                erro
            );


            // FIREBASE PODE EXIGIR LOGIN RECENTE

            if (
                erro.code ===
                "auth/requires-recent-login"
            ) {

                alert(
                    "Por segurança, faça login novamente antes de alterar sua senha."
                );

            } else {

                alert(
                    "Não foi possível alterar a senha."
                );

            }

        }

    }
);
// ==========================================
// ELEMENTOS - COLABORADORES
// ==========================================

const btnAdicionarColaborador =
    document.getElementById(
        "btnAdicionarColaborador"
    );

const modalAdicionarColaborador =
    document.getElementById(
        "modalAdicionarColaborador"
    );

const fecharModalColaborador =
    document.getElementById(
        "fecharModalColaborador"
    );

const nomeColaborador =
    document.getElementById(
        "nomeColaborador"
    );

const emailColaborador =
    document.getElementById(
        "emailColaborador"
    );

const senhaColaborador =
    document.getElementById(
        "senhaColaborador"
    );

const salvarColaborador =
    document.getElementById(
        "salvarColaborador"
    );
// ==========================================
// ABRIR MODAL ADICIONAR COLABORADOR
// ==========================================

if (btnAdicionarColaborador) {

    btnAdicionarColaborador.addEventListener(
        "click",
        () => {

            nomeColaborador.value = "";

            emailColaborador.value = "";

            senhaColaborador.value = "";

            modalAdicionarColaborador.style.display =
                "flex";

        }
    );

}


// ==========================================
// FECHAR MODAL ADICIONAR COLABORADOR
// ==========================================

if (fecharModalColaborador) {

    fecharModalColaborador.addEventListener(
        "click",
        () => {

            modalAdicionarColaborador.style.display =
                "none";

        }
    );

}
// ==========================================
// MODAL ADICIONAR COLABORADOR
// ==========================================

const modalAdicionarColaborador =
    document.getElementById(
        "modalAdicionarColaborador"
    );

const btnAdicionarColaborador =
    document.getElementById(
        "btnAdicionarColaborador"
    );

const fecharModalColaborador =
    document.getElementById(
        "fecharModalColaborador"
    );

const nomeColaborador =
    document.getElementById(
        "nomeColaborador"
    );

const emailColaborador =
    document.getElementById(
        "emailColaborador"
    );

const senhaColaborador =
    document.getElementById(
        "senhaColaborador"
    );

const salvarColaborador =
    document.getElementById(
        "salvarColaborador"
    );
