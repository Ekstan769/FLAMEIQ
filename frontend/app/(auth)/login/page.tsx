"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowUpRight,
} from "lucide-react";

import "./login.css";
import { login as loginUser } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser({
        email: identifier,
        password: password,
      });

      const data = response.data;

      const user = data?.user;
      const token = data?.token;

      if (!user || !token) {
        throw new Error("Invalid login response from server.");
      }

      login(user, token);
      const targetRoute = user?.role === "VENDOR" ? "/vendor/dashboard" : "/customer/dashboard";
      router.push(targetRoute);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to login. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <header className="auth-header">
        <Link href="/" className="flameiq-logo">
          <span className="logo-flame">♨</span>
          <span>Flame</span>
          <strong>IQ</strong>
        </Link>

        <div className="auth-header-right">
          <span>Don&apos;t have an account?</span>

          <Link href="/signup" className="signup-link">
            Sign Up
          </Link>
        </div>
      </header>

      <section className="login-container">
        <div className="login-card">
          <div className="login-icon">
            <UserRound size={27} strokeWidth={1.8} />
          </div>

          <div className="login-heading">
            <h1>Welcome Back 👋</h1>
            <p>Enter your details to access your FlameIQ account.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="identifier">Email Address or Phone number</label>

              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />

                <input
                  id="identifier"
                  type="text"
                  placeholder="Enter email address or phone number"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="input-wrapper">
                <LockKeyhole size={20} className="input-icon" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />

                <span>Remember me</span>
              </label>

              <Link href="/forgot-password">Forgot Password?</Link>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}

              {!loading && <ArrowUpRight size={20} />}
            </button>
          </form>

          <p className="create-account">
            Don&apos;t have a FlameIQ account?{" "}
            <Link href="/signup">Create Account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}