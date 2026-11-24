import { AuthService } from "./classes/auth.service.ts";
import { ProductsService } from "./classes/products.service.ts";
import { UsersService } from "./classes/users.service.ts";
import { RatingsService } from "./classes/ratings.service.ts";
import type { Product } from "./interfaces/product.ts";
import type { User } from "./interfaces/user.ts";
import {
  element,
  errorMessage,
  setupLogout,
  showMap,
  formatDate,
} from "./page-utils.ts";

const productsService = new ProductsService();
const ratingsService = new RatingsService();
const id = Number(new URLSearchParams(location.search).get("id"));
const card = element("#productCard");
const transactionCard = element("#transactionCard");
const buyButton = element<HTMLButtonElement>("#buyProduct");
const deleteButton = element<HTMLButtonElement>("#deleteProduct");
const bookmarkButton = element<HTMLButtonElement>("#bookmarkBtn");
const ratingForm = element<HTMLFormElement>("#ratingForm");
const ratingFormContainer = element("#ratingFormContainer");
const pendingCard = element("#pendingRatingCard");
const rateButton = element<HTMLButtonElement>("#btnRateTransaction");
const submitRating = element<HTMLButtonElement>("#btnSubmitRating");
const cancelRating = element<HTMLButtonElement>("#btnCancelRating");
const ratingTemplate = element<HTMLTemplateElement>("#ratingTemplate");
const rows = element("#ratingsRow");
const ownerPhoto = element<HTMLImageElement>("#ownerPhoto");
const ownerPhotoLink = document.createElement("a");
ownerPhoto.before(ownerPhotoLink);
ownerPhotoLink.append(ownerPhoto);
let product: Product;
let currentUser: User;
let mapCreated = false;
let busy = false;
let canRate = false;
let formOpen = false;

card.classList.add("d-none");
transactionCard.classList.add("d-none");
ratingFormContainer.classList.add("d-none");
pendingCard.classList.add("d-none");
element<HTMLTextAreaElement>("#ratingComment").maxLength = 2000;
setupLogout();

function setBusy(value: boolean): void {
  busy = value;
  for (const button of [
    buyButton,
    deleteButton,
    bookmarkButton,
    rateButton,
    submitRating,
    cancelRating,
  ]) {
    button.disabled = value;
  }
}

function updateRatingForm(): void {
  pendingCard.classList.toggle("d-none", !canRate || formOpen);
  ratingFormContainer.classList.toggle("d-none", !canRate || !formOpen);
}

function createTransactionRating(
  author: User,
  score: number,
  comment: string
): DocumentFragment {
  const fragment = ratingTemplate.content.cloneNode(true) as DocumentFragment;
  fragment.querySelector<HTMLElement>(".rating-name")!.textContent =
    author.name;
  fragment.querySelector<HTMLElement>(".rating-email")!.textContent =
    author.email;
  fragment.querySelector<HTMLElement>(".rating-comment")!.textContent = comment;
  fragment.querySelector<HTMLElement>(".rating-score")!.textContent =
    `${score}/5`;
  fragment.querySelector<HTMLElement>(".rating-stars")!.textContent =
    "★".repeat(score) + "☆".repeat(5 - score);
  const photo = fragment.querySelector<HTMLImageElement>(".rating-photo")!;
  photo.src = author.photo;
  photo.alt = author.name;
  return fragment;
}

function renderRatings(): void {
  rows.querySelectorAll(".rating-card").forEach(row => row.remove());
  const sold = product.status === 3;
  const rating = product.rating;
  transactionCard.classList.toggle("d-none", !sold);
  if (sold) {
    if (rating?.sellerRating != null) {
      rows.insertBefore(
        createTransactionRating(
          product.owner,
          rating.sellerRating,
          rating.sellerComment ?? ""
        ),
        pendingCard
      );
    }
    if (rating?.buyerRating != null && product.soldTo) {
      rows.insertBefore(
        createTransactionRating(
          product.soldTo,
          rating.buyerRating,
          rating.buyerComment ?? ""
        ),
        pendingCard
      );
    }
  }
  const involved = product.mine || product.soldTo?.id === currentUser.id;
  const ownRating = product.mine ? rating?.sellerRating : rating?.buyerRating;
  canRate = sold && involved && ownRating == null;
  if (!canRate) formOpen = false;
  element("#pendingRatingMessage").textContent =
    "Todavía no has valorado esta transacción.";
  element("#dateTransaction").textContent = rating?.dateTransaction
    ? formatDate(rating.dateTransaction)
    : "Sin fecha disponible";
  updateRatingForm();
}

function render(): void {
  element("#title").textContent = product.title;
  element("#description").textContent = product.description;
  element("#category").textContent = product.category.name;
  element("#price").textContent = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(product.price);
  const photo = element<HTMLImageElement>("#mainPhoto");
  photo.src = product.mainPhoto;
  photo.alt = product.title;
  element("#numVisits").textContent = String(product.numVisits);
  element("#distance").textContent = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(product.distance ?? 0);
  element("#datePublished").textContent = formatDate(product.datePublished);
  element("#ownerEmail").textContent = product.owner.email;
  const ownerLink = document.createElement("a");
  ownerLink.href = `profile.html?id=${product.owner.id}`;
  ownerLink.textContent = product.owner.name;
  element("#ownerName").replaceChildren(ownerLink);
  ownerPhoto.src = product.owner.photo;
  ownerPhoto.alt = product.owner.name;
  ownerPhotoLink.href = ownerLink.href;
  const status = element("#status");
  status.textContent = { 1: "Disponible", 2: "Reservado", 3: "Vendido" }[
    product.status
  ];
  status.className = `badge ${product.status === 3 ? "bg-danger" : product.status === 2 ? "bg-warning text-dark" : "bg-success"}`;
  deleteButton.classList.toggle("d-none", !product.mine);
  buyButton.classList.toggle("d-none", product.mine || product.status !== 1);
  bookmarkButton.classList.toggle("d-none", product.mine);
  bookmarkButton.classList.toggle("active", product.bookmarked);
  bookmarkButton.title = product.bookmarked
    ? "Quitar de favoritos"
    : "Guardar en favoritos";
  const icon = document.createElement("i");
  icon.className = product.bookmarked
    ? "bi bi-bookmark-fill"
    : "bi bi-bookmark";
  bookmarkButton.replaceChildren(
    icon,
    document.createTextNode(product.bookmarked ? " Guardado" : " Guardar")
  );
  renderRatings();
  card.classList.remove("d-none");
  if (!mapCreated) {
    showMap(product.owner.lat, product.owner.lng);
    mapCreated = true;
  }
}

async function loadProduct(): Promise<void> {
  product = await productsService.getById(id);
  render();
}

deleteButton.addEventListener("click", async () => {
  if (busy || !product.mine || !confirm("¿Quieres borrar este producto?"))
    return;
  setBusy(true);
  try {
    await productsService.delete(id);
    location.assign("./index.html");
  } catch (error: unknown) {
    alert(errorMessage(error));
  } finally {
    setBusy(false);
  }
});

buyButton.addEventListener("click", async () => {
  if (
    busy ||
    product.mine ||
    product.status !== 1 ||
    !confirm("¿Quieres comprar este producto?")
  )
    return;
  setBusy(true);
  try {
    await productsService.buy(id);
    await loadProduct();
    alert("Compra realizada.");
  } catch (error: unknown) {
    alert(errorMessage(error));
  } finally {
    setBusy(false);
  }
});

bookmarkButton.addEventListener("click", async () => {
  if (busy || product.mine) return;
  setBusy(true);
  try {
    await productsService.bookmark(id, !product.bookmarked);
    product.bookmarked = !product.bookmarked;
    render();
  } catch (error: unknown) {
    alert(errorMessage(error));
  } finally {
    setBusy(false);
  }
});

rateButton.addEventListener("click", () => {
  if (!canRate || busy) return;
  formOpen = true;
  updateRatingForm();
});
cancelRating.addEventListener("click", () => {
  if (busy) return;
  ratingForm.reset();
  formOpen = false;
  updateRatingForm();
});

ratingForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (busy || !canRate || !ratingForm.reportValidity()) return;
  const data = new FormData(ratingForm);
  const score = Number(data.get("ratingScore"));
  const comment = String(data.get("ratingComment") ?? "").trim();
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    alert("Selecciona una puntuación de 1 a 5.");
    return;
  }
  if (comment.length < 5 || comment.length > 2000) {
    alert("El comentario debe tener entre 5 y 2000 caracteres.");
    return;
  }
  setBusy(true);
  try {
    await ratingsService.post({ product: id, rating: score, comment });
    canRate = false;
    formOpen = false;
    ratingForm.reset();
    updateRatingForm();
    await loadProduct();
    alert("Valoración publicada.");
  } catch (error: unknown) {
    alert(errorMessage(error));
  } finally {
    setBusy(false);
  }
});

async function init(): Promise<void> {
  try {
    await new AuthService().checkToken();
  } catch {
    location.assign("./login.html");
    return;
  }
  if (!Number.isInteger(id) || id <= 0) {
    location.assign("./index.html");
    return;
  }
  try {
    currentUser = await new UsersService().get();
    await loadProduct();
  } catch (error: unknown) {
    alert(errorMessage(error));
    location.assign("./index.html");
  }
}
void init();
