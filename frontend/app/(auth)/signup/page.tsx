"use client";

import Link from "next/link";
import {
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  Apple,
} from "lucide-react";

import "./signup.css";

export default function SignupPage() {
  return (
    <main className="signup-page">

      {/* ================= HEADER ================= */}

      <header className="signup-header">

        <Link href="/" className="signup-logo">
          <img
            src="/images/logo.svg"
            alt="FlameIQ"
          />
        </Link>

        <div className="login-link">
          <span>Already have an account?</span>

          <Link href="/login">
            <button type="button">
              Login
            </button>
          </Link>
        </div>

      </header>


      {/* ================= MAIN ================= */}

      <section className="signup-section">

        {/* BACKGROUND ARTWORK */}

        <div className="signup-background">

          <img
            src="/images/gas-phone.png"
            alt="FlameIQ gas cylinder and mobile application"
          />

        </div>


        {/* FORM */}

        <div className="signup-form-container">

          {/* Profile icon */}

          <div className="signup-icon">
            <UserRound />
          </div>


          {/* Heading */}

          <h1>
            Create Your Account
          </h1>

          <p>
            Input your details to create a new account.
          </p>


          <form>

            {/* Full Name */}

            <div className="form-group">

              <label htmlFor="fullName">
                Full Name
              </label>

              <div className="input-wrapper">

                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                />

              </div>

            </div>


            {/* Email */}

            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrapper">

                <Mail />

                <input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                />

              </div>

            </div>


            {/* Password */}

            <div className="form-group">

              <label htmlFor="password">
                Create a New Password
              </label>

              <div className="input-wrapper">

                <LockKeyhole />

                <input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                />

                <Eye />

              </div>

            </div>


            {/* Confirm Password */}

            <div className="form-group">

              <label htmlFor="confirmPassword">
                Confirm New Password
              </label>

              <div className="input-wrapper">

                <LockKeyhole />

                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-type your password to confirm"
                />

                <Eye />

              </div>

            </div>


            {/* Terms */}

            <div className="terms">

              <input
                id="terms"
                type="checkbox"
              />

              <label htmlFor="terms">
                I agree to the{" "}
                <strong>Terms & Conditions</strong>{" "}
                and{" "}
                <strong>Privacy Policy</strong>.
              </label>

            </div>


            {/* Social buttons */}

            <div className="social-buttons">

              <button type="button">
                <Apple size={18} fill="currentColor" />
                Apple
              </button>

              <button type="button">
                <span style={{ color: "#4285F4", fontWeight: 700 }}>
                  G
                </span>
                Google
              </button>

            </div>


            {/* Get Started */}

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