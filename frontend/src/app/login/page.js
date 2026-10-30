
"use client";

import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed. Check your credentials."
        );
      }

      if (!data.token) {
        throw new Error(
          "Login succeeded, but no JWT token was returned."
        );
      }

      localStorage.setItem("token", data.token);

      if (data.userId != null) {
        localStorage.setItem("userId", String(data.userId));
      }

      if (data.name) {
        localStorage.setItem("userName", data.name);
      }

      if (data.email) {
        localStorage.setItem("userEmail", data.email);
      }

      window.location.replace("/dashboard");
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">IT</div>
          <h1>Welcome Back!</h1>
          <p>
            Login to manage your internship applications.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {message && (
            <p
              role="alert"
              style={{
                color: "#dc2626",
                fontSize: "14px",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{" "}
          <Link href="/register">Create account</Link>
        </p>
      </section>
    </main>
  );
}
