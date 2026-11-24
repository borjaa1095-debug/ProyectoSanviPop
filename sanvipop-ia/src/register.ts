import { api, by, coordinates, field, form, http, preview, readPhoto } from "./common";

const photo = by<HTMLInputElement>("#photo");
preview(photo, by("#imgPreview"));
const position = coordinates();
void position.then(({ lat, lng }) => {
  for (const [id, value] of [["lat", lat], ["lng", lng]] as const) {
    const input = by<HTMLInputElement>("#" + id);
    input.value = value?.toString() ?? "";
    input.placeholder = "Location unavailable";
  }
});
form("#form-register", async data => {
  const email = field(data, "email");
  const name = field(data, "nameUser");
  if (name.length < 3) throw new Error("Enter a name with at least 3 characters.");
  if (email !== field(data, "email2")) throw new Error("The email addresses must match.");
  await http.post(api("/auth/register"), {
    name, email, password: data.get("password"),
    photo: await readPhoto(photo.files?.[0]),
    ...await position,
  });
  location.replace("login.html?" + new URLSearchParams({ email }));
});
