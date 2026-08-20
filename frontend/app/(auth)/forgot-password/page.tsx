"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthIconBadge from "@/components/ui/AuthIconBadge";
import { sendPasswordReset } from "@/services/authService";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordReset({ email });
      router.push(`/verify-code?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Unable to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center">
        <AuthIconBadge>
          <Lock size={22} className="text-brand-500" />
        </AuthIconBadge>
        <h1 className="font-heading mt-4 text-xl font-bold text-ink-500">
          Forgot Password?
        </h1>
        <p className="mt-2 text-sm text-muted-500">
          Enter your email address and we&apos;ll send an email with
          password reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          icon={<Mail size={16} />}
          error={error}
          required
          className="w-full"
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending…" : "Send Code"}
        </Button>
      </form>
    </div>
  );
}