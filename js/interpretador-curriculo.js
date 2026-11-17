
/* =====================================================
   INTERPRETADOR DE CURRÍCULOS
   Versão 6.0 - Interpretação por seções
   ===================================================== */

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function limparTexto(texto) {
    return String(texto || "")
        .replace(/[•●▪]/g, "")
        .replace(/\s+/g, " ")
        .replace(/^[\s\-–—:;]+|[\s\-–—:;]+$/g, "")
        .trim();
}

// =====================================================
// IDENTIFICAÇÃO DAS SEÇÕES
// =====================================================


function identificarSecao(linha) {
    const texto = normalizarTexto(linha)
        .replace(/^\d+\s*[.)-]?\s*/, "")
        .trim();

    if (/^(dados academicos|formacao academica|formacao|formacao escolar)/.test(texto)) {
        return "formacao";
    }

    if (/^(experiencia profissional|historico profissional|experiencia)/.test(texto)) {
        return "experiencia";
    }

    if (/^(publicacoes|producao academica|producao tecnica)/.test(texto)) {
        return "publicacoes";
    }

    if (/^(experiencias em docencia|experiencia docente|docencia)/.test(texto)) {
        return "docencia";
    }

    if (/^(cursos complementares|certificacoes|qualificacoes|cursos)/.test(texto)) {
        return "cursos";
    }

    if (/^(conhecimentos tecnicos|competencias|habilidades)/.test(texto)) {
        return "conhecimentos";
    }

    return null;
}


function separarSecoes(textoOriginal) {
    const linhas = textoOriginal
        .replace(/\r/g, "\n")
        .split("\n")
        .map(limparTexto)
        .filter(Boolean);

    const secoes = {
        geral: [],
        formacao: [],
        experiencia: [],
        publicacoes: [],
        docencia: [],
        cursos: [],
        conhecimentos: []
    };

    let secaoAtual = "geral";

    for (const linha of linhas) {
        const novaSecao = identificarSecao(linha);

        if (novaSecao) {
            secaoAtual = novaSecao;
            continue;
        }

        secoes[secaoAtual].push(linha);
    }

    return secoes;
}

// =====================================================
// LIMPEZA E FILTRAGEM
// =====================================================

function linhaValida(linha) {
    const texto = limparTexto(linha);
    const normalizado = normalizarTexto(texto);

    if (texto.length < 15 || texto.length > 400) return false;

    if (
        /e-mail:|email:|telefone:|celular:|linkedin:|https?:\/\/|www\./i.test(texto) ||
        /@/.test(texto)
    ) return false;

    if (/^[0-9\s./-]+$/.test(texto)) return false;

    if (
        /^(nome|telefone|email|linkedin|local de atuacao):/.test(normalizado)
    ) return false;

    return true;
}

function selecionarLinhas(linhas, padroes, limite = 4) {
    const resultado = [];

    for (const linha of linhas) {
        if (!linhaValida(linha)) continue;

        const normalizado = normalizarTexto(linha);

        if (!padroes.some(padrao => padrao.test(normalizado))) {
            continue;
        }

        if (resultado.some(item =>
            normalizarTexto(item) === normalizado
        )) continue;

        resultado.push(limparTexto(linha));

        if (resultado.length >= limite) break;
    }

    return resultado;
}

// Agrupa linhas que continuam uma formação iniciada por data
function agruparRegistrosAcademicos(linhas) {
    const registros = [];
    let atual = "";

    for (const linha of linhas) {
        if (!linhaValida(linha)) continue;

        const iniciaRegistro =
            /^(19|20)\d{2}\s*[-–/]/.test(linha);

        if (iniciaRegistro) {
            if (atual) registros.push(atual);
            atual = linha;
        } else if (atual && linha.length > 10) {
            atual += " " + linha;
        }
    }

    if (atual) registros.push(atual);

    return registros.filter(linhaValida);
}

// =====================================================
// EXTRAÇÃO DE INFORMAÇÕES
// =====================================================

function interpretarCurriculo(textoOriginal) {
    if (!textoOriginal || textoOriginal.trim().length < 50) {
        throw new Error("Não foi possível identificar conteúdo suficiente no currículo.");
    }

    const secoes = separarSecoes(textoOriginal);

    const formacoes = agruparRegistrosAcademicos(secoes.formacao);

    const experiencia = selecionarLinhas(secoes.experiencia, [
        /posicao atual/,
        /atuacao como/,
        /atuacao na area/,
        /trabalhou como/,
        /engenheir/,
        /consultor/,
        /coordenador/,
        /gerente/,
        /analista/,
        /supervisor/
    ], 4);

    const docencia = selecionarLinhas(secoes.docencia, [
        /professor/,
        /professora/,
        /docente/,
        /tutor/,
        /tutora/,
        /instrutor/,
        /instrutora/,
        /atuacao como/
    ], 4);

    const cursos = selecionarLinhas(secoes.cursos, [
        /curso/,
        /workshop/,
        /certificacao/,
        /certificado/,
        /treinamento/,
        /programa/
    ], 3);

    const publicacoes = selecionarLinhas(secoes.publicacoes, [
        /rio oil/,
        /livro/,
        /co.autor/,
        /coautora/,
        /publicacao/
    ], 3);

    const conhecimentos = [
        "Segurança de Processos",
        "Segurança Operacional",
        "Segurança Funcional",
        "Análise de Riscos",
        "Análise Qualitativa de Riscos",
        "HAZOP",
        "LOPA",
        "Bow Tie",
        "Gestão de Mudanças",
        "Processamento de Petróleo",
        "Engenharia de Refino",
        "Exploração e Produção",
        "Regulamentação da ANP",
        "Transição Energética",
        "Sistemas Instrumentados de Segurança",
        "Instrumentação e Automação",
        "Automação Industrial"
    ].filter(termo =>
        normalizarTexto(textoOriginal).includes(normalizarTexto(termo))
    ).slice(0, 8);

    const categorias = {
        formacao: formacoes.slice(0, 5),
        experiencia,
        certificacoes: cursos,
        docencia,
        publicacoes,
        conhecimentos
    };

    return {
        categorias,
        secoes,
        textoOriginal,
        textoGerado: gerarTextoCurriculo(categorias)
    };
}

// =====================================================
// GERAÇÃO DO TEXTO INSTITUCIONAL
// =====================================================

function gerarTextoCurriculo(categorias) {
    const paragrafos = [];

    // 1. Formação
    if (categorias.formacao.length) {
        paragrafos.push(
            "O profissional apresenta formação acadêmica e técnica, " +
            "com trajetória que contempla " +
            categorias.formacao.join("; ") + "."
        );
    }

    // 2. Experiência profissional
    if (categorias.experiencia.length) {
        paragrafos.push(
            "Sua trajetória profissional inclui atuação em diferentes " +
            "áreas e funções, destacando-se " +
            categorias.experiencia.join("; ") + "."
        );
    }

    // 3. Conhecimentos e publicações
    let tecnico = "";

    if (categorias.conhecimentos.length) {
        tecnico =
            "Entre seus principais conhecimentos técnicos, destacam-se " +
            categorias.conhecimentos.join(", ") + ".";
    }

    if (categorias.publicacoes.length) {
        tecnico +=
            (tecnico ? " " : "") +
            "Também apresenta produção técnica e acadêmica, incluindo " +
            categorias.publicacoes.join("; ") + ".";
    }

    if (tecnico) paragrafos.push(tecnico);

    // 4. Docência
    if (categorias.docencia.length) {
        paragrafos.push(
            "Na área acadêmica, apresenta experiência em docência e " +
            "formação profissional, com atuação em " +
            categorias.docencia.join("; ") + "."
        );
    }

    if (!paragrafos.length) {
        return "Não foram identificadas informações suficientes para elaborar a apresentação profissional. Recomenda-se a revisão manual do currículo.";
    }

    return paragrafos.join("\n\n");
}
