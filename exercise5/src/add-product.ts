import { CategoriesService } from "./classes/categories.service.ts";
import { ProductsService } from "./classes/products.service.ts";
import type { ProductInsert } from "./interfaces/product.ts";
import { AuthService } from "./classes/auth.service.ts";
import { errorMessage, readImage, setupLogout } from "./page-utils.ts";

const productsService = new ProductsService();
const categoriesService = new CategoriesService();
const select = document.getElementById("category") as HTMLSelectElement;
const imageInput = document.getElementById("image") as HTMLInputElement;
const imgPreview = document.getElementById("imgPreview") as HTMLImageElement;
const form = document.getElementById("newProduct") as HTMLFormElement;
const submitButton = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
let photo = "";
let readingPhoto = false;
let photoVersion = 0;
let ready = false;
let submitting = false;

imageInput.accept = "image/*";
setupLogout();

function updateSubmitButton(): void {
  submitButton.disabled = !ready || readingPhoto || photo === "" || submitting;
}
updateSubmitButton();

imageInput.addEventListener("change", async () => {
  const version = ++photoVersion;
  const file = imageInput.files?.[0];
  photo = "";
  readingPhoto = false;
  imageInput.setCustomValidity("");
  imgPreview.removeAttribute("src");
  imgPreview.classList.add("d-none");
  if (!file) {
    updateSubmitButton();
    return;
  }
  readingPhoto = true;
  updateSubmitButton();
  try {
    const result = await readImage(file);
    if (version !== photoVersion) return;
    photo = result;
    imgPreview.src = photo;
    imgPreview.alt = "Vista previa del producto";
    imgPreview.classList.remove("d-none");
  } catch (error: unknown) {
    if (version !== photoVersion) return;
    imageInput.setCustomValidity(errorMessage(error));
    imageInput.reportValidity();
  } finally {
    if (version === photoVersion) {
      readingPhoto = false;
      updateSubmitButton();
    }
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (submitting || !ready) return;
  if (readingPhoto || photo === "") {
    alert("Selecciona una foto válida y espera a que termine de cargar.");
    return;
  }
  if (!form.reportValidity()) return;
  const product: ProductInsert = {
    title: (form.elements.namedItem("title") as HTMLInputElement).value.trim(),
    description: (
      form.elements.namedItem("description") as HTMLTextAreaElement
    ).value.trim(),
    price: Number((form.elements.namedItem("price") as HTMLInputElement).value),
    category: Number(select.value),
    mainPhoto: photo,
  };
  if (product.title.length < 4 || product.description.length < 10) {
    alert(
      "El título debe tener al menos 4 caracteres y la descripción al menos 10, sin contar espacios en los extremos."
    );
    return;
  }
  submitting = true;
  const controls = form.querySelectorAll<
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | HTMLButtonElement
  >("input, select, textarea, button");
  controls.forEach(control => {
    control.disabled = true;
  });
  try {
    await productsService.post(product);
    location.assign("./index.html");
  } catch (error: unknown) {
    alert(errorMessage(error));
  } finally {
    controls.forEach(control => {
      control.disabled = false;
    });
    submitting = false;
    updateSubmitButton();
  }
});

async function init(): Promise<void> {
  try {
    await new AuthService().checkToken();
  } catch {
    location.assign("./login.html");
    return;
  }
  try {
    const categories = await categoriesService.getAll();
    categories.forEach(category => {
      const option = document.createElement("option");
      option.value = String(category.id);
      option.textContent = category.name;
      select.appendChild(option);
    });
    ready = true;
    updateSubmitButton();
  } catch (error: unknown) {
    alert(errorMessage(error));
  }
}
void init();
