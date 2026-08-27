import Link from "next/link";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";

export function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm text-zinc-400">
          <Link href="/" className="hover:text-zinc-700">
            홈
          </Link>
          <span className="mx-2">/</span>
          {title}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">
          {title}
        </h1>
        <div className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-zinc-600">
          {children}
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
