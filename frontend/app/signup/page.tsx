"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
<<<<<<< HEAD:frontend/app/signup/page.tsx
import Image from "next/image";
import {
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  Apple,
} from "lucide-react";
=======
>>>>>>> 752a3730cdc96e0a8bbca82437808ae83c3c68d9:frontend/app/(auth)/signup/page.tsx
import { signup as signupRequest } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

import "./signup.css";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange =
    (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
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

    if (!agreedToTerms) {
      setError("You must agree to the Terms & Conditions to continue.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await signupRequest({
        name: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      if (data?.user && data?.token) {
        login(data.user, data.token);
        const targetRoute = data.user?.role === "VENDOR" ? "/vendor/dashboard" : "/customer/dashboard";
        router.push(targetRoute);
      } else {
        router.push("/login");
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Sign up failed. Please check your details and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="signup-page">
      {/* Header */}
      <header className="signup-header">
        <Link href="/" className="logo">
          <Image src="/images/logo.png" alt="FlameIQ logo" width={140} height={34} />
        </Link>

        <div className="login-link">
          <span>Already have an account?</span>

          <Link href="/login">
            Login
          </Link>
        </div>
      </header>

      {/* Signup Section */}
      <section className="signup-section">
        {/* Background Image */}
        <div className="signup-background">
          <img
            src="/images/Heroflamee.png"
            alt="FlameIQ gas cylinder and mobile application"
          />
        </div>

        <div className="signup-form-container">
          <div className="signup-icon">
            <div className="signup-icon-inner">
              <UserRound size={32} />
            </div>
          </div>

          {/* Heading */}
          <h1>Create Your Account</h1>

          <p>
            Input your details to create a new account.
          </p>

          {/* Signup Form */}
<<<<<<< HEAD:frontend/app/signup/page.tsx
          <form onSubmit={handleSubmit} noValidate>
=======
          <form onSubmit={handleSubmit}>
>>>>>>> 752a3730cdc96e0a8bbca82437808ae83c3c68d9:frontend/app/(auth)/signup/page.tsx
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange("fullName")}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={handleChange("email")}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">
                Create a New Password
              </label>

<<<<<<< HEAD:frontend/app/signup/page.tsx
              <div className="input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={form.password}
                  onChange={handleChange("password")}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
=======
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter new password"
                value={form.password}
                onChange={handleChange("password")}
              />
>>>>>>> 752a3730cdc96e0a8bbca82437808ae83c3c68d9:frontend/app/(auth)/signup/page.tsx
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm New Password
              </label>

<<<<<<< HEAD:frontend/app/signup/page.tsx
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-type your password to confirm"
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
=======
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-type your password to confirm"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
              />
>>>>>>> 752a3730cdc96e0a8bbca82437808ae83c3c68d9:frontend/app/(auth)/signup/page.tsx
            </div>

            {/* Terms */}
            <div className="terms">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />

              <label htmlFor="terms">
                I agree to the <strong>Terms & Conditions</strong> and <strong>Privacy Policy</strong>.
              </label>
            </div>

<<<<<<< HEAD:frontend/app/signup/page.tsx
            {error && <p className="signup-error">{error}</p>}

            {/* Button */}
            <button type="submit" className="get-started" disabled={loading}>
              {loading ? "Creating account..." : "Get Started ↗"}
=======
            {error && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mt-2">{error}</p>}

            {/* Button */}
            <button
              type="submit"
              className="get-started"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Get Started ↗"}
>>>>>>> 752a3730cdc96e0a8bbca82437808ae83c3c68d9:frontend/app/(auth)/signup/page.tsx
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}