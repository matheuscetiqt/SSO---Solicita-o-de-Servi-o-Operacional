async function salvarSolicitacao(dados) {

    const { data, error } = await supabase
        .from('solicitacoes')
        .insert([dados]);

    if (error) {
        console.error(error);
        alert("Erro ao salvar solicitação.");
        return false;
    }

    alert("Solicitação enviada com sucesso!");

    return true;
}
