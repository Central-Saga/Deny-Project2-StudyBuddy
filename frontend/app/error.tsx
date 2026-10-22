"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Study Buddy error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 text-5xl">⚠️</div>

        <h1 className="text-2xl font-bold text-slate-800">
          Terjadi Kesalahan
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          Halaman mengalami kendala. Silakan coba kembali
          atau kembali ke dashboard.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Coba Lagi
          </button>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
