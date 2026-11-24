import { Http } from "./http.class.ts";
import { SERVER } from "../constants.ts";
import type { Rating, RatingInsert } from "../interfaces/rating.ts";
import type {
  RatingsResponse,
  SingleRatingResponse,
} from "../interfaces/responses.ts";

export class RatingsService {
  #http = new Http();
  async getAll(id: number | "me" = "me"): Promise<Rating[]> {
    const response = await this.#http.get<RatingsResponse>(
      `${SERVER}/ratings/user/${id}`
    );
    return response.ratings;
  }
  async post(data: RatingInsert): Promise<void> {
    await this.#http.post<SingleRatingResponse, RatingInsert>(
      `${SERVER}/ratings`,
      data
    );
  }
}
