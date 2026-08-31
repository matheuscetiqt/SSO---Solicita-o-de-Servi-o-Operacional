import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    onAuthStateChanged,
    signOut,
    updatePassword,
    createUserWithEmailAndPassword,
    getAuth,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-config.js";

// ==========================================
// AUTH SECUNDÁRIO PARA CADASTRO
// ==========================================

const firebaseConfigSecundario = {

    apiKey:
        "AIzaSyCH74K5lI5LFen7nvSNzXdUBthmF9-jGQo",

    authDomain:
        "sso-operacional.firebaseapp.com",

    projectId:
        "sso-operacional",

    storageBucket:
        "sso-operacional.firebasestorage.app",

    messagingSenderId:
        "446993332337",

    appId:
        "1:446993332337:web:1404c4f6a1cfebab8b43d0"

};


const appSecundario =
    initializeApp(
        firebaseConfigSecundario,
        "appSecundario"
    );


const authSecundario =
    getAuth(
        appSecundario
    );

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


    carregarColaboradores();


} else {

    areaAdministracao.style.display =
        "none";

}

    }
);

// ==========================================
// ATIVAR / DESATIVAR COLABORADOR
// ==========================================

async function alterarStatusColaborador(
    idColaborador,
    statusAtual
) {

    const novoStatus =
        statusAtual === "ativo"
            ? "inativo"
            : "ativo";


    const acao =
        novoStatus === "ativo"
            ? "ativar"
            : "desativar";


    const confirmar =
        confirm(
            `Deseja realmente ${acao} este colaborador?`
        );


    if (!confirmar) {
        return;
    }


    try {

        await updateDoc(
            doc(
                db,
                "colaboradores",
                idColaborador
            ),
            {
                status: novoStatus
            }
        );


        alert(
            novoStatus === "ativo"
                ? "Colaborador ativado com sucesso!"
                : "Colaborador desativado com sucesso!"
        );


        await carregarColaboradores();


    } catch (erro) {

        console.error(
            "Erro ao alterar status do colaborador:",
            erro
        );


        alert(
            "Não foi possível alterar o status do colaborador."
        );

    }

}
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
// CARREGAR COLABORADORES
// ==========================================

async function carregarColaboradores() {

    const tabela =
        document.getElementById(
            "tabelaColaboradores"
        );


    if (!tabela) {
        return;
    }


    try {

        tabela.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align: center;
                        padding: 30px;
                    "
                >
                    Carregando colaboradores...
                </td>
            </tr>
        `;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "colaboradores"
                )
            );


        tabela.innerHTML = "";


        if (snapshot.empty) {

            tabela.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        style="
                            text-align: center;
                            padding: 30px;
                        "
                    >
                        Nenhum colaborador cadastrado.
                    </td>
                </tr>
            `;

            return;
        }


        snapshot.forEach((documento) => {

            const dados =
                documento.data();


            let dataCadastro = "-";


            if (
                dados.dataCadastro &&
                dados.dataCadastro.toDate
            ) {

                dataCadastro =
                    dados.dataCadastro
                        .toDate()
                        .toLocaleDateString(
                            "pt-BR"
                        );

            }


            const status =
                dados.status || "ativo";


            const statusTexto =
                status === "ativo"
                    ? "Ativo"
                    : "Inativo";


            const classeStatus =
                status === "ativo"
                    ? "ativo"
                    : "inativo";


            tabela.innerHTML += `

                <tr>

                    <td>
                        <strong>
                            ${dados.nome || "-"}
                        </strong>
                    </td>

                    <td>
                        ${dados.email || "-"}
                    </td>

                    <td>
                        ${dados.adicionadoPor || "-"}
                    </td>

                    <td>
                        ${dataCadastro}
                    </td>

                    <td>

                        <span
                            class="status-colaborador ${classeStatus}"
                        >
                            ${statusTexto}
                        </span>

                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn-acao-colaborador"
                            data-id="${documento.id}"
                            data-status="${status}"
                        >

                            <i
                                class="fa-solid ${
                                    status === "ativo"
                                        ? "fa-user-slash"
                                        : "fa-user-check"
                                }"
                            ></i>

                            ${
                                status === "ativo"
                                    ? "Desativar"
                                    : "Ativar"
                            }

                        </button>

                    </td>

                </tr>

            `;

        });

        document
    .querySelectorAll(
        ".btn-acao-colaborador"
    )
    .forEach((botao) => {

        botao.addEventListener(
            "click",
            () => {

                alterarStatusColaborador(
                    botao.dataset.id,
                    botao.dataset.status
                );

            }
        );

    });


    } catch (erro) {

        console.error(
            "Erro ao carregar colaboradores:",
            erro
        );


        tabela.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align: center;
                        padding: 30px;
                    "
                >
                    Não foi possível carregar os colaboradores.
                </td>
            </tr>
        `;

    }

}
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
// VALIDAR CAMPOS DO COLABORADOR
// ==========================================

salvarColaborador.addEventListener(
    "click",
    async () => {

        const nome =
            nomeColaborador.value.trim();

        const email =
            emailColaborador.value
                .trim()
                .toLowerCase();

        const senha =
            senhaColaborador.value.trim();


        // ==================================
        // VALIDAR NOME
        // ==================================

        if (!nome) {

            alert(
                "Digite o nome do colaborador."
            );

            nomeColaborador.focus();

            return;

        }


        if (nome.length < 3) {

            alert(
                "O nome deve possuir pelo menos 3 caracteres."
            );

            nomeColaborador.focus();

            return;

        }


        // ==================================
        // VALIDAR E-MAIL
        // ==================================

        if (!email) {

            alert(
                "Digite o e-mail do colaborador."
            );

            emailColaborador.focus();

            return;

        }


        const emailValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailValido.test(email)) {

            alert(
                "Digite um e-mail válido."
            );

            emailColaborador.focus();

            return;

        }


        // ==================================
        // VALIDAR SENHA
        // ==================================

        if (!senha) {

            alert(
                "Digite uma senha para o colaborador."
            );

            senhaColaborador.focus();

            return;

        }


        if (senha.length < 6) {

            alert(
                "A senha deve possuir pelo menos 6 caracteres."
            );

            senhaColaborador.focus();

            return;

        }


        // ==================================
// CRIAR COLABORADOR
// ==================================

try {

    salvarColaborador.disabled = true;

    salvarColaborador.textContent =
        "Criando acesso...";


    const usuarioAtual =
        auth.currentUser;


    if (!usuarioAtual) {

        alert(
            "Não foi possível identificar o administrador responsável."
        );

        return;

    }


    // CRIAR USUÁRIO NO FIREBASE

    const credencial =
    await createUserWithEmailAndPassword(
        authSecundario,
        email,
        senha
    );


    const novoUsuario =
        credencial.user;


    // SALVAR INFORMAÇÕES DO COLABORADOR

    await addDoc(
        collection(
            db,
            "colaboradores"
        ),
        {

            nome: nome,

            email: email,

            uid:
                novoUsuario.uid,

            status:
                "ativo",

            adicionadoPor:
                usuarioAtual.displayName ||
                usuarioAtual.email,

            emailAdministrador:
                usuarioAtual.email,

            dataCadastro:
                serverTimestamp()

        }
    );


    alert(
        "Colaborador cadastrado com sucesso!"
    );


    modalAdicionarColaborador.style.display =
        "none";


    nomeColaborador.value = "";

    emailColaborador.value = "";

    senhaColaborador.value = "";


} catch (erro) {

    console.error(
        "Erro ao cadastrar colaborador:",
        erro
    );


    if (
        erro.code ===
        "auth/email-already-in-use"
    ) {

        alert(
            "Este e-mail já possui um cadastro."
        );

    } else {

        alert(
            "Não foi possível criar o colaborador."
        );

    }

} finally {

    salvarColaborador.disabled = false;

    salvarColaborador.textContent =
        "Criar acesso";

}

    }
);
