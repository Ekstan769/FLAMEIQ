"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { signup as signupRequest } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

export default function SignUpPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange =
    (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await signupRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      login(data.user, data.token);
      const targetRoute = data.user?.role === "VENDOR" ? "/vendor/dashboard" : "/customer/dashboard";
      router.push(targetRoute);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Sign up failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create an Account</h1>
        <p className="text-sm text-slate-600 mt-1">Get started with FlameIQ today</p>
      </div>

      <Input
        label="Full Name"
        type="text"
        value={form.name}
        onChange={handleChange("name")}
        placeholder="John Doe"
      />
      <Input
        label="Email Address"
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
      <Input
        label="Confirm Password"
        type="password"
        value={form.confirmPassword}
        onChange={handleChange("confirmPassword")}
        placeholder="••••••••"
      />

      {error && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Sign Up"}
      </Button>

      <p className="text-center text-sm text-slate-600 mt-2">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-500 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
