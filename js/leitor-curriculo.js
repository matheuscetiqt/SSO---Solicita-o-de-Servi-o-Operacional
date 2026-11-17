
/* =====================================================
   LEITOR DE CURRÍCULOS PDF
   Utiliza PDF.js
   ===================================================== */

async function lerCurriculoPDF(arquivo) {

    if (!arquivo) {
        throw new Error("Selecione um currículo.");
    }

    if (arquivo.type !== "application/pdf") {
        throw new Error("Por enquanto, aceitamos somente arquivos PDF.");
    }

    const limite = 15 * 1024 * 1024;

    if (arquivo.size > limite) {
        throw new Error("O currículo ultrapassa o limite de 15 MB.");
    }

    const pdf = await pdfjsLib.getDocument({
        data: await arquivo.arrayBuffer()
    }).promise;

    let textoCompleto = "";

    for (let pagina = 1; pagina <= pdf.numPages; pagina++) {

        const paginaPDF = await pdf.getPage(pagina);
        const conteudo = await paginaPDF.getTextContent();

        const textoPagina = conteudo.items
            .map(item => item.str)
            .join(" ");

        textoCompleto += "\n" + textoPagina;
    }

    if (textoCompleto.trim().length < 50) {
        throw new Error(
            "Não foi possível extrair texto. O PDF pode ser digitalizado como imagem."
        );
    }

    return textoCompleto;
}
