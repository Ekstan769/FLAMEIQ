"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import OtpInput from "@/components/ui/OtpInput";
import AuthIconBadge from "@/components/ui/AuthIconBadge";
import { verifyResetCode, sendPasswordReset } from "@/services/authService";
import SuccessModal from "@/components/modals/SuccessModal";

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const isComplete = code.every((digit) => digit !== "");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    setError("");
    setLoading(true);
    try {
      const joinedCode = code.join("");
      await verifyResetCode({ email, code: joinedCode });
      setVerified(true);
    } catch {
      setError("Invalid code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCode(["", "", "", ""]);
    setError("");
    try {
      await sendPasswordReset({ email });
    } catch {
      setError("Unable to resend code. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center">
        <AuthIconBadge>
          <Mail size={22} className="text-link-500" />
        </AuthIconBadge>
        <h1 className="font-heading mt-4 text-xl font-bold text-ink-500">
          Enter Code
        </h1>
        <p className="mt-2 text-sm text-muted-500">
          We have sent a password reset instruction to you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <OtpInput value={code} onChange={setCode} />

        {error && (
          <p className="text-center text-xs text-error">{error}</p>
        )}

        <button
          type="button"
          onClick={handleResend}
          className="text-sm font-medium text-notify-600 hover:text-notify-700"
        >
          Resend code
        </button>

        <button
          type="submit"
          disabled={!isComplete || loading}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold bg-[#1f4e79] text-white hover:bg-[#1f4e79] disabled:cursor-not-allowed disabled:opacity-60 w-full"
        >
          {loading ? "Verifying…" : "Proceed"}
        </button>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-notify-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-notify-600"
        >
          <Mail size={16} /> Open Email App
        </button>
      </form>


      <SuccessModal
        isOpen={verified}
        message="You're now ready to explore FlameIQ!"
        redirectTo="/login"
      />
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={null}>
      <VerifyCodeContent />
    </Suspense>
  );
}