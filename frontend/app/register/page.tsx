'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  User,
} from 'lucide-react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || '/api/v1'
).replace(/\/$/, '');

function getStoredToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('meetspace_auth_token') ||
    ''
  );
}

function saveAuthData(
  token: string,
  user: unknown
): void {
  localStorage.setItem('access_token', token);

  localStorage.setItem(
    'meetspace_auth_token',
    token
  );

  localStorage.setItem(
    'user_data',
    JSON.stringify(user)
  );
}

function clearAuthData(): void {
  localStorage.removeItem('access_token');

  localStorage.removeItem(
    'meetspace_auth_token'
  );

  localStorage.removeItem('user_data');
}

function getApiError(
  data: unknown,
  fallback: string
): string {
  if (
    typeof data !== 'object' ||
    data === null
  ) {
    return fallback;
  }

  const response = data as {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (response.errors) {
    const firstError =
      Object.values(response.errors)[0];

    if (
      Array.isArray(firstError) &&
      firstError.length > 0
    ) {
      return firstError[0];
    }
  }

  return response.message || fallback;
}

export default function RegisterPage() {
  const router = useRouter();

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [formData, setFormData] =
    useState({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
    });

  // =========================================================
  // JIKA SUDAH LOGIN, LANGSUNG KE DASHBOARD
  // =========================================================
  useEffect(() => {
    let active = true;

    const checkExistingSession =
      async () => {
        const token =
          getStoredToken();

        if (!token) {
          if (active) {
            setCheckingSession(false);
          }

          return;
        }

        try {
          const response = await fetch(
            `${API_URL}/me`,
            {
              method: 'GET',

              headers: {
                Accept:
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              cache: 'no-store',
            }
          );

          if (response.ok) {
            const data =
              await response.json();

            if (data.user) {
              saveAuthData(
                token,
                data.user
              );
            }

            router.replace(
              '/dashboard'
            );

            return;
          }

          if (
            response.status === 401
          ) {
            clearAuthData();
          }
        } catch (error) {
          console.error(
            'Gagal memeriksa sesi:',
            error
          );
        }

        if (active) {
          setCheckingSession(false);
        }
      };

    checkExistingSession();

    return () => {
      active = false;
    };
  }, [router]);

  // =========================================================
  // REGISTER
  // =========================================================
  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setErrorMessage('');

    if (
      formData.password !==
      formData.password_confirmation
    ) {
      setErrorMessage(
        'Konfirmasi password tidak sama.'
      );

      return;
    }

    if (
      formData.password.length < 8
    ) {
      setErrorMessage(
        'Password minimal 8 karakter.'
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/register`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json',
          },

          body: JSON.stringify({
            name:
              formData.name.trim(),

            email:
              formData.email.trim(),

            password:
              formData.password,

            password_confirmation:
              formData.password_confirmation,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            'Gagal melakukan pendaftaran.'
          )
        );
      }

      if (
        !data.access_token ||
        !data.user
      ) {
        throw new Error(
          'Respons registrasi tidak valid.'
        );
      }

      saveAuthData(
        data.access_token,
        data.user
      );

      router.replace('/dashboard');
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan pada server.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-xs font-medium text-slate-500">
            Memeriksa sesi...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 bg-slate-50 font-sans lg:grid-cols-2">
      {/* =====================================================
          BRANDING
      ====================================================== */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-12 text-white lg:flex">
        <div className="relative z-10 flex items-center gap-3">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
            <GraduationCap className="h-8 w-8" />
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

        <div className="relative z-10 my-auto max-w-md space-y-4">

          <h2 className="text-3xl font-extrabold leading-tight">
            Mulai Belajar Bersama
          </h2>

          <p className="text-sm leading-relaxed text-blue-100/80">
            Buat akun Study Buddy untuk
            menemukan teman belajar, bergabung
            dengan grup, berbagi materi, dan
            mengikuti sesi tutoring.
          </p>
        </div>

        <p className="relative z-10 text-xs text-blue-200/60">
          © 2026 Study Buddy Platform. All
          rights reserved.
        </p>

        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* =====================================================
          REGISTER FORM
      ====================================================== */}
      <div className="flex items-center justify-center bg-white p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Study Buddy
              </h1>

              <p className="text-[11px] font-medium text-blue-600">
                Learn Together, Grow Together
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Buat Akun Baru
            </h2>

            <p className="mt-1.5 text-sm text-slate-500">
              Mulai perjalanan belajar
              kolaboratif kamu hari ini.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
            >
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Name */}
            <div>
              <label
                htmlFor="register-name"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Nama Lengkap
              </label>

              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="register-name"
                  type="text"
                  required
                  autoComplete="name"
                  disabled={loading}
                  value={formData.name}
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,

                        name:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Nama lengkap Anda"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="register-email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Email
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="register-email"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={loading}
                  value={formData.email}
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,

                        email:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="example@email.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="register-password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="register-password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                  value={formData.password}
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,

                        password:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? 'Sembunyikan password'
                      : 'Tampilkan password'
                  }
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <p className="mt-1.5 text-[11px] text-slate-400">
                Gunakan minimal 8 karakter.
              </p>
            </div>

            {/* Confirmation */}
            <div>
              <label
                htmlFor="register-confirm-password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Konfirmasi Password
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="register-confirm-password"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                  value={
                    formData.password_confirmation
                  }
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,

                        password_confirmation:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Ulangi password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? 'Sembunyikan konfirmasi password'
                      : 'Tampilkan konfirmasi password'
                  }
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition hover:text-slate-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                  Mendaftarkan...
                </span>
              ) : (
                'Daftar Sekarang'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Sudah punya akun?{' '}

            <Link
              href="/login"
              className="font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}