"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  Apple,
} from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange =
    (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

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
        name: form.fullName,
        email: form.email,
        password: form.password,
      });
      login(data.user, data.token);
      router.push("/customer/dashboard");
    } catch {
      setError("Sign up failed. Please check your details and try again.");
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
          <form>
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
              />
            </div>

            {/* Terms */}
            <div className="terms">
              <input
                id="terms"
                name="terms"
                type="checkbox"
              />

              <label htmlFor="terms">
                I agree to the{" "}
                <strong>Terms & Conditions</strong>{" "}
                and{" "}
                <strong>Privacy Policy</strong>.
              </label>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="get-started"
            >
              Get Started ↗
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}