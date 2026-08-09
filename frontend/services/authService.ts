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

export const sendPasswordReset = (payload: { email: string }) =>
  apiClient.post("/auth/forgot-password", payload);

export const verifyResetCode = (payload: { email: string; code: string }) =>
  apiClient.post("/auth/verify-reset-code", payload);

export const resetPassword = (payload: {
  email: string;
  code: string;
  password: string;
}) => apiClient.post("/auth/reset-password", payload);