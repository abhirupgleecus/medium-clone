"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { api, ApiError } from "@/lib/api";

export default function ProfilePage() {
  const { isAuthenticated, loading, user, refreshUser, updateUserLocally } = useAuth();

  const [fullNameDraft, setFullNameDraft] = useState<string | null>(null);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fullName = fullNameDraft ?? user?.full_name ?? "";
  const avatarUrl = avatarUrlDraft ?? user?.avatar_url ?? "";

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
      setSuccessMessage("Profile updated.");
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
      setSuccessMessage("Password changed.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to change password";
      setErrorMessage(message);
    }
  };

  if (!loading && !isAuthenticated) {
    return (
      <section className="single-column-card">
        <h1>Profile</h1>
        <p className="muted-text">
          Please <Link href="/login">login</Link> to manage your profile.
        </p>
      </section>
    );
  }

  return (
    <div className="stack-lg">
      <section className="hero-card">
        <p className="eyebrow">Profile</p>
        <h1>Manage Account</h1>
        <p>Update your public information and password securely.</p>
      </section>

      {errorMessage.length > 0 && <p className="error-text">{errorMessage}</p>}
      {successMessage.length > 0 && <p className="success-text">{successMessage}</p>}

      <section className="single-column-card">
        <h2>Profile Details</h2>
        <form className="form-stack" onSubmit={onProfileSave}>
          <label htmlFor="profile-email">Email</label>
          <input disabled id="profile-email" type="email" value={user?.email || ""} />

          <label htmlFor="profile-name">Full Name</label>
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

          <button type="submit">Save Profile</button>
        </form>
      </section>

      <section className="single-column-card">
        <h2>Change Password</h2>
        <form className="form-stack" onSubmit={onPasswordChange}>
          <label htmlFor="current-password">Current Password</label>
          <input
            autoComplete="current-password"
            id="current-password"
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            type="password"
            value={currentPassword}
          />

          <label htmlFor="new-password">New Password</label>
          <input
            autoComplete="new-password"
            id="new-password"
            minLength={8}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            type="password"
            value={newPassword}
          />

          <button type="submit">Update Password</button>
        </form>
      </section>
    </div>
  );
}