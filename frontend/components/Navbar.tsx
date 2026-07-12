"use client";

import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="Memegrid" width={36} height={36} className="rounded-md" priority />
          <span className="font-display text-lg font-semibold tracking-tight text-deep">
            memegrid
          </span>
        </Link>

        <nav className="hidden items-center gap-8 font-body text-sm text-deep/70 md:flex">
          <Link href="/marketplace" className="transition hover:text-ink">
            Marketplace
          </Link>
          <Link href="/how-it-works" className="transition hover:text-ink">
            How it works
          </Link>
          <Link href="/dashboard" className="transition hover:text-ink">
            Dashboard
          </Link>
          <Link href="/skill" className="transition hover:text-ink">
            Skill
          </Link>
        </nav>

        <Link
          href="/dashboard"
          className="group relative overflow-hidden rounded-sm bg-ink px-5 py-2.5 font-body text-sm font-medium text-paper transition-transform hover:-translate-y-0.5"
        >
          <span className="relative z-10">Open platform</span>
          <span className="absolute inset-0 -translate-x-full bg-signal transition-transform duration-300 group-hover:translate-x-0" />
        </Link>
      </div>
    </header>
  );
}
