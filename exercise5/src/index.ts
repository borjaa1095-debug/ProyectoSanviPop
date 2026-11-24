import { ProductsService } from "./classes/products.service.ts";
import { type Product } from "./interfaces/product.ts";
import { AuthService } from "./classes/auth.service.ts";

const urlParams = new URLSearchParams(location.search);
const statusFilter = urlParams.get("status") ?? "";
const userFilter = urlParams.get("user") ?? "";
const authService = new AuthService();
const logoutLink = document.getElementById("logout") as HTMLAnchorElement;
const template = document.getElementById(
  "productTemplate"
) as HTMLTemplateElement;
const container = document.getElementById("productsContainer") as HTMLElement;
const searchInput = document.getElementById("search") as HTMLInputElement;
const productsService = new ProductsService();
let products: Product[] = [];
const loadMoreButton = document.getElementById("loadMore") as HTMLButtonElement;
let page = 1;
let search = "";
let sort = "distance";
const orderSelect = document.getElementById("order") as HTMLSelectElement;
const searchForm = document.getElementById("searchForm") as HTMLFormElement;
const filterInfo = document.getElementById("filterInfo") as HTMLElement;

const searchButton =
  searchForm.querySelector<HTMLButtonElement>('[type="submit"]')!;

let loading = true;

function setLoading(value: boolean): void {
  loading = value;
  searchButton.disabled = value;
  searchInput.disabled = value;
  orderSelect.disabled = value;
  loadMoreButton.disabled = value;

  container.querySelectorAll<HTMLButtonElement>(".delete").forEach(button => {
    button.disabled = value;
  });
}

function updateFilterInfo(): void {
  const sortNames: Record<string, string> = {
    distance: "distancia",
    price: "precio",
    views: "visitas",
  };

  const statusNames: Record<string, string> = {
    selling: "En venta",
    sold: "Vendidos",
    bought: "Comprados",
    bookmarks: "Favoritos",
  };

  let description = "Mostrando todos los productos.";

  if (statusFilter !== "") {
    description = statusNames[statusFilter] ?? statusFilter;
    description +=
      userFilter !== "" ? ` del usuario ${userFilter}.` : " de tu cuenta.";
  }

  if (search !== "") {
    description += ` Búsqueda: "${search}".`;
  }

  filterInfo.textContent = `${description} Ordenados por ${sortNames[sort] ?? sort}.`;
}

async function refreshProducts(
  newSearch = search,
  newSort = sort
): Promise<void> {
  const result = await productsService.getAll(
    1,
    newSearch,
    newSort,
    statusFilter,
    userFilter
  );

  search = newSearch;
  sort = newSort;
  page = result.page;
  products = result.products;

  container.replaceChildren();
  showProducts(products);

  loadMoreButton.classList.toggle("d-none", page >= result.total_pages);
  updateFilterInfo();
}

setLoading(true);
function createCard(product: Product): DocumentFragment {
  const card = template.content.cloneNode(true) as DocumentFragment;
  const col = card.querySelector<HTMLElement>(".col")!;
  const detailUrl = `product-detail.html?id=${product.id}`;
  const ownerName = card.querySelector<HTMLAnchorElement>(".name")!;
  const ownerPhoto = card.querySelector<HTMLImageElement>(".avatar img")!;

  card.querySelector<HTMLElement>(".card-title")!.textContent = product.title;
  card.querySelector<HTMLElement>(".card-text")!.textContent =
    product.description;
  card.querySelector<HTMLElement>(".card-body .text-success")!.textContent =
    `${product.price} €`;
  card.querySelector<HTMLElement>(".card-body .badge")!.textContent =
    product.category.name;
  card.querySelector<HTMLImageElement>("img")!.src = product.mainPhoto;
  card.querySelector<HTMLAnchorElement>(".card-title")!.href = detailUrl;
  card.querySelector<HTMLAnchorElement>(".product-img-link")!.href = detailUrl;
  card.querySelector<HTMLElement>(".views")!.textContent = String(
    product.numVisits
  );

  const deleteButton = card.querySelector<HTMLButtonElement>(".delete")!;

  if (!product.mine) {
    deleteButton.classList.add("d-none");
  }

  deleteButton.addEventListener("click", async () => {
    if (loading) return;

    const confirmed = confirm("¿Quieres borrar este producto?");
    if (!confirmed) return;

    setLoading(true);

    try {
      await productsService.delete(product.id);
      col.remove();
      products = products.filter(item => item.id !== product.id);

      await refreshProducts();
    } catch {
      alert(
        "No se pudo completar la operación. Recarga para comprobar el listado."
      );
    } finally {
      setLoading(false);
    }
  });

  ownerName.textContent = product.owner.name;
  ownerName.href = `profile.html?id=${product.owner.id}`;
  ownerPhoto.src = product.owner.photo;
  card.querySelector<HTMLAnchorElement>(".avatar-link")!.href = ownerName.href;

  const distance = card.querySelector<HTMLElement>(".distance")!;

  distance.textContent =
    new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(product.distance) + " km";

  const datePublished = new Date(product.datePublished);

  card.querySelector<HTMLElement>(".card-footer .col small")!.textContent =
    new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(datePublished);
  return card;
}

function showProducts(products: Product[]): void {
  for (let i = 0; i < products.length; i++) {
    container.appendChild(createCard(products[i]));
  }
}

authService
  .checkToken()
  .then(async () => {
    try {
      await refreshProducts();
    } catch {
      alert("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  })
  .catch(() => {
    location.assign("./login.html");
  });

searchForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (loading) return;

  const newSearch = searchInput.value.trim();
  const newSort = orderSelect.value;

  setLoading(true);

  try {
    await refreshProducts(newSearch, newSort);
  } catch {
    alert("No se pudieron buscar los productos.");
  } finally {
    setLoading(false);
  }
});

logoutLink.addEventListener("click", event => {
  event.preventDefault();
  authService.logout();
  location.assign("./login.html");
});

loadMoreButton.addEventListener("click", async () => {
  if (loading) return;

  setLoading(true);

  try {
    const result = await productsService.getAll(
      page + 1,
      search,
      sort,
      statusFilter,
      userFilter
    );

    page = result.page;
    products.push(...result.products);
    showProducts(result.products);

    loadMoreButton.classList.toggle("d-none", page >= result.total_pages);
  } catch {
    alert("No se pudieron cargar más productos.");
  } finally {
    setLoading(false);
  }
});
