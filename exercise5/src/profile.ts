import { AuthService } from "./classes/auth.service.ts";
import { UsersService } from "./classes/users.service.ts";
import type { User } from "./interfaces/user.ts";
import {
  element,
  errorMessage,
  setupLogout,
  showMap,
  readImage,
} from "./page-utils.ts";

const usersService = new UsersService();
const info = element("#profileInfo");
const profilePanel = element("#profileForm");
const passwordPanel = element("#passwordForm");
const profileForm = element<HTMLFormElement>("#profileForm form");
const passwordForm = element<HTMLFormElement>("#passwordForm form");
const nameInput = element<HTMLInputElement>('#profileForm input[name="name"]');
const emailInput = element<HTMLInputElement>(
  '#profileForm input[name="email"]'
);
const passwordInput = element<HTMLInputElement>("#password");
const password2Input = element<HTMLInputElement>("#password2");
const photoInput = element<HTMLInputElement>("#photoInput");
const photo = element<HTMLImageElement>("#photo");
let user: User;
let saving = false;

nameInput.required = true;
emailInput.required = true;
passwordInput.required = true;
passwordInput.minLength = 8;
passwordInput.maxLength = 100;
password2Input.required = true;
photoInput.accept = "image/*";
element("#profile").classList.add("d-none");
setupLogout();

function setSaving(value: boolean): void {
  saving = value;
  document
    .querySelectorAll<HTMLButtonElement | HTMLInputElement>(
      "#profile button, #profile input"
    )
    .forEach(control => {
      control.disabled = value;
    });
}

function renderProfile(): void {
  element("#profileInfo #name").textContent = user.name;
  element("#profileInfo #email").textContent = user.email;
  nameInput.value = user.name;
  emailInput.value = user.email;
  photo.src = user.photo;
  photo.alt = user.name;
  element("#editProfile").classList.toggle("d-none", !user.me);
  element("#editPassword").classList.toggle("d-none", !user.me);
  photoInput.closest("label")!.classList.toggle("d-none", !user.me);
  element("#linkFavorites").classList.toggle("d-none", !user.me);
  const links: Record<string, string> = {
    linkSelling: "selling",
    linkSold: "sold",
    linkBought: "bought",
    linkFavorites: "bookmarks",
  };
  for (const [linkId, status] of Object.entries(links)) {
    const params = new URLSearchParams({ user: String(user.id), status });
    element<HTMLAnchorElement>(`#${linkId}`).href = `index.html?${params}`;
  }
  element("#profile").classList.remove("d-none");
}

function closeForms(): void {
  info.classList.remove("d-none");
  profilePanel.classList.add("d-none");
  passwordPanel.classList.add("d-none");
}

element("#editProfile").addEventListener("click", () => {
  if (!user.me || saving) return;
  nameInput.value = user.name;
  emailInput.value = user.email;
  info.classList.add("d-none");
  profilePanel.classList.remove("d-none");
});
element("#cancelEditProfile").addEventListener("click", closeForms);
element("#cancelEditPassword").addEventListener("click", closeForms);

profileForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!user.me || saving || !profileForm.reportValidity()) return;
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  if (name === "") {
    alert("Escribe tu nombre.");
    return;
  }
  setSaving(true);
  try {
    await usersService.update({ name, email });
    user.name = name;
    user.email = email;
    renderProfile();
    closeForms();
    alert("Datos del perfil actualizados.");
  } catch (error: unknown) {
    alert(errorMessage(error));
  } finally {
    setSaving(false);
  }
});

element("#editPassword").addEventListener("click", () => {
  if (!user.me || saving) return;
  passwordForm.reset();
  password2Input.setCustomValidity("");
  info.classList.add("d-none");
  passwordPanel.classList.remove("d-none");
});

function validatePasswords(): void {
  password2Input.setCustomValidity(
    passwordInput.value === password2Input.value
      ? ""
      : "Las contraseñas no coinciden."
  );
}
passwordInput.addEventListener("input", validatePasswords);
password2Input.addEventListener("input", validatePasswords);

passwordForm.addEventListener("submit", async event => {
  event.preventDefault();
  validatePasswords();
  if (!user.me || saving || !passwordForm.reportValidity()) return;
  setSaving(true);
  try {
    await usersService.password(passwordInput.value);
    passwordForm.reset();
    closeForms();
    alert("Contraseña actualizada.");
  } catch (error: unknown) {
    alert(errorMessage(error));
  } finally {
    setSaving(false);
  }
});

photoInput.addEventListener("change", async () => {
  const file = photoInput.files?.[0];
  if (!file || !user.me || saving) return;
  setSaving(true);
  try {
    user.photo = await usersService.photo(await readImage(file));
    renderProfile();
    alert("Foto de perfil actualizada.");
  } catch (error: unknown) {
    alert(errorMessage(error));
  } finally {
    photoInput.value = "";
    setSaving(false);
  }
});

async function init(): Promise<void> {
  try {
    await new AuthService().checkToken();
  } catch {
    location.assign("./login.html");
    return;
  }
  const rawId = new URLSearchParams(location.search).get("id");
  if (
    rawId !== null &&
    (!Number.isInteger(Number(rawId)) || Number(rawId) <= 0)
  ) {
    location.assign("./index.html");
    return;
  }
  try {
    user = await usersService.get(rawId === null ? "me" : Number(rawId));
    renderProfile();
    const ratingsLink = document.createElement("a");
    ratingsLink.className = "btn btn-outline-secondary";
    ratingsLink.href = `ratings.html?id=${user.id}`;
    ratingsLink.textContent = "Ver valoraciones";
    element("#userProductsLinks").append(ratingsLink);
    showMap(user.lat, user.lng);
  } catch (error: unknown) {
    alert(errorMessage(error));
    location.assign("./index.html");
  }
}
void init();
