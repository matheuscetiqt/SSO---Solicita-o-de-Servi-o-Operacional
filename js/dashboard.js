import { auth, db } from "./firebase-config.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    where,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ==========================================
// POWER AUTOMATE - ENVIO DE ANEXOS
// ==========================================

const URL_ANEXOS_POWER_AUTOMATE = "https://defaultcd8472815bbf4642aa28142c41b273.a0.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/17/workflows/617c8aa40d3d4d7b95c8b7d868085b14/triggers/manual/paths/invoke?api-version=1";

// ==========================================
// CONVERTE ARQUIVO PARA BASE64
// ==========================================

function arquivoParaBase64(arquivo) {

    return new Promise((resolve, reject) => {

        const leitor = new FileReader();

        leitor.onload = () => {

            const resultado = leitor.result;

            const base64 =
                resultado.split(",")[1];

            resolve(base64);

        };

        leitor.onerror = reject;

        leitor.readAsDataURL(arquivo);

    });

}


// ==========================================
// ENVIA ANEXO DE CONCLUSÃO
// ==========================================

async function enviarAnexoConclusao(
    protocolo,
    descricao,
    arquivo
) {

    if (!arquivo) {
        return;
    }

    const arquivoBase64 =
        await arquivoParaBase64(arquivo);


    const resposta = await fetch(
        URL_ANEXOS_POWER_AUTOMATE,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                protocolo: protocolo,

                descricao: descricao,

                nomeArquivo: arquivo.name,

                tipoArquivo: arquivo.type,

                arquivoBase64: arquivoBase64

            })

        }
    );


    if (!resposta.ok) {

        throw new Error(
            "Não foi possível enviar o anexo."
        );

    }

}

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "index.html";
        return;

    }

    carregarSolicitacoes();

    iniciarNotificacoes(user);

    carregarFotoUsuario(user);

});

async function carregarSolicitacoes() {

    const tabela = document.getElementById("tabelaSolicitacoes");

    tabela.innerHTML = "";

    let total = 0;
let pendentes = 0;
let andamento = 0;
let concluidas = 0;

    const q = query(
        collection(db, "solicitacoes"),
        orderBy("dataCriacao", "desc")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach((doc) => {

        const dados = doc.data();

        total++;

if (dados.status === "Pendente") {
    pendentes++;
}

if (dados.status === "Em andamento") {
    andamento++;
}

if (dados.status === "Concluída") {
    concluidas++;
}

       tabela.innerHTML += `
    <tr>

        <td>${dados.protocolo || "-"}</td>

        <td>${dados.solicitante || "-"}</td>

        <td>${dados.tipoServico || "-"}</td>

        <td>
            <span class="status pendente">
                ${dados.status || "-"}
            </span>
        </td>

        <td>
            ${formatarData(dados.dataCriacao)}
        </td>

        <td>
            <button
                type="button"
                class="btn-visualizar"
                data-id="${doc.id}">
                <i class="fa-solid fa-eye"></i>
                Visualizar
            </button>
        </td>

    </tr>
`;

    });

    document.getElementById("totalSolicitacoes").textContent = total;
document.getElementById("totalPendentes").textContent = pendentes;
document.getElementById("totalAndamento").textContent = andamento;
document.getElementById("totalConcluidas").textContent = concluidas;

    document.querySelectorAll(".btn-visualizar").forEach((botao) => {

    botao.addEventListener("click", async () => {

        const idSolicitacao = botao.dataset.id;

        console.log("Solicitação selecionada:", idSolicitacao);

        try {

            const referencia = doc(
                db,
                "solicitacoes",
                idSolicitacao
            );

            const resultado = await getDoc(referencia);

            if (!resultado.exists()) {

                alert("Solicitação não encontrada.");
                return;

            }

            const dados = resultado.data();

dados.id = resultado.id;

abrirModalSolicitacao(dados);

        } catch (erro) {

            console.error("Erro ao buscar solicitação:", erro);

            alert("Não foi possível carregar a solicitação.");

        }

    });

});

}
function abrirModalSolicitacao(dados) {

    const modal = document.getElementById("modalSolicitacao");

    const detalhes = document.getElementById("detalhesSolicitacao");


    // ==========================================
    // DADOS GERAIS
    // ==========================================

    detalhes.innerHTML = `

        <div class="detalhe-grupo">
            <span>Protocolo</span>
            <strong>${dados.protocolo || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Solicitante</span>
            <strong>${dados.solicitante || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>E-mail</span>
            <strong>${dados.email || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Analista Responsável</span>
            <strong>${dados.analista || "-"}</strong>
        </div>

        <div class="detalhe-grupo">
            <span>Tipo de Serviço</span>
            <strong>${dados.tipoServico || "-"}</strong>
        </div>


        <!-- STATUS -->

        <div class="detalhe-grupo">

            <span>Status</span>

            <select
                id="statusSolicitacao"
                class="select-status"
                data-id="${dados.id || ""}"
            >

                <option value="Pendente"
                    ${dados.status === "Pendente" ? "selected" : ""}>
                    Pendente
                </option>

                <option value="Em andamento"
                    ${dados.status === "Em andamento" ? "selected" : ""}>
                    Em andamento
                </option>

                <option value="Concluída"
                    ${dados.status === "Concluída" ? "selected" : ""}>
                    Concluída
                </option>

                <option value="Cancelada"
                    ${dados.status === "Cancelada" ? "selected" : ""}>
                    Cancelada
                </option>

                <option value="Reprovada"
                    ${dados.status === "Reprovada" ? "selected" : ""}>
                    Reprovada
                </option>

            </select>

        </div>

        ${
    dados.status === "Reprovada" && dados.motivoReprovacao
        ? `
            <div class="detalhe-reprovacao">

                <span class="titulo-reprovacao">
                    Motivo da Reprovação
                </span>

                <div class="texto-reprovacao">
                    ${dados.motivoReprovacao}
                </div>

            </div>
        `
        : ""
}

       ${
    dados.status === "Concluída" && dados.descricaoConclusao
        ? `
            <div class="detalhe-conclusao">

                <span class="titulo-conclusao">
                    Descrição da Conclusão
                </span>

                <div class="texto-conclusao">
                    ${dados.descricaoConclusao}
                </div>

            </div>
        `
        : ""
}

        <div class="detalhe-grupo">

            <span>Data da Solicitação</span>

            <strong>
                ${formatarData(dados.dataCriacao)}
            </strong>

        </div>


        <!-- ====================================== -->
        <!-- PRÉ-NOTA                              -->
        <!-- ====================================== -->

        ${
            dados.tipoServico === "Abertura de Pré-nota"

            ? `

                <div style="grid-column: 1 / 3; margin-top: 15px;">
                    <h3>📄 Dados da Abertura de Pré-nota</h3>
                </div>


                <div class="detalhe-grupo">

                    <span>Valor</span>

                    <strong>
                        ${
                            dados.valorPrenota
                                ? "R$ " +
                                  Number(dados.valorPrenota)
                                  .toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2
                                  })
                                : "-"
                        }
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Banco</span>

                    <strong>
                        ${dados.bancoPrenota || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Agência</span>

                    <strong>
                        ${dados.agenciaPrenota || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Conta Corrente</span>

                    <strong>
                        ${dados.contaCorrentePrenota || "-"}
                    </strong>

                </div>


                <div
                    class="detalhe-grupo"
                    style="grid-column: 1 / 3;"
                >

                    <span>Observações</span>

                    <strong>
                        ${dados.observacoesPrenota || "-"}
                    </strong>

                </div>

            `

            : ""
        }


        <!-- ====================================== -->
        <!-- SOLICITAÇÃO DE COMPRA                  -->
        <!-- ====================================== -->

        ${
            dados.tipoServico === "Solicitação de Compra"

            ? `

                <div style="grid-column: 1 / 3; margin-top: 15px;">
                    <h3>📦 Dados da Solicitação de Compra</h3>
                </div>


                <div class="detalhe-grupo">

                    <span>Tipo de Solicitação</span>

                    <strong>
                        ${dados.tipoSC || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Professor / Especialista</span>

                    <strong>
                        ${dados.professor || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>SC anterior de Referência</span>

                    <strong>
                        ${dados.scAnterior || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>CPF ou CNPJ</span>

                    <strong>
                        ${dados.cpfCnpj || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Curso</span>

                    <strong>
                        ${dados.curso || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Atividade I</span>

                    <strong>
                        ${dados.atividade1 || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Carga Horária I</span>

                    <strong>
                        ${dados.carga1 || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Atividade II</span>

                    <strong>
                        ${dados.atividade2 || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Carga Horária II</span>

                    <strong>
                        ${dados.carga2 || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Unidade Curricular / Disciplina</span>

                    <strong>
                        ${dados.disciplina || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Datas das Aulas</span>

                    <strong>
                        ${dados.datasAulas || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Valor da Hora Aula</span>

                    <strong>
                        ${
                            dados.valorHora
                                ? "R$ " + dados.valorHora
                                : "-"
                        }
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Histórico de Contratação</span>

                    <strong>
                        ${dados.historico || "-"}
                    </strong>

                </div>

                       `

            : ""
        }

        ${
            dados.tipoServico === "Pedido de Venda"

            ? `

                <div style="grid-column: 1 / 3; margin-top: 15px;">
                    <h3>💰 Dados do Pedido de Venda</h3>
                </div>


                <div class="detalhe-grupo">

                    <span>Número da Nota Fiscal SGF</span>

                    <strong>
                        ${dados.numeroNotaFiscalSGF || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Valor do Pedido de Venda</span>

                    <strong>
                        ${
                            dados.valorPedidoVenda
                                ? "R$ " +
                                  Number(dados.valorPedidoVenda)
                                  .toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2
                                  })
                                : "-"
                        }
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Favorecido</span>

                    <strong>
                        ${dados.favorecido || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Previsão de Repasse</span>

                    <strong>
                        ${dados.previsaoRepasse || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Número do UO</span>

                    <strong>
                        ${dados.numeroUO || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Número do CR</span>

                    <strong>
                        ${dados.numeroCR || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Número do Produto</span>

                    <strong>
                        ${dados.numeroProduto || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Número do Cliente</span>

                    <strong>
                        ${dados.numeroCliente || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Número da Loja</span>

                    <strong>
                        ${dados.numeroLoja || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Número da Natureza</span>

                    <strong>
                        ${dados.numeroNatureza || "-"}
                    </strong>

                </div>

            `

            : ""
        }

                ${
            dados.tipoServico === "Documento de Entrada"

            ? `

                <div style="grid-column: 1 / 3; margin-top: 15px;">
                    <h3>📦 Dados do Documento de Entrada</h3>
                </div>


                <div class="detalhe-grupo">

                    <span>Número do Pedido</span>

                    <strong>
                        ${dados.numeroPedidoEntrada || "-"}
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Valor</span>

                    <strong>
                        ${
                            dados.valorEntrada
                                ? "R$ " +
                                  Number(dados.valorEntrada)
                                  .toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2
                                  })
                                : "-"
                        }
                    </strong>

                </div>


                <div class="detalhe-grupo">

                    <span>Documento</span>

                    <strong>
                        ${dados.documentosEntrada || "-"}
                    </strong>

                </div>

            `

            : ""
        }

                ${
            dados.tipoServico === "Outro"

            ? `

                <div style="grid-column: 1 / 3; margin-top: 15px;">
                    <h3>✏️ Dados de Outros Serviços</h3>
                </div>


                <div
                    class="detalhe-grupo"
                    style="grid-column: 1 / 3;"
                >

                    <span>Serviço solicitado</span>

                    <strong>
                        ${dados.descricaoOutro || "-"}
                    </strong>

                </div>

            `

            : ""
        }
        ${
            dados.anexos && dados.anexos.length > 0
                ? `

                <div style="grid-column: 1 / 3; margin-top: 20px;">

                    <h3>📎 Anexos</h3>

                    <div style="
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        margin-top: 10px;
                    ">

                        ${dados.anexos.map((anexo) => `

                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                gap: 15px;
                                padding: 12px 15px;
                                border: 1px solid #ddd;
                                border-radius: 8px;
                                background: #f8f9fa;
                            ">

                                <span>
                                    📄 ${anexo.nome || "Arquivo"}
                                </span>

                                ${
                                    anexo.url
                                        ? `
                                        <a
                                            href="${anexo.url}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style="
                                                background: #005b96;
                                                color: white;
                                                padding: 8px 14px;
                                                border-radius: 6px;
                                                text-decoration: none;
                                                font-weight: 600;
                                            "
                                        >
                                            Abrir arquivo
                                        </a>
                                        `
                                        : ""
                                }

                            </div>

                        `).join("")}

                    </div>

                </div>

                `
                : ""
        }
    `;

    


    // ==========================================
    // MOSTRA O MODAL
    // ==========================================

    modal.style.display = "flex";


    // ==========================================
    // ALTERAÇÃO DE STATUS
    // ==========================================

const selectStatus =
    document.getElementById("statusSolicitacao");

if (selectStatus) {

    selectStatus.addEventListener("change", () => {

        const novoStatus = selectStatus.value;

        // Remove campos anteriores
        document.getElementById("campoConclusao")?.remove();
        document.getElementById("campoReprovacao")?.remove();

        // ==========================================
        // CONCLUÍDA
        // ==========================================

        if (novoStatus === "Concluída") {

            const campo = document.createElement("div");

            campo.id = "campoConclusao";
            campo.className = "detalhe-grupo";
            campo.style.gridColumn = "1 / 3";

            campo.innerHTML = `
                <span>Descrição da conclusão *</span>

                <textarea
                    id="descricaoConclusao"
                    rows="4"
                    placeholder="Descreva o serviço realizado..."
                    style="
                        width: 100%;
                        margin-top: 8px;
                        padding: 10px;
                        border: 1px solid #ccc;
                        border-radius: 8px;
                        resize: vertical;
                        font-family: inherit;
                    "
                >${dados.descricaoConclusao || ""}</textarea>

                <div style="margin-top: 16px;">

    <span style="display: block; margin-bottom: 8px;">
        Anexo da conclusão <small>(opcional)</small>
    </span>

    <input
        type="file"
        id="anexoConclusao"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        style="
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 8px;
            background: #fff;
            cursor: pointer;
            box-sizing: border-box;
        "
    >

    <small
        style="
            display: block;
            margin-top: 6px;
            color: #777;
        "
    >
        Você pode anexar um print, PDF ou documento relacionado ao serviço.
    </small>

</div>

                <button
                    type="button"
                    id="btnSalvarStatus"
                    style="
                        margin-top: 12px;
                        padding: 10px 18px;
                        border: none;
                        border-radius: 8px;
                        background: #005b96;
                        color: white;
                        cursor: pointer;
                        font-weight: 600;
                    "
                >
                    Salvar alteração
                </button>
            `;

            selectStatus
                .closest(".detalhe-grupo")
                .after(campo);

            document
                .getElementById("btnSalvarStatus")
                .addEventListener("click", async () => {

                    const descricao =
                        document
                            .getElementById("descricaoConclusao")
                            .value
                            .trim();

                    if (!descricao) {

                        alert(
                            "Informe a descrição da conclusão antes de salvar."
                        );

                        return;
                    }

                    await alterarStatusSolicitacao(
                        dados.id,
                        novoStatus,
                        descricao,
                        ""
                    );

                });
        }

        // ==========================================
        // REPROVADA
        // ==========================================

        if (novoStatus === "Reprovada") {

            const campo = document.createElement("div");

            campo.id = "campoReprovacao";
            campo.className = "detalhe-grupo";
            campo.style.gridColumn = "1 / 3";

            campo.innerHTML = `
                <span>Motivo da reprovação *</span>

                <textarea
                    id="motivoReprovacao"
                    rows="4"
                    placeholder="Informe o motivo da reprovação..."
                    style="
                        width: 100%;
                        margin-top: 8px;
                        padding: 10px;
                        border: 1px solid #ccc;
                        border-radius: 8px;
                        resize: vertical;
                        font-family: inherit;
                    "
                >${dados.motivoReprovacao || ""}</textarea>

                <button
                    type="button"
                    id="btnSalvarStatus"
                    style="
                        margin-top: 12px;
                        padding: 10px 18px;
                        border: none;
                        border-radius: 8px;
                        background: #005b96;
                        color: white;
                        cursor: pointer;
                        font-weight: 600;
                    "
                >
                    Salvar alteração
                </button>
            `;

            selectStatus
                .closest(".detalhe-grupo")
                .after(campo);

            document
                .getElementById("btnSalvarStatus")
                .addEventListener("click", async () => {

                    const motivo =
                        document
                            .getElementById("motivoReprovacao")
                            .value
                            .trim();

                    if (!motivo) {

                        alert(
                            "Informe o motivo da reprovação antes de salvar."
                        );

                        return;
                    }

                    await alterarStatusSolicitacao(
                        dados.id,
                        novoStatus,
                        "",
                        motivo
                    );

                });
        }

        // ==========================================
        // OUTROS STATUS
        // ==========================================

        if (
            novoStatus !== "Concluída" &&
            novoStatus !== "Reprovada"
        ) {

            alterarStatusSolicitacao(
                dados.id,
                novoStatus
            );

        }

    });

}
}

// ==========================================
// ALTERAR STATUS + CRIAR NOTIFICAÇÃO
// ==========================================

async function alterarStatusSolicitacao(
    idSolicitacao,
    novoStatus,
    descricaoConclusao = "",
    motivoReprovacao = ""
) {

    try {

        // ==========================================
        // BUSCA A SOLICITAÇÃO
        // ==========================================

        const referencia = doc(
            db,
            "solicitacoes",
            idSolicitacao
        );

        const resultado = await getDoc(referencia);

        if (!resultado.exists()) {

            alert("Solicitação não encontrada.");
            return;

        }

        const dados = resultado.data();

        const statusAnterior =
            dados.status || "Pendente";


        // ==========================================
        // SE NÃO HOUVE MUDANÇA, NÃO CRIA AVISO
        // ==========================================

        if (statusAnterior === novoStatus) {

            return;

        }


        // ==========================================
        // ATUALIZA O STATUS
        // ==========================================

        const dadosAtualizacao = {
    status: novoStatus
};

if (novoStatus === "Concluída") {
    dadosAtualizacao.descricaoConclusao =
        descricaoConclusao;
}

if (novoStatus === "Reprovada") {
    dadosAtualizacao.motivoReprovacao =
        motivoReprovacao;
}

await updateDoc(
    referencia,
    dadosAtualizacao
);


        // ==========================================
        // CRIA A NOTIFICAÇÃO
        // ==========================================

        if (dados.email) {

            await addDoc(
                collection(db, "notificacoes"),
                {

                    uid: dados.uid || "",

                    email: dados.email,

                    protocolo:
                        dados.protocolo || "",

                    statusAnterior:
                        statusAnterior,

                    novoStatus:
                        novoStatus,

                    mensagem:
                        `O status da sua solicitação foi alterado de "${statusAnterior}" para "${novoStatus}".`,

                    lida: false,

                    dataCriacao:
                        serverTimestamp()

                }
            );

        }


        // ==========================================
        // AVISO
        // ==========================================

        alert(
            "Status atualizado com sucesso!"
        );


        // ==========================================
        // FECHA O MODAL
        // ==========================================

        document.getElementById(
            "modalSolicitacao"
        ).style.display = "none";


        // ==========================================
        // RECARREGA O DASHBOARD
        // ==========================================

        await carregarSolicitacoes();


    } catch (erro) {

        console.error(
            "Erro ao atualizar status:",
            erro
        );

        alert(
            "Não foi possível atualizar o status."
        );

    }

}

function formatarData(timestamp) {

    if (!timestamp) return "-";

    const data = timestamp.toDate();

    return data.toLocaleDateString("pt-BR") + " " +
           data.toLocaleTimeString("pt-BR", {
               hour: "2-digit",
               minute: "2-digit"
           });

}

document.getElementById("modalSolicitacao").addEventListener("click", (evento) => {

    if (evento.target.id === "modalSolicitacao") {

        evento.currentTarget.style.display = "none";

    }

});
document.getElementById("fecharModal").addEventListener("click", () => {

    document.getElementById("modalSolicitacao").style.display = "none";

});
document.getElementById("modalSolicitacao").addEventListener("click", (evento) => {

    if (evento.target.id === "modalSolicitacao") {

        evento.currentTarget.style.display = "none";

    }

});
// ==========================================
// NOTIFICAÇÕES
// ==========================================

function iniciarNotificacoes(user) {

    const btnNotificacoes =
        document.getElementById("btnNotificacoes");

    const painelNotificacoes =
        document.getElementById("painelNotificacoes");

    const contadorNotificacoes =
        document.getElementById("contadorNotificacoes");

    const listaNotificacoes =
        document.getElementById("listaNotificacoes");


    // ==========================================
    // ABRIR / FECHAR PAINEL
    // ==========================================

    btnNotificacoes.addEventListener("click", (evento) => {

        evento.stopPropagation();

        if (painelNotificacoes.style.display === "none") {

            painelNotificacoes.style.display = "block";

        } else {

            painelNotificacoes.style.display = "none";

        }

    });


    // Fecha ao clicar fora
    document.addEventListener("click", (evento) => {

        if (
            !painelNotificacoes.contains(evento.target) &&
            !btnNotificacoes.contains(evento.target)
        ) {

            painelNotificacoes.style.display = "none";

        }

    });


    // ==========================================
    // ESCUTA AS NOTIFICAÇÕES DO USUÁRIO
    // ==========================================

    const consulta = query(
        collection(db, "notificacoes"),
        where("uid", "==", user.uid),
        orderBy("dataCriacao", "desc")
    );


    onSnapshot(
        consulta,
        (snapshot) => {

            listaNotificacoes.innerHTML = "";

            let naoLidas = 0;


            if (snapshot.empty) {

                listaNotificacoes.innerHTML = `
                    <p class="sem-notificacoes">
                        Nenhuma notificação.
                    </p>
                `;

            }


            snapshot.forEach((documento) => {

                const notificacao =
                    documento.data();

                const idNotificacao =
                    documento.id;


                if (!notificacao.lida) {

                    naoLidas++;

                }


                listaNotificacoes.innerHTML += `

                    <div
                        class="item-notificacao ${
                            notificacao.lida
                                ? ""
                                : "nao-lida"
                        }"
                        data-id="${idNotificacao}"
                    >

                        <div class="icone-notificacao">

                            <i class="fa-solid fa-bell"></i>

                        </div>

                        <div class="texto-notificacao">

                            <strong>
                                ${notificacao.protocolo || "Solicitação"}
                            </strong>

                            <p>
                                ${
                                    notificacao.mensagem ||
                                    "Sua solicitação foi atualizada."
                                }
                            </p>

                            <small>
                                ${
                                    formatarData(
                                        notificacao.dataCriacao
                                    )
                                }
                            </small>

                        </div>

                    </div>

                `;

            });


            // ==========================================
            // CONTADOR
            // ==========================================

            if (naoLidas > 0) {

                contadorNotificacoes.textContent =
                    naoLidas > 99 ? "99+" : naoLidas;

                contadorNotificacoes.style.display =
                    "flex";

            } else {

                contadorNotificacoes.style.display =
                    "none";

            }


            // ==========================================
            // MARCAR COMO LIDA
            // ==========================================

            document
                .querySelectorAll(".item-notificacao")
                .forEach((item) => {

                    item.addEventListener(
                        "click",
                        async () => {

                            const id =
                                item.dataset.id;

                            try {

                                await updateDoc(
                                    doc(
                                        db,
                                        "notificacoes",
                                        id
                                    ),
                                    {
                                        lida: true
                                    }
                                );

                            } catch (erro) {

                                console.error(
                                    "Erro ao marcar notificação como lida:",
                                    erro
                                );

                            }

                        }
                    );

                });

        },

        (erro) => {

            console.error(
                "Erro ao carregar notificações:",
                erro
            );

        }
    );

}
function carregarFotoUsuario(user) {

    const email = user.email.toLowerCase();

    const fotosUsuarios = {
    "mdrconceicao@cetiqt.senai.br": "Matheus.jpg",
    "cdsrodrigues@cetiqt.senai.br": "Carol.jpg",
    "cckopke@cetiqt.senai.br": "Clarissa.PNG",
    "prfreitas@cetiqt.senai.br": "PAULA RIBEIRO FREITAS 1.jpg",
    "kfmcarneiro@cetiqt.senai.br": "Kalvin Carneiro.jpg",
    "rbenites@cetiqt.senai.br": "roger.jpeg",
    "cvouverney@cetiqt.senai.br": "Caren.jpg"
    
    
};

    const fotoUsuario = document.getElementById("fotoUsuario");

    if (!fotoUsuario) {
        return;
    }

    if (fotosUsuarios[email]) {
        fotoUsuario.src = fotosUsuarios[email];
    }
}
