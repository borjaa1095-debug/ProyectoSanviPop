import { AuthService } from "./classes/auth.service.ts";
import { MyGeolocation } from "./classes/my-geolocation.ts";
import { type RegisterData } from "./interfaces/user.ts";

const authService = new AuthService();
const form = document.getElementById("form-register") as HTMLFormElement;
const latInput = document.getElementById("lat") as HTMLInputElement;
const lngInput = document.getElementById("lng") as HTMLInputElement;

const email = form.elements.namedItem("email") as HTMLInputElement;
const email2 = form.elements.namedItem("email2") as HTMLInputElement;
const photoInput = document.getElementById("photo") as HTMLInputElement;
const imgPreview = document.getElementById("imgPreview") as HTMLImageElement;

let photo = "";

function validateEmails(): void {
  if (email.value !== email2.value) {
    email2.setCustomValidity("Los emails deben coincidir.");
  } else {
    email2.setCustomValidity("");
  }
}

authService
  .checkToken()
  .then(() => {
    location.assign("./index.html");
  })
  .catch(() => {
    // Sin sesión válida, permanecemos en el registro
  });

email.addEventListener("input", validateEmails);
email2.addEventListener("input", validateEmails);

photoInput.addEventListener("change", () => {
  const file = photoInput.files?.[0];

  if (file) {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      photo = reader.result as string;

      imgPreview.src = photo;
      imgPreview.classList.remove("d-none");
    });

    reader.readAsDataURL(file);
  }
});

MyGeolocation.getLocation()
  .then(coords => {
    latInput.value = String(coords.latitude);

    lngInput.value = String(coords.longitude);
  })
  .catch(() => {
    alert(
      "No se pudo obtener tu ubicación. Comprueba los permisos del navegador."
    );
  });

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (photo === "") {
    alert("Espera a que se cargue la foto.");
    return;
  }

  if (latInput.value === "" || lngInput.value === "") {
    alert("Espera a que se obtenga tu ubicación y comprueba los permisos.");
    return;
  }
  const user: RegisterData = {
    name: (form.elements.namedItem("nameUser") as HTMLInputElement).value,
    email: email.value,
    password: (form.elements.namedItem("password") as HTMLInputElement).value,
    photo: photo,
    lat: Number(latInput.value),
    lng: Number(lngInput.value),
  };

  try {
    await authService.register(user);

    location.assign("./login.html");
  } catch (error: unknown) {
    let message = "No se pudo registrar el usuario.";

    if (error instanceof Error) {
      message = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error
    ) {
      const serverMessage = error.message;

      if (typeof serverMessage === "string") {
        message = serverMessage;
      } else if (Array.isArray(serverMessage)) {
        message = serverMessage.join("\n");
      }
    }

    alert(message);
  }
});
