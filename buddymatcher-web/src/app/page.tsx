import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
      <main className="card w-full max-w-4xl rounded-3xl p-8 sm:p-12">
        <p className="mb-5 inline-flex rounded-full border border-black/20 px-3 py-1 text-xs tracking-[0.2em] uppercase">
          BuddyMatcher
        </p>
        <h1 className="max-w-2xl text-4xl leading-tight sm:text-6xl">
          TR-DE kultur degisimi icin en uyumlu buddy eslestirme.
        </h1>
        <p className="mt-6 max-w-2xl text-base text-black/70 sm:text-lg">
          Katilimcilar profillerini olusturur. Admin tek tusla global optimum eslestirmeyi calistirir ve her kisi icin bir buddy atanir.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="rounded-xl bg-black px-6 py-3 text-center text-white transition hover:translate-y-[-1px]"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-black/30 px-6 py-3 text-center transition hover:bg-black/5"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-black/30 px-6 py-3 text-center transition hover:bg-black/5"
          >
            Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
