'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  usePathname,
  useRouter,
} from 'next/navigation';

import {
  BadgeCheck,
  FileQuestion,
  FileWarning,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  UsersRound,
  X,
} from 'lucide-react';

import {
  parseUserDto,
  type UserDto,
} from '@/types/api';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  '/api/v1'
).replace(/\/$/, '');

function getStoredToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem(
      'meetspace_auth_token'
    ) ||
    ''
  );
}

function clearAuthStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('access_token');
  localStorage.removeItem(
    'meetspace_auth_token'
  );
  localStorage.removeItem('user_data');
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] =
    useState<UserDto | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  const [
    desktopSidebarCollapsed,
    setDesktopSidebarCollapsed,
  ] = useState(false);

  const [
    logoutLoading,
    setLogoutLoading,
  ] = useState(false);

  const [
    showLogoutModal,
    setShowLogoutModal,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    const verifyAdmin = async () => {
      const token = getStoredToken();

      if (!token) {
        clearAuthStorage();
        router.replace('/login');
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

        if (!response.ok) {
          if (
            response.status === 401 ||
            response.status === 403
          ) {
            clearAuthStorage();
            router.replace('/login');
            return;
          }

          throw new Error(
            'Gagal memverifikasi akun admin.'
          );
        }

        const payload =
          await response.json();

        const parsedUser =
          parseUserDto(
            JSON.stringify(
              payload.user
            )
          );

        if (!parsedUser) {
          clearAuthStorage();
          router.replace('/login');
          return;
        }

        if (
          parsedUser.role !== 'admin'
        ) {
          router.replace(
            '/dashboard'
          );
          return;
        }

        localStorage.setItem(
          'user_data',
          JSON.stringify(parsedUser)
        );

        localStorage.setItem(
          'access_token',
          token
        );

        localStorage.setItem(
          'meetspace_auth_token',
          token
        );

        if (active) {
          setUser(parsedUser);
          setAuthLoading(false);
        }
      } catch (error) {
        console.error(
          'Gagal memverifikasi admin:',
          error
        );

        if (active) {
          clearAuthStorage();
          router.replace('/login');
        }
      }
    };

    void verifyAdmin();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const token = getStoredToken();

    setLogoutLoading(true);

    try {
      if (token) {
        await fetch(
          `${API_URL}/logout`,
          {
            method: 'POST',
            headers: {
              Accept:
                'application/json',
              Authorization:
                `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error(
        'Gagal logout dari server:',
        error
      );
    } finally {
      clearAuthStorage();

      setUser(null);
      setLogoutLoading(false);
      setShowLogoutModal(false);

      router.replace('/login');
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      name: 'Study Groups',
      href: '/admin/groups',
      icon: UsersRound,
    },
    {
      name: 'Quiz Management',
      href: '/admin/quizzes',
      icon: FileQuestion,
    },
    {
      name: 'Tutor Verification',
      href: '/admin/tutors',
      icon: BadgeCheck,
    },
    {
      name: 'Material Reports',
      href: '/admin/reports',
      icon: FileWarning,
    },
  ];

  const isActive = (
    href: string
  ): boolean => {
    if (href === '/admin') {
      return pathname === '/admin';
    }

    return pathname.startsWith(href);
  };

  const currentPage = useMemo(() => {
    const match = navItems.find(
      (item) =>
        isActive(item.href)
    );

    return (
      match?.name ||
      'Admin Dashboard'
    );
  }, [pathname]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              Menyiapkan Admin Panel
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Memverifikasi akses
              administrator...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Tutup sidebar"
          onClick={() =>
            setMobileSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex flex-col
          border-r border-slate-200
          bg-white
          transition-all duration-300
          lg:static lg:translate-x-0

          ${
            desktopSidebarCollapsed
              ? 'lg:w-[88px]'
              : 'lg:w-[260px]'
          }

          w-[260px]

          ${
            mobileSidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >
        <div
          className={`flex h-[68px] items-center border-b border-slate-100 ${
            desktopSidebarCollapsed
              ? 'lg:justify-center lg:px-2'
              : 'justify-between px-4'
          }`}
        >
          <Link
            href="/admin"
            className={`flex items-center gap-3 ${
              desktopSidebarCollapsed
                ? 'lg:justify-center'
                : ''
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>

            <div
              className={
                desktopSidebarCollapsed
                  ? 'lg:hidden'
                  : ''
              }
            >
              <p className="text-sm font-bold text-slate-900">
                Study Buddy
              </p>

              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-blue-600">
                <ShieldCheck className="h-3 w-3" />
                Admin Panel
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() =>
              setMobileSidebarOpen(false)
            }
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav
          className={`flex-1 space-y-1 overflow-y-auto ${
            desktopSidebarCollapsed
              ? 'lg:px-3'
              : 'p-3'
          } p-3`}
        >
          <p
            className={`mb-3 px-3 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 ${
              desktopSidebarCollapsed
                ? 'lg:hidden'
                : ''
            }`}
          >
            Administrasi
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const activeItem =
              isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={
                  desktopSidebarCollapsed
                    ? item.name
                    : undefined
                }
                className={`
                  flex items-center
                  rounded-xl
                  text-sm transition

                  ${
                    desktopSidebarCollapsed
                      ? 'lg:justify-center lg:px-2'
                      : 'gap-3 px-3'
                  }

                  py-2.5

                  ${
                    activeItem
                      ? 'bg-blue-50 font-semibold text-blue-700'
                      : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <div
                  className={`
                    flex h-8 w-8 shrink-0
                    items-center justify-center
                    rounded-lg

                    ${
                      activeItem
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-400'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <span
                  className={
                    desktopSidebarCollapsed
                      ? 'lg:hidden'
                      : ''
                  }
                >
                  {item.name}
                </span>

                {activeItem &&
                  !desktopSidebarCollapsed && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                  )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div
            className={`mb-2 flex items-center rounded-xl bg-slate-50 p-3 ${
              desktopSidebarCollapsed
                ? 'lg:justify-center'
                : 'gap-3'
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {user?.name
                ?.charAt(0)
                .toUpperCase() ||
                'A'}
            </div>

            <div
              className={`min-w-0 ${
                desktopSidebarCollapsed
                  ? 'lg:hidden'
                  : ''
              }`}
            >
              <p className="truncate text-xs font-bold text-slate-800">
                {user?.name ||
                  'Administrator'}
              </p>

              <p className="truncate text-[10px] text-slate-400">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            title={
              desktopSidebarCollapsed
                ? 'Keluar'
                : undefined
            }
            onClick={() =>
              setShowLogoutModal(true)
            }
            className={`flex w-full items-center rounded-xl py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 ${
              desktopSidebarCollapsed
                ? 'lg:justify-center lg:px-2'
                : 'gap-3 px-3'
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />

            <span
              className={
                desktopSidebarCollapsed
                  ? 'lg:hidden'
                  : ''
              }
            >
              Keluar
            </span>
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Toggle sidebar"
              onClick={() => {
                if (
                  window.matchMedia(
                    '(min-width: 1024px)'
                  ).matches
                ) {
                  setDesktopSidebarCollapsed(
                    (current) =>
                      !current
                  );
                } else {
                  setMobileSidebarOpen(
                    true
                  );
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div>
              <p className="text-sm font-bold text-slate-900">
                {currentPage}
              </p>

              <p className="text-[10px] text-slate-400">
                Study Buddy Management
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Administrator
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
            {children}
          </div>
        </div>
      </main>

      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowLogoutModal(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Keluar dari Admin Panel?
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Anda harus login kembali
                  untuk mengakses halaman
                  administrator.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={logoutLoading}
                onClick={() =>
                  setShowLogoutModal(
                    false
                  )
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={logoutLoading}
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {logoutLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Keluar...
                  </>
                ) : (
                  <>
                    <LogOut className="h-3.5 w-3.5" />
                    Ya, Keluar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}