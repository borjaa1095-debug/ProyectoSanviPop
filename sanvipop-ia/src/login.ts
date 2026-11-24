import { api, coordinates, field, form, http, params, by } from "./common";
import type { TokenResponse } from "../interfaces/responses";

by<HTMLInputElement>("#email").value = params.get("email") ?? "";
form("#form-login", async data => {
  const { accessToken } = await http.post<TokenResponse, unknown>(api("/auth/login"), {
    email: field(data, "email"),
    password: data.get("password"),
    ...await coordinates(),
  });
  localStorage.setItem("token", accessToken);
  location.replace("index.html");
});
