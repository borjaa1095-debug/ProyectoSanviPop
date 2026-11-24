import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector.js";
import OSM from "ol/source/OSM.js";
import VectorSource from "ol/source/Vector.js";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import { fromLonLat } from "ol/proj.js";
import { Circle, Fill, Stroke, Style } from "ol/style.js";
import { SERVER } from "./constants.ts";
import { AuthService } from "./classes/auth.service.ts";

export function element<T extends HTMLElement>(selector: string): T {
  const result = document.querySelector<T>(selector);
  if (!result) throw new Error(`No se encuentra ${selector}`);
  return result;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    if (typeof error.message === "string") return error.message;
    if (Array.isArray(error.message)) return error.message.join("\n");
  }
  return "No se pudo completar la operación.";
}

export function setupLogout(): void {
  element("#logout").addEventListener("click", event => {
    event.preventDefault();
    new AuthService().logout();
    location.assign("./login.html");
  });
}

export function showMap(lat: number, lng: number): void {
  const target = element("#map");
  target.style.height = "350px";
  const position = fromLonLat([lng, lat]);
  const marker = new Feature({ geometry: new Point(position) });
  marker.setStyle(
    new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({ color: "#198754" }),
        stroke: new Stroke({ color: "white", width: 3 }),
      }),
    })
  );
  new Map({
    target,
    layers: [
      new TileLayer({ source: new OSM() }),
      new VectorLayer({ source: new VectorSource({ features: [marker] }) }),
    ],
    view: new View({ center: position, zoom: 14 }),
  });
}

export function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selecciona una imagen."));
      return;
    }
    if (file.size > 200 * 1024) {
      reject(new Error("La imagen debe ocupar como máximo 200 KB."));
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result as string));
    reader.addEventListener("error", () =>
      reject(new Error("No se pudo leer la imagen."))
    );
    reader.readAsDataURL(file);
  });
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ratingCard(
  name: string,
  email: string,
  photo: string,
  score: number,
  comment: string
): HTMLElement {
  const card = document.createElement("article");
  card.className = "card p-3 mb-3";
  const image = document.createElement("img");
  image.src = new URL(photo, `${SERVER}/`).href;
  image.alt = name;
  image.width = 48;
  image.height = 48;
  image.className = "rounded-circle mb-2";
  const title = document.createElement("h5");
  title.textContent = name;
  const mail = document.createElement("small");
  mail.textContent = email;
  const stars = document.createElement("p");
  stars.className = "text-warning my-2";
  stars.textContent = `${"★".repeat(score)}${"☆".repeat(5 - score)} (${score}/5)`;
  const text = document.createElement("p");
  text.textContent = comment;
  card.append(image, title, mail, stars, text);
  return card;
}
