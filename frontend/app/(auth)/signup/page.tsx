import "./signup.css";

export default function SignupPage() {
  return (
    <main className="signup-page">

      {/* Header */}
      <header className="signup-header">
        <div className="logo">
          🔥 Flame<strong>IQ</strong>
        </div>

        <div className="login-link">
          <span>Already have an account?</span>
          <button type="button">Login</button>
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

          <div className="signup-icon">
            ♙
          </div>

          <h1>Create Your Account</h1>

          <p>
            Input your details to create a new account.
          </p>

          <form>

            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                id="fullName"
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
                type="password"
                placeholder="Re-type your password to confirm"
              />
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