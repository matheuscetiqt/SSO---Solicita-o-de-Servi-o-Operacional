
/* =====================================================
   INTERPRETADOR DE CURRÍCULOS
   Versão 7.1 - Extração ampliada e organização profissional
   ===================================================== */

// =====================================================
// NORMALIZAÇÃO
// =====================================================

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

// Corrige anos fragmentados pelo PDF
function corrigirDatas(texto) {

    return String(texto || "")
        .replace(/\b(19|20)\s+(\d{2})\b/g, "$1$2")
        .replace(/\b(19|20)(\d)\s+(\d)\b/g, "$1$2$3")
        .replace(/\s*[-–]\s*/g, " - ");
}

// =====================================================
// IDENTIFICAÇÃO DAS SEÇÕES
// =====================================================

function identificarSecao(linha) {

    const texto = normalizarTexto(linha)
        .replace(/^\d+\s*[.)-]?\s*/, "")
        .trim();

    if (/^(dados academicos|formacao academica|formacao|formacao escolar|education)/.test(texto)) {
        return "formacao";
    }

    if (/^(experiencia profissional|historico profissional|experiencia|experience|professional experience|work experience)/.test(texto)) {
        return "experiencia";
    }

    if (/^(publicacoes|producao academica|producao tecnica|publications)/.test(texto)) {
        return "publicacoes";
    }

    if (/^(experiencias em docencia|experiencia docente|docencia|teaching experience)/.test(texto)) {
        return "docencia";
    }

    if (/^(cursos complementares|certificacoes|qualificacoes|cursos|certifications|courses)/.test(texto)) {
        return "cursos";
    }

    if (/^(conhecimentos tecnicos|competencias|habilidades|skills)/.test(texto)) {
        return "conhecimentos";
    }

    return null;
}

// =====================================================
// SEPARAÇÃO DAS SEÇÕES
// =====================================================

function separarSecoes(textoOriginal) {

    const linhas = corrigirDatas(textoOriginal)
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
// FILTRO DE INFORMAÇÕES IRRELEVANTES
// =====================================================

function linhaValida(linha) {

    const texto = limparTexto(linha);
    const normalizado = normalizarTexto(texto);

    if (texto.length < 15 || texto.length > 700) {
        return false;
    }

    if (
        /e-mail:|email:|telefone:|celular:|linkedin:|https?:\/\/|www\./i.test(texto) ||
        /@/.test(texto)
    ) {
        return false;
    }

    if (/^[0-9\s./-]+$/.test(texto)) {
        return false;
    }

    if (
        /^(nome|telefone|email|linkedin|local de atuacao|dados pessoais):/.test(normalizado)
    ) {
        return false;
    }

    if (
        /^(curriculum vitae|curriculo vitae|curriculo|page \d+|pagina \d+)$/.test(normalizado)
    ) {
        return false;
    }

    return true;
}

function extrairConteudoCompleto(linhas) {

    const resultado = [];
    const vistos = new Set();

    for (const linha of linhas) {

        const texto = limparTexto(corrigirDatas(linha));

        if (!linhaValida(texto)) continue;

        const chave = normalizarTexto(texto);

        if (vistos.has(chave)) continue;

        vistos.add(chave);
        resultado.push(texto);
    }

    return resultado;
}

// =====================================================
// FORMAÇÃO ACADÊMICA
// =====================================================

function agruparRegistrosAcademicos(linhas) {

    const registros = [];
    let atual = "";

    for (const linha of linhas) {

        const texto = limparTexto(corrigirDatas(linha));

        if (!linhaValida(texto)) continue;

        const iniciaRegistro =
            /\b(19|20)\d{2}\b/.test(texto);

        if (iniciaRegistro) {

            if (atual) {
                registros.push(atual);
            }

            atual = texto;

        } else if (atual) {

            atual += " " + texto;
        }
    }

    if (atual) {
        registros.push(atual);
    }

    return registros.filter(linhaValida);
}

// =====================================================
// IDENTIFICAÇÃO DE DOCÊNCIA
// =====================================================

function extrairDocencia(linhas) {

    const resultado = [];

    const padroes = [
        /professor/,
        /professora/,
        /docente/,
        /ministrad/,
        /materias ministradas/,
        /planejamento das aulas/,
        /instrutor/,
        /instrutora/,
        /tutor/,
        /tutora/
    ];

    for (const linha of linhas) {

        if (!linhaValida(linha)) continue;

        if (
            padroes.some(padrao =>
                padrao.test(normalizarTexto(linha))
            )
        ) {
            resultado.push(limparTexto(linha));
        }
    }

    return [...new Set(resultado)];
}

// =====================================================
// CONHECIMENTOS TÉCNICOS
// =====================================================

function identificarConhecimentos(textoOriginal) {

    const termos = [
        "Segurança de Processos",
        "Segurança Operacional",
        "Segurança Funcional",
        "Análise de Riscos",
        "HAZOP",
        "APR",
        "What If",
        "Gestão de Mudanças",
        "Gestão de Barreiras",
        "Investigação de Incidentes",
        "Auditorias",
        "Petróleo e Gás Natural",
        "Tratamento de Petróleo",
        "Corrosão Interna de Dutos",
        "Power BI",
        "SAP-BW",
        "PHAST",
        "PipeSim",
        "Engenharia Química",
        "Processamento de Petróleo",
        "Análise de Consequências"
    ];

    const texto = normalizarTexto(textoOriginal);

    return termos.filter(termo =>
        texto.includes(normalizarTexto(termo))
    );
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

    const textoCorrigido = corrigirDatas(textoOriginal);
    const secoes = separarSecoes(textoCorrigido);

    // Perfil: aproveita a introdução, mas exclui dados pessoais
    const perfil = extrairConteudoCompleto(
        secoes.geral.filter(linha => {
            const normalizado = normalizarTexto(linha);

            return !/dados pessoais|curriculum vitae|curriculo vitae|brasileira|endereco:|cep:/.test(normalizado);
        })
    );

    // Formação acadêmica
    const formacao = agruparRegistrosAcademicos(secoes.formacao);

    // Experiência profissional completa
    const experiencia = extrairConteudoCompleto(
        secoes.experiencia
    );

    // Docência identificada dentro da experiência
    const docencia = extrairDocencia([
        ...secoes.docencia,
        ...secoes.experiencia
    ]);

    // Cursos e certificações
    const certificacoes = extrairConteudoCompleto([
        ...secoes.cursos
    ]);

    // Publicações
    const publicacoes = extrairConteudoCompleto([
        ...secoes.publicacoes
    ]);

    // Conhecimentos
    const conhecimentos = identificarConhecimentos(
        textoCorrigido
    );

    const categorias = {
        perfil,
        formacao,
        experiencia,
        certificacoes,
        docencia,
        publicacoes,
        conhecimentos
    };

    return {
        categorias,
        secoes,
        textoOriginal: textoCorrigido,
        textoGerado: gerarTextoCurriculo(categorias)
    };
}

// =====================================================
// GERAÇÃO DO TEXTO INSTITUCIONAL
// =====================================================

function gerarTextoCurriculo(categorias) {

    const paragrafos = [];

    // PERFIL PROFISSIONAL
    if (categorias.perfil.length) {

        paragrafos.push(
            "O profissional apresenta perfil técnico e experiência " +
            "compatíveis com atividades especializadas, conforme " +
            "descrito em seu currículo: " +
            categorias.perfil.join(" ")
        );
    }

    // FORMAÇÃO
    if (categorias.formacao.length) {

        paragrafos.push(
            "Em relação à formação acadêmica, possui " +
            categorias.formacao.join("; ") + "."
        );
    }

    // EXPERIÊNCIA PROFISSIONAL
    if (categorias.experiencia.length) {

        paragrafos.push(
            "Sua trajetória profissional contempla as seguintes " +
            "experiências e responsabilidades: " +
            categorias.experiencia.join(" ")
        );
    }

    // CONHECIMENTOS
    if (categorias.conhecimentos.length) {

        paragrafos.push(
            "Entre os conhecimentos técnicos identificados, " +
            "destacam-se " +
            categorias.conhecimentos.join(", ") + "."
        );
    }

    // DOCÊNCIA
    if (categorias.docencia.length) {

        paragrafos.push(
            "No campo educacional, apresenta experiência em " +
            "docência e formação profissional, com atuação em " +
            categorias.docencia.join("; ") + "."
        );
    }

    // CERTIFICAÇÕES
    if (categorias.certificacoes.length) {

        paragrafos.push(
            "O currículo também registra cursos e qualificações " +
            "complementares: " +
            categorias.certificacoes.join("; ") + "."
        );
    }

    // PUBLICAÇÕES
    if (categorias.publicacoes.length) {

        paragrafos.push(
            "Adicionalmente, apresenta produção técnica e acadêmica: " +
            categorias.publicacoes.join("; ") + "."
        );
    }

    if (!paragrafos.length) {

        return "Não foram identificadas informações suficientes " +
            "para elaborar a apresentação profissional. " +
            "Recomenda-se a revisão manual do currículo.";
    }

    return paragrafos.join("\n\n");
}
