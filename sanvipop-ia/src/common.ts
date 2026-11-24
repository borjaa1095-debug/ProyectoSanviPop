import { Http } from "../classes/http";
import { SERVER } from "../constants";
import type { User } from "../interfaces/user";

export const http = new Http();
export const api = (path: string) => SERVER + path;
export const params = new URLSearchParams(location.search);
export const by = <T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<T>(selector)!;
export const show = (element: HTMLElement, visible: boolean) => element.classList.toggle("d-none", !visible);
export const money = (value: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
export const date = (value?: string) => value ? new Date(value).toLocaleString("es-ES") : "—";
export const distance = (value: number) => Number.isFinite(value) ? value.toFixed(2) : "—";
export const productUrl = (id: number) => "product-detail.html?id=" + id;
export const userUrl = (id: number) => "profile.html?id=" + id;

export function userKey() {
  const id = params.get("id");
  if (id === null) return "me";
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) throw new Error("Invalid user.");
  return id;
}

export function image(element: HTMLImageElement, url?: string, alt = "") {
  if (url) element.src = new URL(url, SERVER).href;
  else element.removeAttribute("src");
  element.alt = alt;
}

export function link(element: HTMLAnchorElement, href: string, label?: string) {
  element.href = href;
  if (label !== undefined) element.textContent = label;
}

export function feedback(message: string, error = false) {
  let output = document.querySelector<HTMLElement>("#errorInfo");
  if (!output) {
    output = document.createElement("p");
    output.id = "errorInfo";
    by("body > .container, main.container").prepend(output);
  }
  output.className = error ? "alert alert-danger mt-3" : "alert alert-success mt-3";
  output.setAttribute("role", error ? "alert" : "status");
  output.textContent = message;
  output.hidden = !message;
}

export function report(error: unknown) {
  feedback(error instanceof Error ? error.message : "The request failed.", true);
}

export function logout() {
  localStorage.removeItem("token");
  location.replace("login.html");
}

export async function start(load: () => Promise<void>) {
  if (!localStorage.getItem("token")) return logout();
  by("#logout").addEventListener("click", event => {
    event.preventDefault();
    logout();
  });
  try {
    await http.get(api("/auth/validate"));
    await load();
  } catch (error) {
    report(error);
  }
}

export function action(control: HTMLButtonElement | HTMLInputElement, work: () => Promise<void>) {
  if (control.disabled) return;
  control.disabled = true;
  feedback("");
  void work().catch(report).finally(() => { control.disabled = false; });
}

export function form(selector: string, work: (data: FormData, element: HTMLFormElement) => Promise<void>) {
  const element = by<HTMLFormElement>(selector);
  element.addEventListener("submit", event => {
    event.preventDefault();
    if (element.reportValidity()) {
      action(by<HTMLButtonElement>('button[type="submit"]', element), () => work(new FormData(element), element));
    }
  });
}

export function field(data: FormData, name: string) {
  return String(data.get(name) ?? "").trim();
}

export async function readPhoto(file?: File) {
  if (!file?.size) throw new Error("Choose an image.");
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });
}

export function preview(input: HTMLInputElement, target: HTMLImageElement) {
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    show(target, false);
    if (!file) return;
    try {
      const url = await readPhoto(file);
      if (input.files?.[0] !== file) return;
      image(target, url, "Image preview");
      show(target, true);
    } catch (error) {
      report(error);
    }
  });
}

export async function coordinates() {
  if (!navigator.geolocation) return {};
  return new Promise<{ lat?: number; lng?: number }>(resolve => {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      resolve({ lat: coords.latitude, lng: coords.longitude });
    }, () => resolve({}), { timeout: 5000, maximumAge: 60000 });
  });
}

export async function map(user: User) {
  const target = by("#map");
  if (!Number.isFinite(user.lat) || !Number.isFinite(user.lng)) {
    target.classList.add("d-none");
    return;
  }
  const { MapService } = await import("../classes/map-service");
  const point = { latitude: user.lat, longitude: user.lng };
  new MapService(point, "map").createMarker(point);
}
