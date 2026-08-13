"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
           Flame<strong>IQ</strong>
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
            src="/images/gas-phone.png"
            alt="FlameIQ gas cylinder and mobile application"
          />
        </div>

        {/* Form Overlay */}
        <div className="signup-form-container">
          {/* Signup Icon */}
          <div className="signup-icon">
            ♙
          </div>

          {/* Heading */}
          <h1>Create Your Account</h1>

          <p>
            Input your details to create a new account.
          </p>

          {/* Signup Form */}
          <form onSubmit={handleSubmit}>
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

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter new password"
                value={form.password}
                onChange={handleChange("password")}
              />
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm New Password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-type your password to confirm"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
              />
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
                I agree to the{" "}
                <strong>Terms & Conditions</strong>{" "}
                and{" "}
                <strong>Privacy Policy</strong>.
              </label>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mt-2">{error}</p>}

            {/* Button */}
            <button
              type="submit"
              className="get-started"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Get Started ↗"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}