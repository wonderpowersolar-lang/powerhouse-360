import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

/**
 * Gemeinsames Gerüst aller Legal-Seiten: Nav, ruhige typografische Spalte
 * auf Off-Black, Footer. Die Inhalte kommen als semantisches HTML und
 * werden über `.legal-prose` (globals.css) gesetzt.
 */
export default function LegalShell({
  kicker = "Rechtliches",
  title,
  stand,
  children,
}: {
  kicker?: string;
  title: string;
  stand?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="relative bg-navy-900">
        <div className="mx-auto max-w-3xl px-5 pb-28 pt-32 sm:px-8 sm:pt-36">
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            <span className="h-px w-8 bg-gold/60" />
            {kicker}
          </p>
          <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl md:text-[2.75rem]">
            {title}
          </h1>
          {stand && (
            <p className="mt-3 text-sm text-ink-faint">Stand: {stand}</p>
          )}
          <div className="legal-prose mt-10">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
