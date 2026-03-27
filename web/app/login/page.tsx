"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

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

  const needsVerificationHint = useMemo(
    () => errorMessage.toLowerCase().includes("not active"),
    [errorMessage]
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      await login(email, password);
      router.replace("/");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Sign in failed";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="narrow-layout">
      <section className="single-column-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in to InkWell</h1>
        <p className="muted-text">Continue reading, writing, and managing your stories.</p>

        {errorMessage.length > 0 && <p className="error-text">{errorMessage}</p>}
        {needsVerificationHint && (
          <p className="muted-text">Please verify your email from the link we sent you during registration.</p>
        )}

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
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="muted-text">
          New here? <Link href="/register">Create your account</Link>
        </p>
      </section>
    </div>
  );
}