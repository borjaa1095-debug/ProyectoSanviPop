import { action, api, by, feedback, field, form, http, image, link, map, readPhoto, show, start, userKey } from "./common";
import type { UserResponse, PhotoResponse } from "../interfaces/responses";

void start(async () => {
  const { user } = await http.get<UserResponse>(api("/users/" + userKey()));
  const photo = by<HTMLImageElement>("#photo");
  const name = by("#profileInfo #name");
  const email = by("#profileInfo #email small");
  name.textContent = user.name;
  email.textContent = user.email;
  image(photo, user.photo, user.name);
  const modes = { Selling: "selling", Sold: "sold", Bought: "bought", Favorites: "bookmarks" };
  for (const [label, status] of Object.entries(modes)) {
    link(by("#link" + label), "index.html?" + new URLSearchParams({ status, user: String(user.id) }));
  }
  link(by("#linkRatings"), user.me ? "ratings.html" : "ratings.html?id=" + user.id);
  const photoInput = by<HTMLInputElement>("#photoInput");
  show(photoInput.closest("label")!, user.me);
  show(by("#editProfile").parentElement!, user.me);

  if (user.me) {
    const info = by("#profileInfo");
    const profileForm = by("#profileForm");
    const passwordForm = by("#passwordForm");
    const toggle = (panel: HTMLElement) => {
      for (const element of [info, profileForm, passwordForm]) show(element, element === panel);
    };
    by("#editProfile").onclick = () => {
      by<HTMLInputElement>("#profile-name").value = name.textContent ?? "";
      by<HTMLInputElement>("#profile-email").value = email.textContent ?? "";
      toggle(profileForm);
    };
    by("#editPassword").onclick = () => {
      by<HTMLFormElement>("#passwordForm form").reset();
      toggle(passwordForm);
    };
    by("#cancelEditProfile").onclick = by("#cancelEditPassword").onclick = () => toggle(info);
    form("#profileForm form", async data => {
      const updated = { name: field(data, "name"), email: field(data, "email") };
      await http.put(api("/users/me"), updated);
      name.textContent = photo.alt = updated.name;
      email.textContent = updated.email;
      toggle(info);
      feedback("Profile updated.");
    });
    form("#passwordForm form", async (data, element) => {
      const password = data.get("password");
      if (password !== data.get("password2")) throw new Error("The passwords must match.");
      await http.put(api("/users/me/password"), { password });
      element.reset();
      toggle(info);
      feedback("Password updated.");
    });
    photoInput.onchange = () => {
      const file = photoInput.files?.[0];
      if (!file) return;
      action(photoInput, async () => {
        try {
          const updated = await http.put<PhotoResponse>(api("/users/me/photo"), { photo: await readPhoto(file) });
          image(photo, updated.photo, name.textContent ?? "");
          feedback("Photo updated.");
        } finally {
          photoInput.value = "";
        }
      });
    };
  }
  show(by("#profile"), true);
  show(by("#map"), true);
  await map(user);
});
