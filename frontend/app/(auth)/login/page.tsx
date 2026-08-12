"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { login as loginRequest } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
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

    if (!form.email.trim() || !form.password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await loginRequest(form);
      login(data.user, data.token);
      const targetRoute = data.user?.role === "VENDOR" ? "/vendor/dashboard" : "/customer/dashboard";
      router.push(targetRoute);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Login failed. Check your details and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
        <p className="text-sm text-slate-600 mt-1">Sign in to your FlameIQ account</p>
      </div>

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

      {error && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Logging in…" : "Log in"}
      </Button>

      <p className="text-center text-sm text-slate-600 mt-2">
        Don't have an account?{" "}
        <Link href="/signup" className="font-semibold text-brand-500 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
