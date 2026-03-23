import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("parampara_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("parampara_token");
      localStorage.removeItem("parampara_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────
export const authAPI = {
  register: (data: { name: string; email: string; password: string; role: string; org: string; location?: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) => api.post("/auth/login", data),
};

// ─── Product ──────────────────────────────────────────────
export const productAPI = {
  create: (formData: FormData) =>
    api.post("/product/create", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getAll: (params?: { status?: string; org?: string; page?: number; limit?: number }) =>
    api.get("/product", { params }),
  getById: (productId: string) => api.get(`/product/${productId}`),
  getHistory: (productId: string) => api.get(`/product/${productId}/history`),
  getQR: (productId: string) => api.get(`/product/${productId}/qr`),
};

// ─── Lifecycle ────────────────────────────────────────────
export const lifecycleAPI = {
  addStage: (formData: FormData) =>
    api.post("/lifecycle/add-stage", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getJourney: (productId: string) => api.get(`/lifecycle/${productId}`),
};

// ─── Transfer ─────────────────────────────────────────────
export const transferAPI = {
  transfer: (data: { productId: string; toOrg: string }) => api.post("/transfer", data),
};

// ─── Order ────────────────────────────────────────────────
export const orderAPI = {
  create: (data: { productId: string }) => api.post("/order/create", data),
};

// ─── Scan ─────────────────────────────────────────────────
export const scanAPI = {
  scan: (data: { productId: string; location?: string; coordinates?: { lat: number; lng: number } }) =>
    api.post("/scan", data),
};

// ─── Verify ───────────────────────────────────────────────
export const verifyAPI = {
  image: (formData: FormData) =>
    api.post("/verify/image", formData, { headers: { "Content-Type": "multipart/form-data" } }),
};

// ─── Feedback ─────────────────────────────────────────────
export const feedbackAPI = {
  submit: (formData: FormData) =>
    api.post("/feedback", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getByProduct: (productId: string) => api.get(`/feedback/${productId}`),
};

// ─── Validator ────────────────────────────────────────────
export const validatorAPI = {
  registerArtisan: (formData: FormData) =>
    api.post("/validator/artisan/register", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getPending: () => api.get("/validator/artisan/pending"),
  verify: (artisanId: string, data: { isValid: boolean; reason?: string }) =>
    api.post(`/validator/artisan/${artisanId}/verify`, data),
  flag: (artisanId: string, data: { reason: string }) =>
    api.post(`/validator/artisan/${artisanId}/flag`, data),
  getArtisan: (artisanId: string) => api.get(`/validator/artisan/${artisanId}`),
};

// ─── Token ────────────────────────────────────────────────
export const tokenAPI = {
  getBalance: () => api.get("/token/balance"),
  getTransactions: () => api.get("/token/transactions"),
  redeem: (data: { amount: number }) => api.post("/token/redeem", data),
};

// ─── Return ───────────────────────────────────────────────
export const returnAPI = {
  initiate: (formData: FormData) =>
    api.post("/return/initiate", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  receive: (returnId: string) => api.put(`/return/${returnId}/receive`),
  repair: (returnId: string, data: { notes: string }) => api.put(`/return/${returnId}/repair`, data),
  getHistory: (productId: string) => api.get(`/return/product/${productId}`),
};

export default api;
