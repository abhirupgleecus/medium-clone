"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      await login(email, password);
      router.replace("/");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Login failed";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="single-column-card">
      <h1>Login</h1>
      <p className="muted-text">Sign in with your account credentials.</p>

      {errorMessage.length > 0 && <p className="error-text">{errorMessage}</p>}

      <form className="form-stack" onSubmit={onSubmit}>
        <label htmlFor="email">Email</label>
        <input
          autoComplete="email"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />

        <label htmlFor="password">Password</label>
        <input
          autoComplete="current-password"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />

        <button disabled={submitting} type="submit">
          {submitting ? "Signing in..." : "Login"}
        </button>
      </form>

      <p className="muted-text">
        Need an account? <Link href="/register">Register</Link>
      </p>
    </section>
  );
}