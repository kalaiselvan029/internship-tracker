
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();

    setMessage("");
    setMessageType("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.message ||
          data.email ||
          data.name ||
          data.password ||
          "Registration failed. Please try again.";

        throw new Error(errorMessage);
      }

      setMessage(
        data.message || "Registration successful! Please login."
      );
      setMessageType("success");

      setName("");
      setEmail("");
      setPassword("");

      // Registration does not automatically log the user in.
      // Give the user time to read the success message.
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to connect to the server. Please try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">IT</div>
          <h1>Create Account</h1>
          <p>Start tracking your internship applications.</p>
        </div>

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

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
              placeholder="Create a password (minimum 8 characters)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>

          {message && (
            <p
              role="status"
              style={{
                color: messageType === "success" ? "#15803d" : "#dc2626",
                fontSize: "14px",
                lineHeight: 1.5,
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
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
