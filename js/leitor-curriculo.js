
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

    for (let numeroPagina = 1; numeroPagina <= pdf.numPages; numeroPagina++) {

        const pagina = await pdf.getPage(numeroPagina);
        const conteudo = await pagina.getTextContent();

        // Mantém apenas os itens que possuem texto
        const itens = conteudo.items.filter(item =>
            item.str && item.str.trim()
        );

        const linhas = [];

        // Agrupa os textos pela posição vertical (eixo Y)
        for (const item of itens) {

            const x = item.transform[4];
            const y = item.transform[5];

            let linha = linhas.find(l =>
                Math.abs(l.y - y) < 3
            );

            if (!linha) {
                linha = {
                    y: y,
                    itens: []
                };

                linhas.push(linha);
            }

            linha.itens.push({
                x: x,
                texto: item.str
            });
        }

        // Ordena as linhas de cima para baixo
        linhas.sort((a, b) => b.y - a.y);

        // Ordena os textos de cada linha da esquerda para a direita
        const textoPagina = linhas.map(linha => {

            linha.itens.sort((a, b) => a.x - b.x);

            return linha.itens
                .map(item => item.texto.trim())
                .filter(Boolean)
                .join(" ");

        }).join("\n");

        textoCompleto += "\n\n" + textoPagina;
    }

    if (textoCompleto.trim().length < 50) {
        throw new Error(
            "Não foi possível extrair texto. O PDF pode estar digitalizado como imagem."
        );
    }

    return textoCompleto;
}
