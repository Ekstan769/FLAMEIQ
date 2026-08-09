"use client";

import { useState } from "react";
import Input from "../common/Input";
import Button from "../common/Button";
import Checkbox from "../common/Checkbox";

export default function SignupForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!formData.password) {
      setError("Please enter your password.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeToTerms) {
      setError("Please agree to the Terms & Conditions.");
      return;
    }

    console.log("FLAMEIQ signup:", formData);

    alert("Account details submitted successfully!");
  }

  return (
    <div className="w-full max-w-[445px]">

      {/* User Icon */}
      <div className="mb-4 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#F4D5B5] bg-[#FFF9F3]">
          <span className="text-[24px] text-[#1F4E79]">
            ♙
          </span>
        </div>
      </div>


      {/* Heading */}
      <div className="mb-5 text-center">
        <h1 className="text-[24px] font-semibold leading-tight text-[#1E293B]">
          Create Your Account
        </h1>

        <p className="mt-2 text-[13px] text-[#64748B]">
          Input your details to create a new account.
        </p>
      </div>


      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">

        <Input
          label="Full Name"
          name="fullName"
          type="text"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={handleChange}
        />

        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="Enter email address"
          value={formData.email}
          onChange={handleChange}
        />

        <Input
          label="Create a New Password"
          name="password"
          type="password"
          placeholder="Enter new password"
          value={formData.password}
          onChange={handleChange}
        />

        <Input
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          placeholder="Re-type your password to confirm"
          value={formData.confirmPassword}
          onChange={handleChange}
        />


        {/* Terms */}
        <div className="pt-1">
          <Checkbox
            label={
              <>
                I agree to the{" "}
                <a
                  href="#"
                  className="font-medium text-[#1F4E79] hover:underline"
                >
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="font-medium text-[#1F4E79] hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </>
            }
            checked={agreeToTerms}
            onChange={setAgreeToTerms}
          />
        </div>


        {/* Error */}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[#EF4444]">
            {error}
          </p>
        )}


        {/* Get Started */}
        <Button type="submit">
          Get Started ↗
        </Button>


        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-[#D9DEE5]" />

          <span className="text-[8px] uppercase text-[#94A3B8]">
            OR CONTINUE WITH
          </span>

          <div className="h-px flex-1 bg-[#D9DEE5]" />
        </div>


        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-3">

          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#9DB5CF] bg-white text-sm font-medium text-[#1E293B] transition hover:bg-[#F8FAFC]"
          >
            <span className="text-lg">●</span>
            Apple
          </button>

          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#9DB5CF] bg-white text-sm font-medium text-[#1E293B] transition hover:bg-[#F8FAFC]"
          >
            <span className="font-bold text-[#4285F4]">G</span>
            Google
          </button>

        </div>

      </form>

    </div>
  );
}