import { AuthService } from "./classes/auth.service.ts";
import { UsersService } from "./classes/users.service.ts";
import { RatingsService } from "./classes/ratings.service.ts";
import {
  element,
  errorMessage,
  setupLogout,
  ratingCard,
} from "./page-utils.ts";

setupLogout();

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
    const user = await new UsersService().get(
      rawId === null ? "me" : Number(rawId)
    );
    element("#ratingsTitle").textContent = `Valoraciones de ${user.name}`;
    element<HTMLAnchorElement>("#backProfile").href =
      `profile.html?id=${user.id}`;
    const ratings = await new RatingsService().getAll(user.id);
    const container = element("#ratingsContainer");
    container.replaceChildren();
    if (ratings.length === 0) {
      element("#ratingsSummary").textContent =
        "Este usuario todavía no tiene valoraciones.";
      return;
    }
    const average =
      ratings.reduce((total, item) => total + item.rating, 0) / ratings.length;
    element("#ratingsSummary").textContent =
      `${ratings.length} valoraciones · Media: ${average.toLocaleString("es-ES", { maximumFractionDigits: 1 })}/5`;
    for (const rating of ratings) {
      const card = ratingCard(
        rating.user.name,
        rating.user.email,
        rating.user.photo,
        rating.rating,
        rating.comment
      );
      const link = document.createElement("a");
      link.href = `product-detail.html?id=${rating.product.id}`;
      link.textContent = rating.product.title;
      card.append(link);
      container.append(card);
    }
  } catch (error: unknown) {
    element("#ratingsSummary").textContent = errorMessage(error);
  }
}
void init();
