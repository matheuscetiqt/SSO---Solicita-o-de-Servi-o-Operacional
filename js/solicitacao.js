import { auth, db } from "./firebase-config.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
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
    const blocoOutro = document.getElementById("blocoOutro");

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

            blocoOutro.style.display = "none";

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

            else if (titulo === "Outro") {

    blocoOutro.style.display = "block";

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

// ==========================================
// ENVIA ANEXO PARA O POWER AUTOMATE
// ==========================================

const URL_POWER_AUTOMATE =
    "https://defaultcd8472815bbf4642aa28142c41b273.a0.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/23/workflows/f2039ec44ee14bd1b07de849460464bc/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=_Jo6WwgmiyswYiPkkhWMRdljxwnfrEE2aO5yT51OmjM";


function arquivoParaBase64(arquivo) {

    return new Promise((resolve, reject) => {

        const leitor = new FileReader();

        leitor.onload = () => {

            const resultado = leitor.result;

            const base64 = resultado.split(",")[1];

            resolve(base64);

        };

        leitor.onerror = reject;

        leitor.readAsDataURL(arquivo);

    });

}


async function enviarAnexosParaSharePoint(protocolo) {

const camposArquivo =
    document.querySelectorAll('input[type="file"]');

const arquivos = [];
    
// ==========================================
// ANEXOS DA SC - PRODUTO
// ==========================================

// Adiciona os arquivos que foram selecionados
// um por vez pelo botão "Adicionar anexo"
if (arquivosProduto.length > 0) {

    arquivos.push(...arquivosProduto);

}

    // ==========================================
// ANEXOS DA PRÉ-NOTA
// ==========================================

if (arquivosPrenota.length > 0) {

    arquivos.push(...arquivosPrenota);

}


    // ==========================================
// ANEXOS DO DOCUMENTO DE ENTRADA
// ==========================================

if (arquivosEntrada.length > 0) {

    arquivos.push(...arquivosEntrada);

}
// ==========================================
// DEMAIS CAMPOS DE ARQUIVO
// ==========================================

camposArquivo.forEach((campo) => {

    // Ignora o campo da SC Produto,
    // pois ele já foi tratado acima
    if (campo.id === "documentosProduto") {
        return;
    }

    if (campo.files && campo.files.length > 0) {

        for (const arquivo of campo.files) {

            arquivos.push(arquivo);

        }

    }

});

    // Se não houver anexo, retorna lista vazia
    if (arquivos.length === 0) {

        return [];

    }

    const linksArquivos = [];

    for (const arquivo of arquivos) {

        const arquivoBase64 =
            await arquivoParaBase64(arquivo);

        const resposta = await fetch(
            URL_POWER_AUTOMATE,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    protocolo: protocolo,

                    arquivoNome: arquivo.name,

                    arquivoBase64: arquivoBase64

                })

            }
        );

        if (!resposta.ok) {

            throw new Error(
                "Não foi possível enviar o arquivo " +
                arquivo.name
            );

        }

        // ==========================================
        // PEGA A RESPOSTA DO POWER AUTOMATE
        // ==========================================

        const resultado = await resposta.json();

        console.log(
            "Resposta do Power Automate:",
            resultado
        );

        // ==========================================
        // GUARDA O LINK DO SHAREPOINT
        // ==========================================

        if (resultado.arquivoUrl) {

            linksArquivos.push({

                nome: resultado.arquivoNome || arquivo.name,

                url: resultado.arquivoUrl

            });

        }

    }

    return linksArquivos;

}

let enviandoSolicitacao = false;
let envioAutorizado = false;

// ==========================================
// ANEXOS DO DOCUMENTO DE ENTRADA
// ==========================================

let arquivosEntrada = [];

const inputAnexosEntrada =
    document.getElementById("documentosEntrada");

const btnAdicionarAnexoEntrada =
    document.getElementById("btnAdicionarAnexoEntrada");

const listaAnexosEntrada =
    document.getElementById("listaAnexosEntrada");


// ==========================================
// ADICIONAR ANEXOS UM POR VEZ
// ==========================================

if (btnAdicionarAnexoEntrada && inputAnexosEntrada) {

    btnAdicionarAnexoEntrada.addEventListener("click", () => {
        inputAnexosEntrada.click();
    });

    inputAnexosEntrada.addEventListener("change", () => {

        const novosArquivos =
            Array.from(inputAnexosEntrada.files);

        if (novosArquivos.length === 0) {
            return;
        }

        if (arquivosEntrada.length + novosArquivos.length > 10) {

            alert("É possível anexar no máximo 10 arquivos.");

            inputAnexosEntrada.value = "";

            return;
        }

        arquivosEntrada.push(...novosArquivos);

        atualizarListaAnexosEntrada();

        inputAnexosEntrada.value = "";
    });
}


// ==========================================
// MOSTRA OS ANEXOS NA TELA
// ==========================================

function atualizarListaAnexosEntrada() {

    if (!listaAnexosEntrada) {
        return;
    }

    listaAnexosEntrada.innerHTML = "";

    arquivosEntrada.forEach((arquivo, index) => {

        const item = document.createElement("div");

        item.className = "anexo-item";

        item.innerHTML = `
            <span>
                <i class="fa-solid fa-file"></i>
                ${arquivo.name}
            </span>

            <button
                type="button"
                class="btn-remover-anexo"
                data-index="${index}"
                title="Remover arquivo"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        listaAnexosEntrada.appendChild(item);
    });

    listaAnexosEntrada
        .querySelectorAll(".btn-remover-anexo")
        .forEach((botao) => {

            botao.addEventListener("click", () => {

                const index =
                    Number(botao.dataset.index);

                arquivosEntrada.splice(index, 1);

                atualizarListaAnexosEntrada();
            });
        });
}

// ==========================================
// ANEXOS DA PRÉ-NOTA
// ==========================================

let arquivosPrenota = [];

const inputAnexosPrenota =
    document.getElementById("documentosPrenota");

const btnAdicionarAnexoPrenota =
    document.getElementById("btnAdicionarAnexoPrenota");

const listaAnexosPrenota =
    document.getElementById("listaAnexosPrenota");


// ==========================================
// ADICIONAR ANEXOS UM POR VEZ
// ==========================================

if (btnAdicionarAnexoPrenota && inputAnexosPrenota) {

    btnAdicionarAnexoPrenota.addEventListener("click", () => {
        inputAnexosPrenota.click();
    });

    inputAnexosPrenota.addEventListener("change", () => {

        const novosArquivos =
            Array.from(inputAnexosPrenota.files);

        if (novosArquivos.length === 0) {
            return;
        }

        // Limite de 10 arquivos
        if (arquivosPrenota.length + novosArquivos.length > 10) {

            alert("É possível anexar no máximo 10 arquivos.");

            inputAnexosPrenota.value = "";

            return;
        }

        // Adiciona sem substituir os anteriores
        arquivosPrenota.push(...novosArquivos);

        atualizarListaAnexosPrenota();

        // Limpa o input para permitir novo anexo
        inputAnexosPrenota.value = "";
    });
}


// ==========================================
// MOSTRA OS ANEXOS NA TELA
// ==========================================

function atualizarListaAnexosPrenota() {

    if (!listaAnexosPrenota) {
        return;
    }

    listaAnexosPrenota.innerHTML = "";

    arquivosPrenota.forEach((arquivo, index) => {

        const item = document.createElement("div");

        item.className = "anexo-item";

        item.innerHTML = `
            <span>
                <i class="fa-solid fa-file"></i>
                ${arquivo.name}
            </span>

            <button
                type="button"
                class="btn-remover-anexo"
                data-index="${index}"
                title="Remover arquivo"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        listaAnexosPrenota.appendChild(item);
    });

    listaAnexosPrenota
        .querySelectorAll(".btn-remover-anexo")
        .forEach((botao) => {

            botao.addEventListener("click", () => {

                const index =
                    Number(botao.dataset.index);

                arquivosPrenota.splice(index, 1);

                atualizarListaAnexosPrenota();
            });
        });
}

// ==========================================
// ANEXOS DA SOLICITAÇÃO DE COMPRA - PRODUTO
// ==========================================

let arquivosProduto = [];

const inputAnexosProduto =
    document.getElementById("documentosProduto");

const btnAdicionarAnexoProduto =
    document.getElementById("btnAdicionarAnexoProduto");

const listaAnexosProduto =
    document.getElementById("listaAnexosProduto");

const formulario = document.querySelector("form");

const botaoEnviar =
    formulario.querySelector('button[type="submit"]');

// ==========================================
// ADICIONAR ANEXOS UM POR VEZ
// ==========================================

if (btnAdicionarAnexoProduto && inputAnexosProduto) {

    btnAdicionarAnexoProduto.addEventListener("click", () => {
        inputAnexosProduto.click();
    });

    inputAnexosProduto.addEventListener("change", () => {

        const novosArquivos = Array.from(inputAnexosProduto.files);

        if (novosArquivos.length === 0) {
            return;
        }

        // Limite de 10 arquivos
        if (arquivosProduto.length + novosArquivos.length > 10) {

            alert("É possível anexar no máximo 10 arquivos.");

            inputAnexosProduto.value = "";

            return;
        }

        // Adiciona os novos arquivos sem apagar os anteriores
        arquivosProduto.push(...novosArquivos);

        atualizarListaAnexosProduto();

        // Limpa o input para permitir selecionar
        // outro arquivo no próximo clique
        inputAnexosProduto.value = "";
    });
}

// ==========================================
// MOSTRA OS ANEXOS NA TELA
// ==========================================

function atualizarListaAnexosProduto() {

    if (!listaAnexosProduto) {
        return;
    }

    listaAnexosProduto.innerHTML = "";

    arquivosProduto.forEach((arquivo, index) => {

        const item = document.createElement("div");

        item.className = "anexo-item";

        item.innerHTML = `
            <span>
                <i class="fa-solid fa-file"></i>
                ${arquivo.name}
            </span>

            <button
                type="button"
                class="btn-remover-anexo"
                data-index="${index}"
                title="Remover arquivo"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        listaAnexosProduto.appendChild(item);
    });

    document
        .querySelectorAll(".btn-remover-anexo")
        .forEach((botao) => {

            botao.addEventListener("click", () => {

                const index =
                    Number(botao.dataset.index);

                arquivosProduto.splice(index, 1);

                atualizarListaAnexosProduto();
            });
        });
}
// ==========================================
// AUTORIZAR ENVIO SOMENTE PELO BOTÃO
// ==========================================

if (botaoEnviar) {

    botaoEnviar.addEventListener("click", () => {

        envioAutorizado = true;

    });

}


// ==========================================
// BLOQUEAR ENTER COMO SUBMIT
// ==========================================

formulario.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        e.preventDefault();

    }

});


// ==========================================
// ENVIO DO FORMULÁRIO
// ==========================================

formulario.addEventListener("submit", async (e) => {

    e.preventDefault();


    // ==========================================
    // SÓ PERMITE SE CLICOU NO BOTÃO
    // ==========================================

    if (!envioAutorizado) {

        return;

    }


    // ==========================================
    // TRAVA CONTRA DUPLO ENVIO
    // ==========================================

    if (enviandoSolicitacao) {

        return;

    }

    enviandoSolicitacao = true;

    if (botaoEnviar) {

        botaoEnviar.disabled = true;

        botaoEnviar.dataset.textoOriginal =
            botaoEnviar.innerHTML;

        botaoEnviar.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Enviando...
        `;

        botaoEnviar.style.opacity = "0.7";

        botaoEnviar.style.cursor = "not-allowed";

    }

if (botaoEnviar) {
    botaoEnviar.disabled = true;
    botaoEnviar.dataset.textoOriginal = botaoEnviar.innerHTML;

    botaoEnviar.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Enviando...
    `;

    botaoEnviar.style.opacity = "0.7";
    botaoEnviar.style.cursor = "not-allowed";
}

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
// DADOS DO DOCUMENTO DE ENTRADA
// ==========================================

let dadosDocumentoEntrada = {

    numeroPedidoEntrada: "",
    valorEntrada: "",
    documentosEntrada: ""

};

if (tipoServico === "Documento de Entrada") {

    dadosDocumentoEntrada = {

        numeroPedidoEntrada:
            document.getElementById("numeroPedidoEntrada")?.value || "",

        valorEntrada:
            document.getElementById("valorEntrada")?.value || "",

        documentosEntrada:
            document.getElementById("documentosEntrada")?.files?.length
                ? document.getElementById("documentosEntrada").files[0].name
                : ""

    };

}

    // ==========================================
// DADOS DE OUTRO SERVIÇO
// ==========================================

let dadosOutro = {

    descricaoOutro: ""

};

if (tipoServico === "Outro") {

    dadosOutro = {

        descricaoOutro:
            document.getElementById("descricaoOutro")?.value || ""

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

const referenciaSolicitacao = await addDoc(
    collection(db, "solicitacoes"),
    {

                // ------------------------------
                // DADOS GERAIS
                // ------------------------------

                protocolo: protocolo,
        
        uid: auth.currentUser.uid,
        
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
                    dadosPedidoVenda.numeroNatureza,

                // ------------------------------
// DADOS DO DOCUMENTO DE ENTRADA
// ------------------------------

numeroPedidoEntrada:
    dadosDocumentoEntrada.numeroPedidoEntrada,

valorEntrada:
    dadosDocumentoEntrada.valorEntrada,

documentosEntrada:
    dadosDocumentoEntrada.documentosEntrada,


// ------------------------------
// DADOS DE OUTRO SERVIÇO
// ------------------------------

descricaoOutro:
    dadosOutro.descricaoOutro

            }
                );

        // ==========================================
        // ENVIA ANEXOS PARA O SHAREPOINT
        // ==========================================

       try {

    const linksArquivos =
        await enviarAnexosParaSharePoint(protocolo);

    // ==========================================
    // SALVA OS LINKS DOS ARQUIVOS NO FIREBASE
    // ==========================================

    if (linksArquivos.length > 0) {

        await updateDoc(
            doc(db, "solicitacoes", referenciaSolicitacao.id),
            {
                anexos: linksArquivos
            }
        );

        console.log(
            "Links dos anexos salvos no Firebase:",
            linksArquivos
        );

    }

} catch (erroAnexo) {

    console.error(
        "Erro ao enviar anexo para o SharePoint:",
        erroAnexo
    );

    alert(
        "A solicitação foi registrada, mas houve um problema ao enviar o anexo."
    );

}


       alert(
    "🎉 Solicitação enviada com sucesso!\n\n" +
    "Seu número de protocolo é:\n\n" +
    protocolo +
    "\n\nGuarde este número para acompanhar sua solicitação."
);


        // Limpa o formulário

        formulario.reset();

        // Limpa os anexos da SC Produto
arquivosProduto = [];

if (listaAnexosProduto) {
    listaAnexosProduto.innerHTML = "";
}

if (inputAnexosProduto) {
    inputAnexosProduto.value = "";
}

        // Limpa os anexos da Pré-nota
arquivosPrenota = [];

if (listaAnexosPrenota) {
    listaAnexosPrenota.innerHTML = "";
}

if (inputAnexosPrenota) {
    inputAnexosPrenota.value = "";
}

// Limpa os anexos do Documento de Entrada
arquivosEntrada = [];

if (listaAnexosEntrada) {
    listaAnexosEntrada.innerHTML = "";
}

if (inputAnexosEntrada) {
    inputAnexosEntrada.value = "";
}

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

    // Libera o botão para tentar novamente
    enviandoSolicitacao = false;

    if (botaoEnviar) {
        botaoEnviar.disabled = false;

        botaoEnviar.innerHTML =
            botaoEnviar.dataset.textoOriginal || "Enviar solicitação";

        botaoEnviar.style.opacity = "1";
        botaoEnviar.style.cursor = "pointer";
    }

}

});
