"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";

type VerificationState = "idle" | "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [state, setState] = useState<VerificationState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const url = new URL(window.location.href);
      const token = url.searchParams.get("token") || "";

      if (!token) {
        setState("error");
        setMessage("Verification token is missing. Please use the link from your email.");
        return;
      }

      setState("loading");
      setMessage("");

      try {
        const response = await api.verifyEmail(token);
        if (cancelled) {
          return;
        }
        setState("success");
        setMessage(response.message || "Email verified successfully.");
      } catch (error) {
        if (cancelled) {
          return;
        }
        const friendly =
          error instanceof ApiError
            ? error.message
            : "Email verification failed. The link may be invalid or expired.";
        setState("error");
        setMessage(friendly);
      }
    };

    void verify();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="narrow-layout">
      <section className="single-column-card">
        <p className="eyebrow">Account activation</p>
        <h1>Verify your email</h1>

        {state === "loading" && <p className="muted-text">Verifying your account...</p>}
        {state === "success" && <p className="success-text">{message}</p>}
        {state === "error" && <p className="error-text">{message}</p>}

        <p className="muted-text">
          {state === "success"
            ? "Your account is active now. Continue to sign in."
            : "Need a fresh verification email? Register again with the same address."}
        </p>

        <div className="inline-actions">
          <Link href="/login">Go to sign in</Link>
          <Link href="/register">Go to register</Link>
        </div>
      </section>
    </div>
  );
}