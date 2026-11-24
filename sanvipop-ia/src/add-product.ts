import { action, api, by, field, form, http, image, params, preview, productUrl, readPhoto, show, start } from "./common";
import type { CategoriesResponse, SingleProductResponse, UsersResponse } from "../interfaces/responses";

void start(async () => {
  const id = params.get("id");
  if (id !== null && !/^[1-9]\d*$/.test(id)) throw new Error("Invalid product.");
  const endpoint = api("/products" + (id ? "/" + id : ""));
  const file = by<HTMLInputElement>("#image");
  const category = by<HTMLSelectElement>("#category");
  const thumbnail = by<HTMLImageElement>("#imgPreview");
  const [{ categories }, details] = await Promise.all([
    http.get<CategoriesResponse>(api("/categories")),
    id ? http.get<SingleProductResponse>(endpoint) : undefined,
  ]);
  for (const value of categories) category.add(new Option(value.name, String(value.id)));
  const status = by<HTMLSelectElement>("#saleStatus");
  const buyer = by<HTMLSelectElement>("#soldTo");
  const search = by<HTMLInputElement>("#buyerSearch");
  const find = by<HTMLButtonElement>("#findBuyer");
  if (details) {
    const sale = details && details.product.status !== 3 && Number(status.value) !== details.product.status
      ? { status: Number(status.value), ...(status.value === "3" ? { soldTo: Number(buyer.value) } : {}) }
      : {};
    const { product } = details;
    if (!product.mine) throw new Error("Only the owner can edit this product.");
    by("h1").textContent = "Edit product";
    by('#newProduct button[type="submit"]').textContent = "Save changes";
    by<HTMLInputElement>("#title").value = product.title;
    by<HTMLTextAreaElement>("#description").value = product.description;
    by<HTMLInputElement>("#price").value = String(product.price);
    category.value = String(product.category.id);
    status.value = String(product.status);
    show(by("#saleFields"), product.status !== 3);
    status.onchange = () => {
      const sold = status.value === "3";
      show(by("#buyerFields"), sold);
      buyer.required = sold;
    };
    const resetBuyers = (label: string) => buyer.replaceChildren(new Option(label, ""));
    resetBuyers("Find a buyer by name");
    search.oninput = () => resetBuyers("Find a buyer by name");
    find.onclick = () => action(find, async () => {
      const name = search.value.trim();
      if (!name) throw new Error("Enter a buyer name.");
      const { users } = await http.get<UsersResponse>(api("/users/name/" + encodeURIComponent(name)));
      if (search.value.trim() !== name) return;
      const matches = users.filter(user => user.id !== product.owner.id);
      resetBuyers(matches.length ? "Choose a buyer" : "No matching buyers");
      for (const user of matches) buyer.add(new Option(user.name + " (" + user.email + ")", String(user.id)));
    });
    file.closest(".mb-3")?.classList.add("d-none");
    file.disabled = true;
    file.required = false;
    image(thumbnail, product.mainPhoto, product.title);
    show(thumbnail, Boolean(product.mainPhoto));
  }
  preview(file, thumbnail);
  form("#newProduct", async data => {
    const title = field(data, "title");
    const description = field(data, "description");
    if (title.length < 3 || !description) throw new Error("Enter a title and description.");
    const payload = { title, description, price: Number(data.get("price")), category: Number(category.value) };
    const sale = details && details.product.status !== 3 && Number(status.value) !== details.product.status
      ? { status: Number(status.value), ...(status.value === "3" ? { soldTo: Number(buyer.value) } : {}) }
      : {};
    const { product } = details
      ? await http.put<SingleProductResponse>(endpoint, { ...payload, ...sale })
      : await http.post<SingleProductResponse>(endpoint, { ...payload, mainPhoto: await readPhoto(file.files?.[0]) });
    location.replace(productUrl(product.id));
  });
  show(by("#newProduct"), true);
});
