"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, GraduationCap, Lock, Mail } from "lucide-react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || '/api/v1'
).replace(/\/$/, '');

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      // Panggil API Login Backend Laravel
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Email atau password salah.");
      }

      // Simpan Token & Data User di LocalStorage
      if (data.access_token) {
        // Key lama, tetap dipertahankan agar fitur lain tidak rusak
        localStorage.setItem("access_token", data.access_token);

        // Key yang digunakan oleh Calendar / API helper
        localStorage.setItem(
          "meetspace_auth_token",
          data.access_token
        );

        // Simpan data user
        localStorage.setItem(
          "user_data",
          JSON.stringify(data.user)
        );
      }

      // Redirect ke Dashboard setelah berhasil
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage(
        err.message || "Terjadi kesalahan saat masuk."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 font-sans">
      {/* SEKSI KIRI: BRANDING / HERO BANNER */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white relative overflow-hidden">
        <div className="flex items-center gap-3 z-10">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Study Buddy
            </h1>
            <p className="text-xs text-blue-200">
              Learn Together, Grow Together
            </p>
          </div>
        </div>

        <div className="my-auto z-10 max-w-md space-y-4">
          <h2 className="text-3xl font-extrabold leading-tight">
            Selamat Datang Kembali di Study Buddy!
          </h2>

          <p className="text-sm text-blue-100/80 leading-relaxed">
            Lanjutkan perjalanan belajarmu, masuk ke grup diskusi,
            dan capai target akademik bersama teman-temanmu.
          </p>
        </div>

        <p className="text-xs text-blue-200/60 z-10">
          © 2026 Study Buddy Platform. All rights reserved.
        </p>

        {/* Aksesori Bulatan Blur */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* SEKSI KANAN: FORM LOGIN */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Masuk ke Akun
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Masukkan email dan password terdaftar untuk melanjutkan.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            suppressHydrationWarning
            className="space-y-4"
          >
            {/* Input Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>

                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  placeholder="example@email.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  placeholder="Masukkan password"
                  className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-colors"
            >
              {loading ? "Memproses..." : "Masuk Sekarang"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-bold text-blue-600 hover:underline"
            >
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}