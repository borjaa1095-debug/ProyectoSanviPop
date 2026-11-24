import { Http } from "./http.class.ts";
import { SERVER } from "../constants.ts";
import { type Product, type ProductInsert } from "../interfaces/product.ts";
import {
  type ProductsResponse,
  type SingleProductResponse,
} from "../interfaces/responses.ts";

export class ProductsService {
  #http = new Http();

  async buy(id: number): Promise<void> {
    await this.#http.put<void, never>(`${SERVER}/products/${id}/buy`);
  }

  async bookmark(id: number, saved: boolean): Promise<void> {
    if (saved) {
      await this.#http.post<void, never>(`${SERVER}/products/${id}/bookmarks`);
    } else {
      await this.#http.delete<void>(`${SERVER}/products/${id}/bookmarks`);
    }
  }

  async getForUser(
    id: number,
    status: string,
    page = 1
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      user: String(id),
      status,
      page: String(page),
    });
    return await this.#http.get<ProductsResponse>(
      `${SERVER}/products?${params}`
    );
  }

  async getAll(
    page = 1,
    search = "",
    sort = "distance",
    status = "",
    user = ""
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      page: String(page),
      search,
      sort,
    });

    if (status !== "") {
      params.set("status", status);

      if (user !== "") {
        params.set("user", user);
      }
    }

    return await this.#http.get<ProductsResponse>(
      `${SERVER}/products?${params.toString()}`
    );
  }

  async getById(id: number): Promise<Product> {
    const resp = await this.#http.get<SingleProductResponse>(
      `${SERVER}/products/${id}`
    );

    return resp.product;
  }

  async post(product: ProductInsert): Promise<Product> {
    const resp = await this.#http.post<SingleProductResponse, ProductInsert>(
      `${SERVER}/products`,
      product
    );
    return resp!.product;
  }

  async delete(id: number): Promise<void> {
    await this.#http.delete(`${SERVER}/products/${id}`);
  }
}
