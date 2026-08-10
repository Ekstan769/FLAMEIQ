"use client";

import Link from "next/link";
import { useState } from "react";
import {
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowUpRight,
} from "lucide-react";
import "./login.css";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <main className="login-page">

      {/* Header */}
      <header className="login-header">
        <Link href="/" className="login-logo">
          <img
            src="/images/logo.svg"
            alt="FlameIQ"
          />
        </Link>

        <div className="signup-prompt">
          <span>Don't have an account?</span>

          <Link href="/signup" className="signup-link">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Login Content */}
      <section className="login-section">

        <div className="login-card">

          {/* Profile Icon */}
          <div className="login-icon-wrapper">
            <UserRound size={25} strokeWidth={1.7} />
          </div>

          {/* Heading */}
          <div className="login-heading">
            <h1>
              Welcome Back <span>👋</span>
            </h1>

            <p>
              Enter your details to access your FlameIQ account.
            </p>
          </div>

          {/* Form */}
          <form className="login-form">

            {/* Email / Phone */}
            <div className="login-form-group">
              <label htmlFor="identifier">
                Email Address or Phone number
              </label>

              <div className="login-input-wrapper">
                <Mail
                  className="login-input-icon"
                  size={18}
                  strokeWidth={1.7}
                />

                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  placeholder="Enter email address or phone number"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-form-group">
              <label htmlFor="password">
                Password
              </label>

              <div className="login-input-wrapper">
                <LockKeyhole
                  className="login-input-icon"
                  size={18}
                  strokeWidth={1.7}
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="login-options">

              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                />

                <span>Remember me</span>
              </label>

              <Link
                href="/forgot-password"
                className="forgot-password"
              >
                Forgot Password?
              </Link>

            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="login-button"
            >
              <span>Login</span>

              <ArrowUpRight
                size={18}
                strokeWidth={1.8}
              />
            </button>

          </form>

          {/* Bottom Signup */}
          <div className="login-footer">
            <span>Don't have a FlameIQ account?</span>

            <Link href="/signup">
              Create Account
            </Link>
          </div>

        </div>

      </section>

    </main>
  );
}