export class Http {
  async ajax<T>(method: string, url: string, headers?: HeadersInit, body?: string): Promise<T> {
    const requestHeaders = new Headers(headers);
    const token = localStorage.getItem("token");
    if (token && (!new URL(url).pathname.startsWith("/auth/") || url.endsWith("/auth/validate"))) {
      requestHeaders.set("Authorization", "Bearer " + token);
    }

    let response: Response;
    try {
      response = await fetch(url, { method, headers: requestHeaders, body });
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      throw new Error(`No se pudo conectar con la API de SanviPop en ${new URL(url).origin}. Comprueba que el servidor esté en marcha y vuelve a intentarlo.`, { cause: error });
    }
    if (!response.ok) {
      if (response.status === 401 && requestHeaders.has("Authorization") && localStorage.getItem("token") === token) {
        localStorage.removeItem("token");
        location.replace("login.html");
      }
      const error = await response.json().catch(() => null);
      const message = Array.isArray(error?.message) ? error.message.join(" ") : error?.message;
      throw new Error(message || "Request failed (" + response.status + ").");
    }
    return response.status === 204 ? undefined as T : await response.json() as T;
  }

  get<T>(url: string): Promise<T> {
    return this.ajax<T>("GET", url);
  }

  post<T, U = unknown>(url: string, data?: U): Promise<T> {
    return this.json<T>("POST", url, data);
  }

  put<T, U = unknown>(url: string, data?: U): Promise<T> {
    return this.json<T>("PUT", url, data);
  }

  delete<T>(url: string): Promise<T> {
    return this.ajax<T>("DELETE", url);
  }

  private json<T>(method: string, url: string, data: unknown): Promise<T> {
    return data === undefined ? this.ajax<T>(method, url) :
      this.ajax<T>(method, url, { "Content-Type": "application/json" }, JSON.stringify(data));
  }
}
