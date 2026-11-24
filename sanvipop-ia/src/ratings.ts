import { api, by, http, image, link, money, productUrl, show, start, userKey, userUrl } from "./common";
import type { RatingsResponse, UserResponse } from "../interfaces/responses";

void start(async () => {
  const key = userKey();
  const [{ user }, { ratings }] = await Promise.all([
    http.get<UserResponse>(api("/users/" + key)),
    http.get<RatingsResponse>(api("/ratings/user/" + key)),
  ]);
  const profile = by<HTMLAnchorElement>("#ratedUser");
  link(profile, user.me ? "profile.html" : userUrl(user.id), user.name);
  show(profile, true);
  const summary = by("#ratingsSummary");
  if (ratings.length === 0) {
    summary.textContent = "This user has not received any reviews yet.";
    return;
  }
  const average = ratings.reduce((total, review) => total + review.rating, 0) / ratings.length;
  summary.textContent = average.toFixed(1) + "/5 · " + ratings.length + (ratings.length === 1 ? " review" : " reviews");
  const template = by<HTMLTemplateElement>("#receivedRating");
  for (const review of ratings) {
    const item = template.content.cloneNode(true) as DocumentFragment;
    image(by(".rating-photo", item), review.user.photo);
    link(by(".reviewer", item), userUrl(review.user.id), review.user.name);
    link(by(".rating-product", item), productUrl(review.product.id), review.product.title + " · " + money(review.product.price));
    by(".rating-stars", item).textContent = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    by(".rating-score", item).textContent = review.rating + "/5";
    by(".rating-comment", item).textContent = review.comment;
    by("#receivedRatings").append(item);
  }
});
