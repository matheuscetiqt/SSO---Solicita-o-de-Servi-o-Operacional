import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector("form");

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.querySelector('input[type="email"]').value.trim();
        const senha = document.querySelector('input[type="password"]').value;

        if (!email || !senha) {
            alert("Informe o e-mail e a senha.");
            return;
        }

        try {

            await signInWithEmailAndPassword(auth, email, senha);

            window.location.href = "dashboard.html";

        } catch (error) {

            console.error(error);

            alert("E-mail ou senha inválidos.");

        }

    });

});
