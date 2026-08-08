"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { login as loginRequest } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange =
    (field: "email" | "password") => (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await loginRequest(form);
      login(data.user, data.token);
    } catch {
      setError("Login failed. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-900">Log in</h1>
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={handleChange("email")}
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        type="password"
        value={form.password}
        onChange={handleChange("password")}
        placeholder="••••••••"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
