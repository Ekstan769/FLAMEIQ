import apiClient from "./apiClient";

export interface LoginPayload {
  email: string;
  password: string;
}

export const login = (payload: LoginPayload) =>
  apiClient.post("/auth/login", payload);

export const signup = (payload: LoginPayload & { name: string }) =>
  apiClient.post("/auth/signup", payload);

export const logout = () => apiClient.post("/auth/logout");
