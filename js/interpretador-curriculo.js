
/* =====================================================
   INTERPRETADOR DE CURRÍCULOS
   Versão 5.0 - Classificação mais precisa
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

// Remove informações pessoais e trechos sem valor profissional
function trechoValido(texto) {
    const trecho = limparTrecho(texto);
    const normalizado = normalizarTexto(trecho);

    if (trecho.length < 20 || trecho.length > 350) return false;

    if (
        /e-mail:|email:|telefone:|celular:|linkedin:|https?:\/\/|www\./i.test(trecho)
    ) return false;

    if (
        /@/.test(trecho) ||
        /^[0-9\s./-]+$/.test(trecho)
    ) return false;

    const titulos = [
        "curriculum vitae",
        "historico profissional",
        "experiencia profissional",
        "formacao academica",
        "dados academicos",
        "qualificacoes",
        "conhecimentos tecnicos",
        "objetivo profissional",
        "cursos complementares",
        "experiencias em docencia",
        "publicacoes",
        "dados pessoais"
    ];

    if (titulos.includes(normalizado)) return false;

    if (/^(posicao|cargo|nome|telefone|email|local de atuacao):/i.test(normalizado)) {
        return false;
    }

    return true;
}

// Separa os blocos extraídos do PDF
function separarTrechos(texto) {
    return String(texto || "")
        .replace(/\r/g, "\n")
        .split(/[\n•;]+/)
        .map(limparTrecho)
        .filter(trechoValido);
}

// Seleciona informações sem repetir trechos
function selecionarTrechos(texto, padroes, limite = 3) {
    const trechos = separarTrechos(texto);
    const selecionados = [];

    for (const trecho of trechos) {
        const normalizado = normalizarTexto(trecho);

        if (!padroes.some(padrao => padrao.test(normalizado))) {
            continue;
        }

        if (selecionados.some(item =>
            normalizarTexto(item) === normalizado
        )) continue;

        selecionados.push(trecho);

        if (selecionados.length >= limite) break;
    }

    return selecionados;
}

// =====================================================
// FORMAÇÃO ACADÊMICA
// =====================================================

function identificarFormacao(texto) {
    return selecionarTrechos(texto, [
        /\bgraduacao\b/,
        /\bbacharelado\b/,
        /\blicenciatura\b/,
        /\bmestrado\b/,
        /\bdoutorado\b/,
        /\bespecializacao\b/,
        /\bpos.graduacao\b/,
        /\btecnico em\b/,
        /\bmba\b/
    ], 6).filter(trecho => {
        const t = normalizarTexto(trecho);

        // Evita empresas e descrições de experiência
        return !/empresa|petrobras|chemtech|trabalhou|atuacao profissional/.test(t);
    });
}

// =====================================================
// EXPERIÊNCIA PROFISSIONAL
// =====================================================

function identificarExperiencia(texto) {
    return selecionarTrechos(texto, [
        /posicao atual:/,
        /atuacao como/,
        /atuacao na area/,
        /trabalhou como/,
        /trabalhou na/,
        /engenheira (quimica|de processamento|de producao)/,
        /engenheiro (quimico|de processamento|de producao)/,
        /consultora tecnica/,
        /consultor tecnico/,
        /coordenadora/,
        /coordenador/,
        /gerente/,
        /supervisora/,
        /supervisor/,
        /analista/
    ], 5).filter(trecho => {
        const t = normalizarTexto(trecho);

        return !/e-mail|linkedin|telefone|membro do time|mentora no programa/.test(t);
    });
}

// =====================================================
// CERTIFICAÇÕES E CURSOS
// =====================================================

function identificarCertificacoes(texto) {
    return selecionarTrechos(texto, [
        /certificacao/,
        /certificado/,
        /functional safety engineer/,
        /tuv rheinland/,
        /workshop/,
        /curso complementar/,
        /programa de formacao/,
        /harvard manage mentor/
    ], 4);
}

// =====================================================
// EXPERIÊNCIA DOCENTE
// =====================================================

function identificarDocencia(texto) {
    return selecionarTrechos(texto, [
        /atuacao como professora/,
        /atuacao como professor/,
        /atuacao como docente/,
        /atuacao como tutora/,
        /atuacao como tutor/,
        /professora nas disciplinas/,
        /professor nas disciplinas/,
        /professora em disciplinas/,
        /professor em disciplinas/,
        /docente em/,
        /experiencia em docencia/,
        /ministrou aulas/,
        /atuacao como instrutora/,
        /atuacao como instrutor/
    ], 5);
}

// =====================================================
// PUBLICAÇÕES
// =====================================================

function identificarPublicacoes(texto) {
    return selecionarTrechos(texto, [
        /co.autora/,
        /coautor/,
        /co.autor/,
        /publicado em/,
        /publicacao tecnica/,
        /rio oil/,
        /livro/
    ], 4);
}

// =====================================================
// CONHECIMENTOS TÉCNICOS
// =====================================================

function identificarConhecimentos(texto) {
    const termos = [
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
        "Automação Industrial",
        "Comissionamento",
        "Normalização Técnica",
        "Pesquisa e Desenvolvimento"
    ];

    const normalizado = normalizarTexto(texto);

    return termos.filter(termo => {
        const busca = normalizarTexto(termo);

        if (busca === "lopa" || busca === "hazop") {
            return new RegExp("\\b" + busca + "\\b").test(normalizado);
        }

        return normalizado.includes(busca);
    }).slice(0, 8);
}

// =====================================================
// INTERPRETAÇÃO
// =====================================================

function interpretarCurriculo(textoOriginal) {
    if (!textoOriginal || textoOriginal.trim().length < 50) {
        throw new Error("Não foi possível identificar conteúdo suficiente no currículo.");
    }

    const categorias = {
        formacao: identificarFormacao(textoOriginal),
        experiencia: identificarExperiencia(textoOriginal),
        certificacoes: identificarCertificacoes(textoOriginal),
        docencia: identificarDocencia(textoOriginal),
        publicacoes: identificarPublicacoes(textoOriginal),
        conhecimentos: identificarConhecimentos(textoOriginal)
    };

    return {
        categorias,
        textoOriginal,
        textoGerado: gerarTextoCurriculo(categorias)
    };
}

// =====================================================
// TEXTO INSTITUCIONAL
// =====================================================

function gerarTextoCurriculo(categorias) {
    const paragrafos = [];

    const formacao = categorias.formacao.join("; ");
    const certificacoes = categorias.certificacoes.join("; ");

    // 1. Formação
    if (formacao || certificacoes) {
        let paragrafo = "O currículo registra ";

        if (formacao) {
            paragrafo += "formação acadêmica e técnica, incluindo " + formacao + ".";
        } else {
            paragrafo += "qualificações complementares na área profissional.";
        }

        if (certificacoes) {
            paragrafo += " Também apresenta cursos e certificações complementares, como " +
                certificacoes + ".";
        }

        paragrafos.push(paragrafo);
    }

    // 2. Experiência
    if (categorias.experiencia.length) {
        paragrafos.push(
            "A trajetória profissional contempla experiências em " +
            categorias.experiencia.join("; ") + "."
        );
    }

    // 3. Conhecimentos e publicações
    let tecnico = "";

    if (categorias.conhecimentos.length) {
        tecnico = "Entre os conhecimentos técnicos identificados, destacam-se " +
            categorias.conhecimentos.join(", ") + ".";
    }

    if (categorias.publicacoes.length) {
        tecnico += (tecnico ? " " : "") +
            "O currículo também registra publicações e produções técnicas, incluindo " +
            categorias.publicacoes.join("; ") + ".";
    }

    if (tecnico) paragrafos.push(tecnico);

    // 4. Docência
    if (categorias.docencia.length) {
        paragrafos.push(
            "Na área acadêmica, apresenta experiência em docência e formação profissional, " +
            "com atuação em " + categorias.docencia.join("; ") + "."
        );
    }

    if (!paragrafos.length) {
        return "Não foram identificadas informações suficientes para elaborar a apresentação profissional. Recomenda-se a revisão manual do currículo.";
    }

    return paragrafos.join("\n\n");
}
