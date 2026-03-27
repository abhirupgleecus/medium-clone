import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="footer-brand">InkWell</p>
        <nav className="footer-links" aria-label="Footer">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Write</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/login">Sign in</Link>
        </nav>
      </div>
    </footer>
  );
}