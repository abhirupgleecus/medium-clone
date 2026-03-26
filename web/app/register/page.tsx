"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { api, ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.register(email, password, fullName);
      setSuccessMessage("Registration successful. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Registration failed";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="single-column-card">
      <h1>Register</h1>
      <p className="muted-text">Create your account and start publishing.</p>

      {errorMessage.length > 0 && <p className="error-text">{errorMessage}</p>}
      {successMessage.length > 0 && <p className="success-text">{successMessage}</p>}

      <form className="form-stack" onSubmit={onSubmit}>
        <label htmlFor="full-name">Full Name</label>
        <input
          id="full-name"
          onChange={(event) => setFullName(event.target.value)}
          required
          type="text"
          value={fullName}
        />

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
          autoComplete="new-password"
          id="password"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />

        <button disabled={submitting} type="submit">
          {submitting ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="muted-text">
        Already have an account? <Link href="/login">Login</Link>
      </p>
    </section>
  );
}