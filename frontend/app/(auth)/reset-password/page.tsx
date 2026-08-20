"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import Input from "@/components/ui/Input";
import AuthIconBadge from "@/components/ui/AuthIconBadge";
import Button from "@/components/ui/Button";
import { resetPassword } from "@/services/authService";
import SuccessModal from "@/components/modals/SuccessModal";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const code = searchParams.get("code") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email, code, password });
      setSuccess(true);
    } catch {
      setError("Unable to reset password. Please try again.");
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
          Create a New Password
        </h1>
        <p className="mt-2 text-sm text-muted-500">
          Your new password must be different from previously used
          passwords.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          icon={<Lock size={16} />}
          helperText="Must contain 8 characters, 1 uppercase, 1 number, 1 special character"
          required
          className="w-full"
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-type your password"
          icon={<Lock size={16} />}
          error={error}
          required
          className="w-full"
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Resetting…" : "Reset Password"}
        </Button>
      </form>

      {/* Success modal Message overlay */}
      <SuccessModal
        isOpen={success}
        message="You have successfully changed your password."
        redirectTo="/login"
      />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}