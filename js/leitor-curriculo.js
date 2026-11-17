
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

        const itens = conteudo.items.filter(item =>
            item.str && item.str.trim()
        );

        const linhas = [];

        // Agrupa fragmentos pela posição vertical
        for (const item of itens) {

            const x = item.transform[4];
            const y = item.transform[5];

            let linha = linhas.find(l =>
                Math.abs(l.y - y) < 3
            );

            if (!linha) {
                linha = { y, itens: [] };
                linhas.push(linha);
            }

            linha.itens.push({
                x,
                largura: item.width || 0,
                texto: item.str.trim()
            });
        }

        // Ordena de cima para baixo
        linhas.sort((a, b) => b.y - a.y);

        const textoPagina = linhas.map(linha => {

            linha.itens.sort((a, b) => a.x - b.x);

            let resultado = "";
            let anterior = null;

            for (const item of linha.itens) {

                if (!anterior) {
                    resultado = item.texto;
                    anterior = item;
                    continue;
                }

                const espaco = item.x -
                    (anterior.x + anterior.largura);

                const fimAnterior = resultado.slice(-1);
                const inicioAtual = item.texto.charAt(0);

                const fragmentoNumerico =
                    /\d/.test(fimAnterior) &&
                    /^\d/.test(inicioAtual) &&
                    espaco < 8;

                const fragmentoPalavra =
                    espaco < 1.5;

                if (fragmentoNumerico || fragmentoPalavra) {
                    resultado += item.texto;
                } else {
                    resultado += " " + item.texto;
                }

                anterior = item;
            }

            return resultado.trim();

        }).filter(Boolean).join("\n");

        textoCompleto += "\n\n" + textoPagina;
    }

    if (textoCompleto.trim().length < 50) {
        throw new Error(
            "Não foi possível extrair texto. O PDF pode estar digitalizado como imagem."
        );
    }

    return textoCompleto;
}
