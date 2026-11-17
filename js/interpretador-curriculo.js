
/* =====================================================
   INTERPRETADOR DE CURRÍCULOS
   Versão 4.0 - Reconhecimento ampliado
   ===================================================== */

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function limparTrecho(texto) {
    return String(texto || "")
        .replace(/^[\s•\-–—|:;]+/, "")
        .replace(/[\s•\-–—|:;]+$/, "")
        .replace(/\s+/g, " ")
        .trim();
}

function trechoValido(texto) {
    const trecho = limparTrecho(texto);
    const normalizado = normalizarTexto(trecho);

    if (trecho.length < 20 || trecho.length > 400) {
        return false;
    }

    const titulos = [
        "historico profissional",
        "experiencia profissional",
        "formacao academica",
        "dados academicos",
        "qualificacoes",
        "conhecimentos tecnicos",
        "objetivo profissional",
        "curriculo vitae",
        "cursos complementares",
        "experiencias em docencia",
        "publicacoes"
    ];

    if (titulos.includes(normalizado)) {
        return false;
    }

    if (/^[0-9\s./-]+$/.test(trecho)) {
        return false;
    }

    if (/\b(de|do|da|dos|das|em|no|na|nos|nas|para|com|e|ou|por)$/i.test(normalizado)) {
        return false;
    }

    return true;
}

function separarTrechos(texto) {
    return String(texto || "")
        .replace(/\r/g, "\n")
        .split(/[\n•]+/)
        .map(limparTrecho)
        .filter(trechoValido);
}

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

function identificarConhecimentos(texto) {
    const termos = [
        "Segurança Funcional",
        "Segurança de Processos",
        "Segurança Operacional",
        "Sistemas Instrumentados de Segurança",
        "Instrumentação e Automação",
        "Automação Industrial",
        "Análise de Riscos",
        "Análise Qualitativa de Riscos",
        "HAZOP",
        "LOPA",
        "SIL",
        "Bow Tie",
        "Gestão de Mudanças",
        "Processamento de Petróleo",
        "Engenharia de Refino",
        "Exploração e Produção",
        "Regulamentação da ANP",
        "Transição Energética",
        "Pesquisa e Desenvolvimento",
        "Comissionamento",
        "Normalização Técnica"
    ];

    const normalizado = normalizarTexto(texto);

    return termos.filter(termo => {
        const termoNormalizado = normalizarTexto(termo);

        if (termoNormalizado === "sil") {
            return /\bsil\b/i.test(normalizado);
        }

        return normalizado.includes(termoNormalizado);
    }).slice(0, 8);
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
            /engenharia/,
            /mestrado em/,
            /doutorado em/,
            /especializacao em/,
            /pos.graduacao/,
            /mba em/
        ], 4),

        experiencia: selecionarTrechos(textoOriginal, [
            /petrobras/,
            /consultora tecnica/,
            /consultor tecnico/,
            /engenheira/,
            /engenheiro/,
            /coordenadora/,
            /coordenador/,
            /gerente/,
            /supervisora/,
            /supervisor/,
            /analista/,
            /atuacao como/,
            /experiencia profissional/,
            /trabalhou na/
        ], 4),

        certificacoes: selecionarTrechos(textoOriginal, [
            /certificacao/,
            /certificado/,
            /functional safety engineer/,
            /tuv rheinland/,
            /safety instrumented systems/,
            /curso complementar/,
            /workshop/,
            /capacitação/,
            /capacitacao/
        ], 3),

        docencia: selecionarTrechos(textoOriginal, [
            /docente/,
            /docencia/,
            /professor/,
            /professora/,
            /instrutor/,
            /instrutora/,
            /tutor/,
            /tutora/,
            /ministrou aulas/,
            /universidade petrobras/,
            /senai/,
            /puc.rio/
        ], 4),

        publicacoes: selecionarTrechos(textoOriginal, [
            /publicacao/,
            /publicacoes/,
            /co.autor/,
            /coautora/,
            /coautor/,
            /livro/,
            /artigo publicado/
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
            paragrafo =
                "O profissional apresenta formação acadêmica e técnica, " +
                "com destaque para " + formacao + ".";
        }

        if (certificacoes) {
            paragrafo +=
                (paragrafo ? " " : "") +
                "Também possui certificações e qualificações complementares, " +
                "incluindo " + certificacoes + ".";
        }

        paragrafos.push(paragrafo);
    }

    // 2. Experiência profissional

    if (categorias.experiencia.length) {

        paragrafos.push(
            "Sua trajetória profissional contempla experiências em " +
            categorias.experiencia.join("; ") + "."
        );
    }

    // 3. Conhecimentos técnicos e publicações

    const conhecimentos = categorias.conhecimentos.join(", ");

    let paragrafoTecnico = "";

    if (conhecimentos) {
        paragrafoTecnico =
            "Entre suas principais áreas de atuação e conhecimentos técnicos, " +
            "destacam-se " + conhecimentos + ".";
    }

    if (categorias.publicacoes.length) {
        paragrafoTecnico +=
            (paragrafoTecnico ? " " : "") +
            "O currículo também registra publicações e produções técnicas, " +
            "incluindo " + categorias.publicacoes.join("; ") + ".";
    }

    if (paragrafoTecnico) {
        paragrafos.push(paragrafoTecnico);
    }

    // 4. Experiência docente

    if (categorias.docencia.length) {

        paragrafos.push(
            "Na área acadêmica, possui experiência em docência, " +
            "tutoria e formação profissional, com atuação em " +
            categorias.docencia.join("; ") + "."
        );
    }

    if (!paragrafos.length) {
        return "Não foram identificadas informações suficientes para elaborar a apresentação profissional. Recomenda-se a revisão manual do currículo.";
    }

    return paragrafos.join("\n\n");
}

