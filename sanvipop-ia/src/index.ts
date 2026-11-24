import { action, api, by, date, distance, http, image, link, money, params, productUrl, show, start, userUrl } from "./common";
import type { Product } from "../interfaces/product";
import type { ProductsResponse } from "../interfaces/responses";

const list = by("#productsContainer");
const more = by<HTMLButtonElement>("#loadMore");
const search = by<HTMLInputElement>("#search");
const sort = by<HTMLSelectElement>("#order");
const template = by<HTMLTemplateElement>("#productTemplate");
const query = new URLSearchParams();
const status = params.get("status");
const user = params.get("user");
if (status && ["selling", "sold", "bought", "bookmarks", "bookmarked"].includes(status)) {
  query.set("status", status === "bookmarked" ? "bookmarks" : status);
}
if (user && /^[1-9]\d*$/.test(user)) query.set("user", user);
search.value = params.get("search") ?? "";
const initialSort = params.get("sort");
sort.value = initialSort === "price" || initialSort === "views" ? initialSort : "distance";
let page = 1;
let request = 0;

function card(product: Product) {
  const fragment = template.content.cloneNode(true) as DocumentFragment;
  link(by(".product-img-link", fragment), productUrl(product.id));
  link(by(".card-title", fragment), productUrl(product.id), product.title);
  link(by(".avatar-link", fragment), userUrl(product.owner.id));
  link(by(".name", fragment), userUrl(product.owner.id), product.owner.name);
  image(by(".card-img-top", fragment), product.mainPhoto, product.title);
  image(by(".avatar img", fragment), product.owner.photo, product.owner.name);
  by(".badge", fragment).textContent = product.category.name;
  by(".fs-5", fragment).textContent = money(product.price);
  by(".card-text", fragment).textContent = product.description;
  by(".col small", fragment).textContent = date(product.datePublished);
  by(".views", fragment).textContent = String(product.numVisits);
  by(".distance", fragment).textContent = Number.isFinite(product.distance) ? distance(product.distance) + " km" : "";
  const remove = by<HTMLButtonElement>(".delete", fragment);
  show(remove, product.mine);
  remove.addEventListener("click", () => {
    if (confirm("Delete this product?")) action(remove, async () => {
      await http.delete(api("/products/" + product.id));
      await load(1);
    });
  });
  return fragment;
}

async function load(next: number) {
  const currentRequest = ++request;
  const filters = new URLSearchParams(query);
  filters.set('page', String(next));
  const { products, page: current, total_pages, total_products } =
    await http.get<ProductsResponse>(api('/products?' + filters));
  if (currentRequest !== request) return;
  const cards = products.map(card);
  if (next === 1) list.replaceChildren(...cards);
  else list.append(...cards);
  page = current;
  show(more, current < total_pages);
  const labels = { selling: "For sale", sold: "Sold", bought: "Bought", bookmarks: "Favorites" };
  const mode = query.get("status") as keyof typeof labels | null;
  const label = mode ? labels[mode] : query.has("user") ? "For sale" : "Catalog";
  by("#filterInfo").textContent = total_products ? label + " · " + total_products + " products" : label + " · No products found.";
}

void start(async () => {
  const searchForm = by<HTMLFormElement>("#searchForm");
  const submit = by<HTMLButtonElement>('button[type="submit"]', searchForm);
  const filter = async () => {
    query.set("sort", sort.value);
    const term = search.value.trim();
    if (term) query.set("search", term);
    else query.delete("search");
    const url = new URLSearchParams(query);
    url.delete("page");
    history.replaceState(null, "", "index.html?" + url);
    try {
      await load(1);
    } finally {
      sort.disabled = false;
    }
  };
  searchForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!more.disabled) action(submit, async () => {
      sort.disabled = true;
      await filter();
    });
  });
  sort.addEventListener("change", () => searchForm.requestSubmit());
  more.addEventListener("click", () => {
    if (!submit.disabled) action(more, async () => {
      sort.disabled = true;
      try {
        await load(page + 1);
      } finally {
        sort.disabled = false;
      }
    });
  });
  await filter();
});
