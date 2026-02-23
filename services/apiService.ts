import { Product, Supplier, Transaction } from "../types";

/**
 * REST API SERVICE
 */
export const BASE_URL = "https://Api-mini-pos.daltek.id/api";

const request = async (path: string, options: RequestInit = {}) => {
  try {
    const token = localStorage.getItem("auth_token");
    // Ensure path ends with a slash to avoid CORS issues
    const normalizedPath = path.endsWith("/") ? path : `${path}/`;

    const response = await fetch(`${BASE_URL}${normalizedPath}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        ...options.headers,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem("auth_token");
      // window.location.reload();
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        errBody.error || `Gagal menghubungi backend: ${response.statusText}`,
      );
    }

    const result = await response.json();
    // Extract data from 'Data' property if it exists, otherwise return the result
    return result && typeof result === "object" && "Data" in result
      ? result.Data
      : result;
  } catch (err: any) {
    console.error("Connection Error:", err);
    // throw new Error(
    //   `Backend tidak merespon di ${BASE_URL}${path}. Pastikan server sudah berjalan.`,
    // );

    throw new Error(err);
  }
};

export const auth = {
  login: async (username: string, password: string) => {
    const res = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (res.Token) {
      localStorage.setItem("auth_token", res.Token);
      localStorage.setItem("auth_user", res.Username);
      const userId = res.Id || res.id || res.UserID || res.userid;
      if (userId) {
        localStorage.setItem("auth_user_id", String(userId));
      }
    }
    return res;
  },
  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_user_id");
    window.location.reload();
  },
  isAuthenticated: () => !!localStorage.getItem("auth_token"),
};

export const api = {
  products: {
    getAll: () => request("/products"),
    getById: (id: string) => request(`/products/${id}`),
    save: (p: Product) => {
      if (p.id)
        return request(`/products/${p.id}`, {
          method: "PUT",
          body: JSON.stringify(p),
        });
      return request("/products", { method: "POST", body: JSON.stringify(p) });
    },
    delete: (id: any) => request(`/products/${id}`, { method: "DELETE" }),
  },
  suppliers: {
    getAll: () => request("/supplies"),
    getById: (id: string) => request(`/supplies/${id}`),
    save: (s: Supplier) => {
      if (s.id)
        return request(`/supplies/${s.id}`, {
          method: "PUT",
          body: JSON.stringify(s),
        });
      return request("/supplies", { method: "POST", body: JSON.stringify(s) });
    },
    delete: (id: any) => request(`/supplies/${id}`, { method: "DELETE" }),
  },
  transactions: {
    getAll: () => request("/transactions"),
    getById: (id: string) => request(`/transactions/${id}`),
    save: (t: Transaction) => {
      if (t.id)
        return request(`/transactions/${t.id}`, {
          method: "PUT",
          body: JSON.stringify(t),
        });
      return request("/transactions", {
        method: "POST",
        body: JSON.stringify(t),
      });
    },
    insert: (t: Transaction) =>
      request("/transactions", { method: "POST", body: JSON.stringify(t) }),
    delete: (id: any) => request(`/transactions/${id}`, { method: "DELETE" }),
  },
};
