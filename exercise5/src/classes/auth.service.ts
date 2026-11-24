import { Http } from "./http.class.ts";
import { SERVER } from "../constants.ts";
import { type LoginData, type RegisterData } from "../interfaces/user.ts";
import { type TokenResponse } from "../interfaces/responses.ts";

export class AuthService {
  #http = new Http();
  async login(user: LoginData): Promise<void> {
    const resp = await this.#http.post<TokenResponse, LoginData>(
      `${SERVER}/auth/login`,
      user
    );
    localStorage.setItem("token", resp.accessToken);
  }

  async checkToken(): Promise<void> {
    await this.#http.get<void>(`${SERVER}/auth/validate`);
  }

  logout(): void {
    localStorage.removeItem("token");
  }

  async register(user: RegisterData): Promise<void> {
    await this.#http.post<void, RegisterData>(`${SERVER}/auth/register`, user);
  }
}
