import { Http } from "./http.class.ts";
import { SERVER } from "../constants.ts";
import type {
  User,
  UserProfileEdit,
  UserPasswordEdit,
  UserPhotoEdit,
} from "../interfaces/user.ts";
import type { UserResponse, PhotoResponse } from "../interfaces/responses.ts";

export class UsersService {
  #http = new Http();
  async get(id: number | "me" = "me"): Promise<User> {
    const response = await this.#http.get<UserResponse>(
      `${SERVER}/users/${id}`
    );
    return response.user;
  }
  async update(data: UserProfileEdit): Promise<void> {
    await this.#http.put<void, UserProfileEdit>(`${SERVER}/users/me`, data);
  }
  async password(password: string): Promise<void> {
    await this.#http.put<void, UserPasswordEdit>(
      `${SERVER}/users/me/password`,
      { password }
    );
  }
  async photo(photo: string): Promise<string> {
    const response = await this.#http.put<PhotoResponse, UserPhotoEdit>(
      `${SERVER}/users/me/photo`,
      { photo }
    );
    return response.photo;
  }
}
