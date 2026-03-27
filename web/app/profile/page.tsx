"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { api, ApiError } from "@/lib/api";

export default function ProfilePage() {
  const { isAuthenticated, loading, user, refreshUser, updateUserLocally } = useAuth();

  const [fullNameDraft, setFullNameDraft] = useState<string | null>(null);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [contributionReason, setContributionReason] = useState("");
  const [contributionPending, setContributionPending] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fullName = fullNameDraft ?? user?.full_name ?? "";
  const avatarUrl = avatarUrlDraft ?? user?.avatar_url ?? "";

  const canRequestContribution = useMemo(() => {
    if (!user) {
      return false;
    }
    return user.role !== "contributor" && user.role !== "admin" && user.role !== "super_admin";
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      void refreshUser();
    }
  }, [isAuthenticated, refreshUser]);

  const onProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updated = await api.updateProfile({
        full_name: fullName,
        avatar_url: avatarUrl
      });
      updateUserLocally(updated);
      setFullNameDraft(null);
      setAvatarUrlDraft(null);
      setSuccessMessage("Profile details updated.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to update profile";
      setErrorMessage(message);
    }
  };

  const onPasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setSuccessMessage("Password changed successfully.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to change password";
      setErrorMessage(message);
    }
  };

  const onContributionRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await api.createContributionRequest(contributionReason || undefined);
      setContributionPending(true);
      setContributionReason("");
      setSuccessMessage(response.message || "Contribution request submitted.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to submit contribution request";
      if (message.toLowerCase().includes("pending request")) {
        setContributionPending(true);
      }
      setErrorMessage(message);
    }
  };

  if (!loading && !isAuthenticated) {
    return (
      <div className="narrow-layout">
        <section className="single-column-card">
          <h1>Profile</h1>
          <p className="muted-text">
            Please <Link href="/login">sign in</Link> to manage your account settings.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <section className="hero-card">
        <p className="eyebrow">Account settings</p>
        <h1>Manage your profile</h1>
        <p>Keep your public identity and password up to date.</p>
      </section>

      {errorMessage.length > 0 && <p className="error-text">{errorMessage}</p>}
      {successMessage.length > 0 && <p className="success-text">{successMessage}</p>}

      <div className="settings-grid">
        <section className="single-column-card">
          <h2>Profile details</h2>
          <form className="form-stack" onSubmit={onProfileSave}>
            <label htmlFor="profile-email">Email</label>
            <input disabled id="profile-email" type="email" value={user?.email || ""} />

            <label htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              onChange={(event) => setFullNameDraft(event.target.value)}
              type="text"
              value={fullName}
            />

            <label htmlFor="profile-avatar">Avatar URL</label>
            <input
              id="profile-avatar"
              onChange={(event) => setAvatarUrlDraft(event.target.value)}
              placeholder="https://..."
              type="url"
              value={avatarUrl}
            />

            <button type="submit">Save profile</button>
          </form>
        </section>

        <section className="single-column-card">
          <h2>Security</h2>
          <form className="form-stack" onSubmit={onPasswordChange}>
            <label htmlFor="current-password">Current password</label>
            <input
              autoComplete="current-password"
              id="current-password"
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              type="password"
              value={currentPassword}
            />

            <label htmlFor="new-password">New password</label>
            <input
              autoComplete="new-password"
              id="new-password"
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />

            <button type="submit">Update password</button>
          </form>
        </section>
      </div>

      <section className="single-column-card">
        <h2>Contribution access</h2>

        {user?.role === "contributor" && (
          <p className="muted-text">You already have contributor access. Drafts can be submitted for review from your dashboard.</p>
        )}

        {(user?.role === "admin" || user?.role === "super_admin") && (
          <p className="muted-text">You already have moderation-level publishing permissions.</p>
        )}

        {canRequestContribution && contributionPending && (
          <p className="muted-text">Your contribution request is pending admin review.</p>
        )}

        {canRequestContribution && !contributionPending && (
          <form className="form-stack" onSubmit={onContributionRequest}>
            <label htmlFor="contribution-reason">Why do you want contributor access?</label>
            <textarea
              id="contribution-reason"
              onChange={(event) => setContributionReason(event.target.value)}
              placeholder="Share your writing focus, goals, or areas you want to contribute in."
              rows={4}
              value={contributionReason}
            />
            <button type="submit">Request contributor access</button>
          </form>
        )}
      </section>
    </div>
  );
}