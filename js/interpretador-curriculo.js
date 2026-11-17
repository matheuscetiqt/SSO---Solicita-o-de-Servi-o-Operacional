
/* =====================================================
   INTERPRETADOR DE CURRÍCULOS
   Projeto: Gerador de Justificativa
   Versão inicial: 1.0
   ===================================================== */

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function removerDuplicados(lista) {
    const encontrados = new Set();

    return lista.filter(item => {
        const chave = normalizarTexto(item);

        if (!chave || encontrados.has(chave)) {
            return false;
        }

        encontrados.add(chave);
        return true;
    });
}

function interpretarCurriculo(textoOriginal) {

    if (!textoOriginal || textoOriginal.trim().length < 50) {
        throw new Error(
            "Não foi possível identificar conteúdo suficiente no currículo."
        );
    }

    const linhas = textoOriginal
        .split(/\n/)
        .map(linha => linha.replace(/\s+/g, " ").trim())
        .filter(linha => linha.length > 10);

    const categorias = {
        formacao: [],
        experiencia: [],
        certificacoes: [],
        docencia: [],
        conhecimentos: []
    };

    const padroes = {
        formacao: [
            /graduacao/i,
            /bacharelado/i,
            /licenciatura/i,
            /engenharia/i,
            /tecnico em/i,
            /mestrado/i,
            /doutorado/i,
            /pos.graduacao/i,
            /especializacao/i,
            /mba/i
        ],

        experiencia: [
            /experiencia profissional/i,
            /historico profissional/i,
            /atuacao profissional/i,
            /trabalhou/i,
            /atuou/i,
            /empresa/i,
            /engenheiro/i,
            /coordenador/i,
            /gerente/i,
            /consultor/i,
            /supervisor/i
        ],

        certificacoes: [
            /certificacao/i,
            /certificado/i,
            /qualificacao/i,
            /capacitação/i,
            /capacitacao/i,
            /treinamento/i,
            /tuv/i,
            /iso 9001/i,
            /iec 61508/i
        ],

        docencia: [
            /docencia/i,
            /professor/i,
            /docente/i,
            /instrutor/i,
            /universidade/i,
            /instituicao de ensino/i,
            /ministrou aulas/i,
            /curso de formacao/i
        ],

        conhecimentos: [
            /hazop/i,
            /lopa/i,
            /\bsil\b/i,
            /seguranca funcional/i,
            /gestao de projetos/i,
            /analise de riscos/i,
            /automacao industrial/i,
            /instrumentacao/i,
            /sistemas instrumentados/i,
            /gestao de processos/i
        ]
    };

    // Identificação das informações por palavras-chave
    linhas.forEach(linha => {

        const linhaNormalizada = normalizarTexto(linha);

        Object.entries(padroes).forEach(([categoria, regras]) => {

            const identificada = regras.some(regra =>
                regra.test(linhaNormalizada)
            );

            if (identificada) {
                categorias[categoria].push(linha);
            }
        });
    });

    // Evita repetições
    Object.keys(categorias).forEach(categoria => {
        categorias[categoria] =
            removerDuplicados(categorias[categoria]);
    });

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

    if (categorias.formacao.length > 0) {
        paragrafos.push(
            "O profissional apresenta formação acadêmica e técnica " +
            "composta pelas seguintes qualificações: " +
            categorias.formacao.join("; ") + "."
        );
    }

    if (categorias.experiencia.length > 0) {
        paragrafos.push(
            "Sua trajetória profissional contempla experiências " +
            "em diferentes atividades e funções, destacando-se: " +
            categorias.experiencia.join("; ") + "."
        );
    }

    if (categorias.certificacoes.length > 0) {
        paragrafos.push(
            "O currículo também registra certificações, capacitações " +
            "e qualificações complementares, incluindo: " +
            categorias.certificacoes.join("; ") + "."
        );
    }

    if (categorias.docencia.length > 0) {
        paragrafos.push(
            "Em sua trajetória educacional, constam experiências " +
            "relacionadas à docência, ao ensino e à disseminação " +
            "de conhecimentos, incluindo: " +
            categorias.docencia.join("; ") + "."
        );
    }

    if (categorias.conhecimentos.length > 0) {
        paragrafos.push(
            "Entre os conhecimentos técnicos identificados no currículo, " +
            "destacam-se: " +
            categorias.conhecimentos.join(", ") + "."
        );
    }

    if (paragrafos.length === 0) {
        return "Não foram identificadas informações suficientes para construir a apresentação profissional. Revise o currículo manualmente.";
    }

    return paragrafos.join("\n\n");
}
