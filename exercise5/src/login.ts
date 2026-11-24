import { AuthService } from "./classes/auth.service.ts";
import { type LoginData } from "./interfaces/user.ts";

const authService = new AuthService();
const form = document.getElementById("form-login") as HTMLFormElement;

form.addEventListener("submit", async event => {
  event.preventDefault();
  const user: LoginData = {
    email: (form.elements.namedItem("email") as HTMLInputElement).value,
    password: (form.elements.namedItem("password") as HTMLInputElement).value,
  };

  try {
    await authService.login(user);
    location.assign("./index.html");
  } catch {
    alert("No se ha podido iniciar sesión. Comprueba tus credenciales.");
  }
});

authService
  .checkToken()
  .then(() => {
    location.assign("./index.html");
  })
  .catch(() => {
    // Nada, esperamos a que el usuario inicie sesión
  });
