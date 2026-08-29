import Link from "next/link";

export default function NotFound() {
  return (
    <section className="site-section">
      <div className="wrap">
        <h2>Page not found</h2>
        <p>That address does not exist on this site.</p>
        <Link href="/" className="cta">
          Back to the homepage
        </Link>
      </div>
    </section>
  );
}
