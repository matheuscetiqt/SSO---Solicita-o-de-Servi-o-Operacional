
/* =====================================================
   INTERPRETADOR DE CURRÍCULOS
   Versão 2.0 - Texto resumido
   ===================================================== */

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .toLowerCase()
        .trim();
}

function extrairTrechos(texto, padroes, limite = 3) {
    const frases = texto
        .replace(/\r/g, "\n")
        .split(/[\n•]+/)
        .map(item => item.replace(/\s+/g, " ").trim())
        .filter(item => item.length > 15 && item.length < 500);

    const selecionadas = [];

    for (const frase of frases) {
        const normalizada = normalizarTexto(frase);

        if (padroes.some(padrao => padrao.test(normalizada))) {
            if (!selecionadas.some(item =>
                normalizarTexto(item) === normalizada
            )) {
                selecionadas.push(frase);
            }
        }

        if (selecionadas.length >= limite) break;
    }

    return selecionadas;
}

function interpretarCurriculo(textoOriginal) {

    if (!textoOriginal || textoOriginal.trim().length < 50) {
        throw new Error("Conteúdo insuficiente no currículo.");
    }

    const categorias = {
        formacao: extrairTrechos(textoOriginal, [
            /tecnico em/,
            /graduacao em/,
            /bacharelado em/,
            /licenciatura em/,
            /engenheiro/,
            /mestrado em/,
            /doutorado em/,
            /pos.graduacao/
        ], 3),

        experiencia: extrairTrechos(textoOriginal, [
            /atua desde/,
            /trabalha desde/,
            /trabalhou na/,
            /engenheiro.*desde/,
            /experiencia profissional/,
            /historico profissional/,
            /responsavel por/,
            /desenvolve projetos/,
            /atuacao profissional/
        ], 3),

        certificacoes: extrairTrechos(textoOriginal, [
            /certificacao/,
            /certificado/,
            /functional safety engineer/,
            /tuv rheinland/,
            /iec 61508/,
            /capacitacao/
        ], 2),

        docencia: extrairTrechos(textoOriginal, [
            /docente/,
            /docencia/,
            /professor/,
            /ministrou aulas/,
            /responsavel pela disciplina/,
            /curso de extensao/
        ], 2),

        conhecimentos: extrairTrechos(textoOriginal, [
            /hazop/,
            /lopa/,
            /sistemas instrumentados/,
            /seguranca funcional/,
            /analise de riscos/,
            /automacao industrial/,
            /calculos de sil/
        ], 3)
    };

    return {
        categorias,
        textoOriginal,
        textoGerado: gerarTextoCurriculo(categorias)
    };
}

// =====================================================
// CONSTRUÇÃO DO TEXTO RESUMIDO
// =====================================================

function gerarTextoCurriculo(categorias) {

    const paragrafos = [];

    const resumo = lista => lista
        .map(item => item.replace(/[.;\s]+$/, ""))
        .join("; ");

    if (categorias.formacao.length ||
        categorias.certificacoes.length) {

        let texto = "";

        if (categorias.formacao.length) {
            texto += "O profissional apresenta formação acadêmica e técnica, destacando-se " +
                resumo(categorias.formacao) + ". ";
        }

        if (categorias.certificacoes.length) {
            texto += "Possui também qualificações e certificações complementares, incluindo " +
                resumo(categorias.certificacoes) + ".";
        }

        paragrafos.push(texto.trim());
    }

    if (categorias.experiencia.length) {
        paragrafos.push(
            "Sua trajetória profissional contempla " +
            resumo(categorias.experiencia) + "."
        );
    }

    if (categorias.conhecimentos.length) {
        paragrafos.push(
            "Entre suas principais áreas de atuação e conhecimentos técnicos, " +
            "destacam-se " + resumo(categorias.conhecimentos) + "."
        );
    }

    if (categorias.docencia.length) {
        paragrafos.push(
            "Sua experiência educacional inclui " +
            resumo(categorias.docencia) + "."
        );
    }

    return paragrafos.length
        ? paragrafos.join("\n\n")
        : "Não foram identificadas informações suficientes para elaborar a apresentação profissional.";
}
