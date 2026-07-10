// Aguarda o carregamento da página
document.addEventListener("DOMContentLoaded", () => {

    console.log("window.supabase:", window.supabase);
console.log("cliente:", supabase);

    const form = document.querySelector("form");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = document.querySelector('input[type="email"]').value.trim();
        const senha = document.querySelector('input[type="password"]').value;

        if (!email || !senha) {
            alert("Informe o e-mail e a senha.");
            return;
        }

        try {

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: senha
            });

            if (error) {
                alert("Erro: " + error.message);
                console.error(error);
                return;
            }

            console.log("Usuário autenticado:", data);

            window.location.href = "dashboard.html";

        } catch (erro) {

            console.error(erro);

            alert("Erro ao conectar ao servidor.");

        }

    });

});
