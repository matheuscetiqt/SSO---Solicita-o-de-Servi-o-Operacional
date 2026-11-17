
/* =====================================================
   INTERPRETADOR DE CURRÍCULOS
   Versão 3.0 - Redação institucional
   ===================================================== */

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

// Remove elementos comuns de cabeçalhos e formatação
function limparTrecho(texto) {
    return String(texto || "")
        .replace(/^[\s•\-–—|:;]+/, "")
        .replace(/[\s•\-–—|:;]+$/, "")
        .replace(/\s+/g, " ")
        .trim();
}

// Descarta títulos, frases incompletas e trechos muito curtos
function trechoValido(texto) {
    const trecho = limparTrecho(texto);
    const normalizado = normalizarTexto(trecho);

    if (trecho.length < 25 || trecho.length > 350) {
        return false;
    }

    const titulos = [
        "historico profissional",
        "experiencia profissional",
        "formacao academica",
        "qualificacoes",
        "conhecimentos tecnicos",
        "objetivo profissional",
        "curriculo",
        "perfil profissional"
    ];

    if (titulos.some(titulo => normalizado === titulo)) {
        return false;
    }

    // Evita frases terminadas em palavras que indicam continuação
    if (/\b(de|do|da|dos|das|em|no|na|nos|nas|para|com|e|ou|por|a|o)$/i.test(normalizado)) {
        return false;
    }

    return true;
}

// Divide o conteúdo em trechos menores
function separarTrechos(texto) {
    return String(texto || "")
        .replace(/\r/g, "\n")
        .split(/[\n;•]+/)
        .map(limparTrecho)
        .filter(trechoValido);
}

// Busca trechos relacionados a determinados assuntos
function selecionarTrechos(texto, padroes, limite = 3) {
    const trechos = separarTrechos(texto);
    const selecionados = [];

    for (const trecho of trechos) {
        const normalizado = normalizarTexto(trecho);

        if (!padroes.some(padrao => padrao.test(normalizado))) {
            continue;
        }

        const repetido = selecionados.some(item =>
            normalizarTexto(item) === normalizado
        );

        if (!repetido) {
            selecionados.push(trecho);
        }

        if (selecionados.length >= limite) {
            break;
        }
    }

    return selecionados;
}

// Identifica termos técnicos sem repetir informações
function identificarConhecimentos(texto) {
    const termos = [
        "Segurança Funcional",
        "Sistemas Instrumentados de Segurança",
        "Instrumentação e Automação",
        "Automação Industrial",
        "HAZOP",
        "LOPA",
        "SIL",
        "Análise de Riscos",
        "Comissionamento",
        "Normalização Técnica",
        "Pesquisa e Desenvolvimento"
    ];

    const normalizado = normalizarTexto(texto);

    return termos.filter(termo => {
        const termoNormalizado = normalizarTexto(termo);

        if (termoNormalizado === "sil") {
            return /\bsil\b/i.test(normalizado);
        }

        return normalizado.includes(termoNormalizado);
    }).slice(0, 7);
}

// =====================================================
// INTERPRETAÇÃO DO CURRÍCULO
// =====================================================

function interpretarCurriculo(textoOriginal) {

    if (!textoOriginal || textoOriginal.trim().length < 50) {
        throw new Error(
            "Não foi possível identificar conteúdo suficiente no currículo."
        );
    }

    const categorias = {
        formacao: selecionarTrechos(textoOriginal, [
            /tecnico em/,
            /graduacao em/,
            /bacharelado em/,
            /licenciatura em/,
            /engenheiro/,
            /mestrado em/,
            /doutorado em/,
            /pos.graduacao/
        ], 3),

        experiencia: selecionarTrechos(textoOriginal, [
            /petrobras/,
            /central nuclear/,
            /engenharia de instrumentacao/,
            /experiencia profissional/,
            /atuacao profissional/,
            /trabalhou na/
        ], 3),

        certificacoes: selecionarTrechos(textoOriginal, [
            /certificacao/,
            /certificado/,
            /functional safety engineer/,
            /tuv rheinland/,
            /safety instrumented systems/
        ], 2),

        docencia: selecionarTrechos(textoOriginal, [
            /docente/,
            /docencia/,
            /professor/,
            /ministrou aulas/,
            /universidade petrobras/,
            /puc.rio/
        ], 3),

        conhecimentos: identificarConhecimentos(textoOriginal)
    };

    return {
        categorias,
        textoOriginal,
        textoGerado: gerarTextoCurriculo(categorias)
    };
}

// =====================================================
// CONSTRUÇÃO DO TEXTO INSTITUCIONAL
// =====================================================

function gerarTextoCurriculo(categorias) {

    const paragrafos = [];

    // 1. Formação e certificações
    const formacao = categorias.formacao.join("; ");
    const certificacoes = categorias.certificacoes.join("; ");

    if (formacao || certificacoes) {

        let paragrafo = "";

        if (formacao) {
            paragrafo +=
                "O profissional apresenta formação acadêmica e técnica em " +
                formacao + ".";
        }

        if (certificacoes) {
            paragrafo +=
                (paragrafo ? " " : "") +
                "Também possui qualificações e certificações complementares, " +
                "com destaque para " + certificacoes + ".";
        }

        paragrafos.push(paragrafo);
    }

    // 2. Experiência profissional
    if (categorias.experiencia.length) {

        paragrafos.push(
            "Sua trajetória profissional inclui experiências em " +
            categorias.experiencia.join("; ") + "."
        );
    }

    // 3. Conhecimentos técnicos
    if (categorias.conhecimentos.length) {

        paragrafos.push(
            "Entre suas principais áreas de atuação e conhecimentos técnicos, " +
            "destacam-se " +
            categorias.conhecimentos.join(", ") + "."
        );
    }

    // 4. Experiência docente
    if (categorias.docencia.length) {

        paragrafos.push(
            "Na área acadêmica, possui experiência docente em " +
            categorias.docencia.join("; ") + "."
        );
    }

    if (!paragrafos.length) {
        return "Não foram identificadas informações suficientes para elaborar a apresentação profissional. Recomenda-se a revisão manual do currículo.";
    }

    return paragrafos.join("\n\n");
}
