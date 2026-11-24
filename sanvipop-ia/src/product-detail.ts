import { action, api, by, date, distance, feedback, field, form, http, image, link, map, money, params, readPhoto, show, start, userUrl } from "./common";
import type { SingleProductResponse, UserResponse } from "../interfaces/responses";
import type { User } from "../interfaces/user";

void start(async () => {
  const id = params.get("id");
  if (!id || !/^[1-9]\d*$/.test(id)) throw new Error("Invalid product.");
  const endpoint = api("/products/" + id);
  const [{ user }, { product }] = await Promise.all([
    http.get<UserResponse>(api("/users/me")),
    http.get<SingleProductResponse>(endpoint),
  ]);
  image(by("#mainPhoto"), product.mainPhoto, product.title);
  image(by("#ownerPhoto"), product.owner.photo, product.owner.name);
  link(by("#ownerName"), userUrl(product.owner.id), product.owner.name);
  const details = {
    category: product.category.name, title: product.title, price: money(product.price),
    description: product.description, datePublished: date(product.datePublished),
    numVisits: String(product.numVisits), distance: distance(product.distance),
    ownerEmail: product.owner.email, status: ["", "Available", "Reserved", "Sold"][product.status],
  };
  for (const [key, value] of Object.entries(details)) by("#" + key).textContent = value;
  by("#status").className = "badge " + ["", "bg-success", "bg-warning text-dark", "bg-danger"][product.status];

  const sold = product.status === 3;
  const bookmark = by<HTMLButtonElement>("#bookmarkBtn");
  let saved = product.bookmarked;
  const updateBookmark = () => {
    bookmark.textContent = saved ? "Saved" : "Save to favorites";
    bookmark.title = bookmark.textContent;
    bookmark.setAttribute("aria-pressed", String(saved));
    bookmark.classList.toggle("active", saved);
  };
  updateBookmark();
  bookmark.onclick = () => action(bookmark, async () => {
    if (saved) await http.delete(endpoint + "/bookmarks");
    else await http.post(endpoint + "/bookmarks");
    saved = !saved;
    updateBookmark();
  });

  const buy = by<HTMLButtonElement>("#buyProduct");
  const remove = by<HTMLButtonElement>("#deleteProduct");
  const edit = by<HTMLAnchorElement>("#editProduct");
  show(buy, !product.mine && !sold);
  show(remove, product.mine);
  show(edit, product.mine);
  link(edit, "add-product.html?id=" + id);
  buy.onclick = () => {
    if (confirm("Buy this product?")) action(buy, async () => {
      await http.put(endpoint + "/buy");
      location.reload();
    });
  };
  remove.onclick = () => {
    if (confirm("Delete this product?")) action(remove, async () => {
      await http.delete(endpoint);
      location.replace("index.html");
    });
  };

  const gallery = by("#gallery");
  for (const photo of product.photos ?? []) {
    const frame = document.createElement("div");
    frame.className = "d-flex flex-column gap-2";
    const thumbnail = document.createElement("img");
    thumbnail.className = "gallery-photo rounded";
    image(thumbnail, photo.url, product.title);
    const view = document.createElement("a");
    link(view, new URL(photo.url, endpoint).href);
    view.append(thumbnail);
    frame.append(view);
    if (product.mine && photo.url !== product.mainPhoto) {
      const button = (label: string, work: () => Promise<unknown>) => {
        const control = document.createElement("button");
        control.className = "btn btn-sm btn-outline-secondary";
        control.textContent = label;
        control.onclick = () => action(control, async () => {
          await work();
          location.reload();
        });
        return control;
      };
      frame.append(
        button("Set as main", () => http.put(endpoint, { mainPhoto: photo.id })),
        button("Delete photo", () => http.delete(endpoint + "/photos/" + photo.id)),
      );
    }
    gallery.append(frame);
  }
  show(by("#galleryCard"), product.mine || gallery.childElementCount > 0);
  show(by("#uploadPhoto"), product.mine);
  form("#uploadPhoto", async (data, element) => {
    const file = data.get("photo") as File | null;
    await http.post(endpoint + "/photos", { photo: await readPhoto(file ?? undefined), setMain: data.has("setMain") });
    element.reset();
    location.reload();
  });

  const rating = product.rating;
  const buyer = product.soldTo;
  const isBuyer = buyer?.id === user.id;
  const pending = sold && ((product.mine && !rating?.sellerRating) || (isBuyer && !rating?.buyerRating));
  const ratingPanel = by("#ratingFormContainer");
  show(by("#transactionCard"), sold);
  show(by("#pendingRatingCard"), pending);
  show(ratingPanel, false);
  if (sold) {
    if (buyer) link(by("#buyerName"), userUrl(buyer.id), buyer.name);
    show(by("#buyerInfo"), Boolean(buyer));
    by("#dateTransaction").textContent = date(rating?.dateTransaction);
    const ratings = by("#ratingsRow");
    const template = by<HTMLTemplateElement>("#ratingTemplate");
    const addReview = (reviewer: User, score?: number, comment?: string) => {
      if (!score) return;
      const row = template.content.cloneNode(true) as DocumentFragment;
      image(by(".rating-photo", row), reviewer.photo);
      by(".rating-name", row).textContent = reviewer.name;
      by(".rating-email", row).textContent = reviewer.email;
      by(".rating-stars", row).textContent = "★".repeat(score) + "☆".repeat(5 - score);
      by(".rating-score", row).textContent = score + "/5";
      by(".rating-comment", row).textContent = comment ?? "";
      ratings.prepend(row);
    };
    addReview(product.owner, rating?.sellerRating, rating?.sellerComment);
    if (buyer) addReview(buyer, rating?.buyerRating, rating?.buyerComment);
  }
  by("#btnRateTransaction").onclick = () => {
    show(ratingPanel, pending);
    if (pending) by<HTMLInputElement>('#ratingStars input').focus();
  };
  by("#btnCancelRating").onclick = () => show(ratingPanel, false);
  form("#ratingForm", async data => {
    if (!pending) return;
    const comment = field(data, "ratingComment");
    if (comment.length < 5) throw new Error("Enter a comment with at least 5 characters.");
    await http.post(api("/ratings"), { product: Number(id), rating: Number(data.get("ratingScore")), comment });
    feedback("Review submitted.");
    location.reload();
  });
  show(by("#productContainer"), true);
  show(by("#map").parentElement!, true);
  await map(product.owner);
  show(by("#map").parentElement!, !by("#map").classList.contains("d-none"));
});
