'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  usePathname,
  useRouter,
} from 'next/navigation';

import {
  parseUserDto,
  type UserDto,
} from '@/types/api';

import {
  GraduationCap,
  Home,
  Search,
  Users,
  Calendar,
  BookOpen,
  FileQuestion,
  MessageSquare,
  Bell,
  User,
  LogOut,
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

function clearAuthStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('access_token');
  localStorage.removeItem('meetspace_auth_token');
  localStorage.removeItem('user_data');
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const searchInputRef =
    useRef<HTMLInputElement | null>(null);

  // =========================================================
  // AUTH
  // =========================================================
  const [userData, setUserData] =
    useState<UserDto | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  // =========================================================
  // SIDEBAR
  // =========================================================
  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  const [
    desktopSidebarOpen,
    setDesktopSidebarOpen,
  ] = useState(true);

  // =========================================================
  // LOGOUT
  // =========================================================
  const [
    showLogoutModal,
    setShowLogoutModal,
  ] = useState(false);

  const [
    logoutLoading,
    setLogoutLoading,
  ] = useState(false);

  // =========================================================
  // SEARCH
  // =========================================================
  const [searchQuery, setSearchQuery] =
    useState('');

  const [
    searchFocused,
    setSearchFocused,
  ] = useState(false);

  // =========================================================
  // VERIFY AUTH
  // =========================================================
  useEffect(() => {
    let active = true;

    const checkAuthentication =
      async () => {
        const token = getStoredToken();

        if (!token) {
          clearAuthStorage();
          router.replace('/login');
          return;
        }

        // Sinkronkan token lama agar fitur yang
        // masih menggunakan meetspace_auth_token
        // tetap bekerja.
        localStorage.setItem(
          'access_token',
          token
        );

        localStorage.setItem(
          'meetspace_auth_token',
          token
        );

        // Tampilkan data lokal terlebih dahulu.
        const savedUser =
          localStorage.getItem(
            'user_data'
          );

        if (savedUser) {
          try {
            const parsedUser =
              parseUserDto(savedUser);

            if (
              parsedUser &&
              active
            ) {
              setUserData(
                parsedUser
              );
            }
          } catch (error) {
            console.error(
              'Gagal membaca user_data:',
              error
            );
          }
        }

        try {
          const response =
            await fetch(
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
              response.status ===
              401
            ) {
              clearAuthStorage();

              if (active) {
                setUserData(
                  null
                );
              }

              router.replace(
                '/login'
              );

              return;
            }

            throw new Error(
              'Gagal memverifikasi sesi pengguna.'
            );
          }

          const data =
            await response.json();

          if (data.user) {
            localStorage.setItem(
              'user_data',
              JSON.stringify(
                data.user
              )
            );

            const parsedUser =
              parseUserDto(
                JSON.stringify(
                  data.user
                )
              );

            if (
              parsedUser &&
              active
            ) {
              setUserData(
                parsedUser
              );
            }
          }
        } catch (error) {
          console.error(
            'Gagal memverifikasi sesi:',
            error
          );
        } finally {
          if (active) {
            setAuthLoading(
              false
            );
          }
        }
      };

    checkAuthentication();

    return () => {
      active = false;
    };
  }, [router]);

  // =========================================================
  // SYNC USER DATA AFTER PROFILE UPDATE
  // =========================================================
  useEffect(() => {
    const syncUserData = () => {
      const savedUser =
        localStorage.getItem('user_data');

      if (!savedUser) {
        return;
      }

      const parsedUser =
        parseUserDto(savedUser);

      if (parsedUser) {
        setUserData(parsedUser);
      }
    };

    window.addEventListener(
      'user-data-updated',
      syncUserData
    );

    return () => {
      window.removeEventListener(
        'user-data-updated',
        syncUserData
      );
    };
  }, []);

  // =========================================================
  // CLOSE MOBILE SIDEBAR AFTER NAVIGATION
  // =========================================================
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // =========================================================
  // ESC KEY
  // =========================================================
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === 'Escape'
      ) {
        setMobileSidebarOpen(
          false
        );

        setShowLogoutModal(
          false
        );

        setSearchFocused(
          false
        );

        searchInputRef.current?.blur();
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, []);

  // =========================================================
  // LOCK BODY ONLY FOR MOBILE SIDEBAR / MODAL
  // =========================================================
  useEffect(() => {
    if (
      mobileSidebarOpen ||
      showLogoutModal
    ) {
      document.body.style.overflow =
        'hidden';
    } else {
      document.body.style.overflow =
        '';
    }

    return () => {
      document.body.style.overflow =
        '';
    };
  }, [
    mobileSidebarOpen,
    showLogoutModal,
  ]);

  // =========================================================
  // LOGOUT
  // =========================================================
  const handleLogout =
    async () => {
      const token =
        getStoredToken();

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

        setUserData(null);

        setLogoutLoading(
          false
        );

        setShowLogoutModal(
          false
        );

        setMobileSidebarOpen(
          false
        );

        router.replace(
          '/login'
        );
      }
    };

  // =========================================================
  // NAVIGATION
  // =========================================================
  const navItems = [
    {
      name: 'Beranda',
      href: '/dashboard',
      icon: Home,
    },

    {
      name: 'Cari Buddy',
      href:
        '/dashboard/find-buddy',
      icon: Search,
    },

    {
      name: 'Grup',
      href:
        '/dashboard/groups',
      icon: Users,
    },

    {
      name: 'Kalender',
      href:
        '/dashboard/calendar',
      icon: Calendar,
    },

    {
      name: 'Materi',
      href:
        '/dashboard/materials',
      icon: BookOpen,
    },

    {
      name: 'Kuis',
      href:
        '/dashboard/quizzes',
      icon: FileQuestion,
    },

    {
      name: 'Peer Tutoring',
      href:
        '/dashboard/tutoring',
      icon: MessageSquare,
    },

    {
      name: 'Notifikasi',
      href:
        '/dashboard/notifications',
      icon: Bell,
    },

    {
      name: 'Profil',
      href:
        '/dashboard/profile',
      icon: User,
    },
  ];

  // =========================================================
  // SEARCH DATA
  // =========================================================
  const searchableItems = [
    {
      name: 'Beranda',

      description:
        'Kembali ke halaman utama dashboard',

      href: '/dashboard',

      icon: Home,

      keywords: [
        'beranda',
        'dashboard',
        'home',
        'utama',
      ],
    },

    {
      name: 'Cari Buddy',

      description:
        'Temukan teman belajar',

      href:
        '/dashboard/find-buddy',

      icon: Search,

      keywords: [
        'buddy',
        'teman',
        'teman belajar',
        'mahasiswa',
        'partner',
      ],
    },

    {
      name: 'Grup Belajar',

      description:
        'Lihat dan kelola grup belajar',

      href:
        '/dashboard/groups',

      icon: Users,

      keywords: [
        'grup',
        'group',
        'kelompok',
        'komunitas',
        'diskusi',
      ],
    },

    {
      name: 'Kalender',

      description:
        'Lihat jadwal dan agenda belajar',

      href:
        '/dashboard/calendar',

      icon: Calendar,

      keywords: [
        'kalender',
        'jadwal',
        'agenda',
        'schedule',
        'sesi',
        'tanggal',
      ],
    },

    {
      name: 'Materi',

      description:
        'Temukan materi belajar',

      href:
        '/dashboard/materials',

      icon: BookOpen,

      keywords: [
        'materi',
        'mata kuliah',
        'modul',
        'dokumen',
        'file',
        'pdf',
      ],
    },

    {
      name: 'Kuis',

      description:
        'Kerjakan dan kelola kuis',

      href:
        '/dashboard/quizzes',

      icon: FileQuestion,

      keywords: [
        'kuis',
        'quiz',
        'soal',
        'latihan',
        'ujian',
      ],
    },

    {
      name: 'Peer Tutoring',

      description:
        'Cari tutor dan sesi tutoring',

      href:
        '/dashboard/tutoring',

      icon: MessageSquare,

      keywords: [
        'tutor',
        'tutoring',
        'mentor',
        'bimbingan',
      ],
    },

    {
      name: 'Notifikasi',

      description:
        'Lihat pemberitahuan terbaru',

      href:
        '/dashboard/notifications',

      icon: Bell,

      keywords: [
        'notifikasi',
        'notification',
        'pemberitahuan',
        'pesan',
      ],
    },

    {
      name: 'Profil',

      description:
        'Lihat dan ubah data profil',

      href:
        '/dashboard/profile',

      icon: User,

      keywords: [
        'profil',
        'profile',
        'akun',
        'mahasiswa',
        'biodata',
      ],
    },
  ];

  // =========================================================
  // FILTER SEARCH
  // =========================================================
  const filteredSearchItems =
    searchQuery.trim()
      ? searchableItems.filter(
          (item) => {
            const query =
              searchQuery
                .toLowerCase()
                .trim();

            return (
              item.name
                .toLowerCase()
                .includes(
                  query
                ) ||
              item.description
                .toLowerCase()
                .includes(
                  query
                ) ||
              item.keywords.some(
                (keyword) =>
                  keyword
                    .toLowerCase()
                    .includes(
                      query
                    )
              )
            );
          }
        )
      : [];

  // =========================================================
  // ACTIVE SIDEBAR ITEM
  // =========================================================
  const getIsActive = (
    href: string
  ) => {
    if (
      href === '/dashboard'
    ) {
      return (
        pathname === href
      );
    }

    return pathname.startsWith(
      href
    );
  };

  // =========================================================
  // SEARCH NAVIGATION
  // =========================================================
  const openSearchResult = (
    href: string
  ) => {
    setSearchQuery('');
    setSearchFocused(false);

    // Penting:
    // input harus kehilangan fokus agar
    // onFocus bekerja kembali ketika
    // user menggunakan search berikutnya.
    searchInputRef.current?.blur();

    router.push(href);
  };

  // =========================================================
  // AUTH LOADING
  // =========================================================
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center overflow-hidden bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-11 w-11">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />

            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              Menyiapkan
              Study Buddy
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Memverifikasi
              sesi Anda...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    // =======================================================
    // h-screen + overflow-hidden
    //
    // Ini membuat seluruh dashboard diam.
    // Hanya area page content yang nanti
    // memiliki overflow-y-auto.
    // =======================================================
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}
      <div
        onClick={() =>
          setMobileSidebarOpen(
            false
          )
        }
        className={`
          fixed inset-0 z-40
          bg-slate-950/40
          backdrop-blur-sm
          transition-opacity
          duration-300
          lg:hidden

          ${
            mobileSidebarOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          }
        `}
      />

      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside
        className={`
          fixed inset-y-0 left-0
          z-50

          flex h-screen
          w-[250px]
          flex-col
          justify-between

          overflow-hidden

          border-r
          border-slate-200
          bg-white

          shadow-xl
          shadow-slate-900/5

          transition-all
          duration-300
          ease-in-out

          ${
            mobileSidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }

          lg:static
          lg:z-auto
          lg:translate-x-0
          lg:shadow-none

          ${
            desktopSidebarOpen
              ? 'lg:w-[250px] lg:border-r'
              : 'lg:w-0 lg:border-r-0'
          }
        `}
      >
        {/* ===================================================
            SIDEBAR TOP
        ==================================================== */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* ===============================================
              LOGO
          ================================================ */}
          <div className="flex h-[68px] flex-shrink-0 items-center justify-between border-b border-slate-100 px-4">
            <Link
              href="/dashboard"
              className="flex min-w-[210px] items-center gap-2.5"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-500/20">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-sm font-bold leading-tight text-slate-800">
                  Study Buddy
                </h1>

                <p className="text-[9px] font-medium text-blue-600">
                  Learn Together,
                  Grow Together
                </p>
              </div>
            </Link>

            {/* Mobile sidebar close */}
            <button
              type="button"
              aria-label="Tutup sidebar"
              onClick={() =>
                setMobileSidebarOpen(
                  false
                )
              }
              className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 lg:hidden"
            >
              <div className="relative h-4 w-5">
                <span className="absolute left-0 top-1/2 h-[2px] w-5 -translate-y-1/2 rotate-45 rounded-full bg-current" />

                <span className="absolute left-0 top-1/2 h-[2px] w-5 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
              </div>
            </button>
          </div>

          {/* ===============================================
              MENU
          ================================================ */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Menu Utama
            </p>

            {navItems.map(
              (item) => {
                const isActive =
                  getIsActive(
                    item.href
                  );

                const Icon =
                  item.icon;

                return (
                  <Link
                    key={
                      item.name
                    }
                    href={
                      item.href
                    }
                    className={`
                      group
                      flex items-center
                      gap-2.5

                      rounded-xl
                      px-3 py-2.5

                      text-[13px]

                      transition-all
                      duration-200

                      ${
                        isActive
                          ? 'bg-blue-50 font-semibold text-blue-700'
                          : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <div
                      className={`
                        flex h-7 w-7
                        flex-shrink-0
                        items-center
                        justify-center

                        rounded-lg

                        ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-slate-400 group-hover:text-slate-600'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <span className="whitespace-nowrap">
                      {
                        item.name
                      }
                    </span>

                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                    )}
                  </Link>
                );
              }
            )}
          </nav>
        </div>

        {/* ===================================================
            LOGOUT
        ==================================================== */}
        <div className="flex-shrink-0 border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={() =>
              setShowLogoutModal(
                true
              )
            }
            className="flex w-full min-w-[210px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
              <LogOut className="h-4 w-4 text-red-500" />
            </div>

            Keluar Akun
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ====================================================== */}
      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {/* ===================================================
            HEADER
        ==================================================== */}
        <header className="relative z-30 flex h-[68px] flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-5 lg:px-6">
          {/* =================================================
              LEFT
          ================================================== */}
          <div className="flex min-w-0 items-center gap-3">
            {/* ===============================================
                MOBILE HAMBURGER
            ================================================ */}
            <button
              type="button"
              aria-label={
                mobileSidebarOpen
                  ? 'Tutup menu'
                  : 'Buka menu'
              }
              aria-expanded={
                mobileSidebarOpen
              }
              onClick={() =>
                setMobileSidebarOpen(
                  (previous) =>
                    !previous
                )
              }
              className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
            >
              <div className="relative h-4 w-5">
                <span
                  className={`
                    absolute left-0
                    h-[2px]
                    rounded-full
                    bg-current
                    transition-all
                    duration-300

                    ${
                      mobileSidebarOpen
                        ? 'top-[7px] w-5 rotate-45'
                        : 'top-0 w-5'
                    }
                  `}
                />

                <span
                  className={`
                    absolute left-0
                    top-[7px]
                    h-[2px]
                    rounded-full
                    bg-current
                    transition-all
                    duration-200

                    ${
                      mobileSidebarOpen
                        ? 'w-0 opacity-0'
                        : 'w-4 opacity-100'
                    }
                  `}
                />

                <span
                  className={`
                    absolute left-0
                    h-[2px]
                    rounded-full
                    bg-current
                    transition-all
                    duration-300

                    ${
                      mobileSidebarOpen
                        ? 'top-[7px] w-5 -rotate-45'
                        : 'top-[14px] w-3.5'
                    }
                  `}
                />
              </div>
            </button>

            {/* ===============================================
                DESKTOP HAMBURGER
            ================================================ */}
            <button
              type="button"
              aria-label={
                desktopSidebarOpen
                  ? 'Tutup sidebar'
                  : 'Buka sidebar'
              }
              aria-expanded={
                desktopSidebarOpen
              }
              onClick={() =>
                setDesktopSidebarOpen(
                  (previous) =>
                    !previous
                )
              }
              className="relative hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 lg:flex"
            >
              <div className="relative h-4 w-5">
                <span
                  className={`
                    absolute left-0
                    h-[2px]
                    rounded-full
                    bg-current
                    transition-all
                    duration-300

                    ${
                      desktopSidebarOpen
                        ? 'top-[7px] w-5 rotate-45'
                        : 'top-0 w-5'
                    }
                  `}
                />

                <span
                  className={`
                    absolute left-0
                    top-[7px]
                    h-[2px]
                    rounded-full
                    bg-current
                    transition-all
                    duration-200

                    ${
                      desktopSidebarOpen
                        ? 'w-0 opacity-0'
                        : 'w-4 opacity-100'
                    }
                  `}
                />

                <span
                  className={`
                    absolute left-0
                    h-[2px]
                    rounded-full
                    bg-current
                    transition-all
                    duration-300

                    ${
                      desktopSidebarOpen
                        ? 'top-[7px] w-5 -rotate-45'
                        : 'top-[14px] w-3.5'
                    }
                  `}
                />
              </div>
            </button>

            {/* ===============================================
                GLOBAL SEARCH
            ================================================ */}
            <div className="relative hidden w-60 md:block xl:w-72">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                <input
                  ref={
                    searchInputRef
                  }
                  type="text"
                  value={
                    searchQuery
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchQuery(
                      event.target
                        .value
                    )
                  }
                  onFocus={() =>
                    setSearchFocused(
                      true
                    )
                  }
                  onBlur={() => {
                    window.setTimeout(
                      () => {
                        setSearchFocused(
                          false
                        );
                      },
                      120
                    );
                  }}
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                        'Enter' &&
                      filteredSearchItems.length >
                        0
                    ) {
                      openSearchResult(
                        filteredSearchItems[0]
                          .href
                      );
                    }

                    if (
                      event.key ===
                      'Escape'
                    ) {
                      setSearchQuery(
                        ''
                      );

                      setSearchFocused(
                        false
                      );

                      searchInputRef.current?.blur();
                    }
                  }}
                  placeholder="Cari fitur, grup, materi..."
                  className="w-full rounded-full border border-transparent bg-slate-100 py-2 pl-9 pr-9 text-xs text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />

                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Hapus pencarian"
                    onMouseDown={(
                      event
                    ) =>
                      event.preventDefault()
                    }
                    onClick={() => {
                      setSearchQuery(
                        ''
                      );

                      setSearchFocused(
                        true
                      );

                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-xs text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* =============================================
                  SEARCH RESULTS
              ============================================== */}
              {searchFocused &&
                searchQuery.trim() && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                    <div className="border-b border-slate-100 px-3.5 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Hasil Pencarian
                      </p>
                    </div>

                    {filteredSearchItems.length >
                    0 ? (
                      <div className="max-h-72 overflow-y-auto p-1.5">
                        {filteredSearchItems.map(
                          (
                            item
                          ) => {
                            const Icon =
                              item.icon;

                            return (
                              <button
                                key={
                                  item.href
                                }
                                type="button"

                                // Jangan preventDefault di sini.
                                // Input harus boleh kehilangan
                                // fokus setelah memilih hasil.
                                onClick={() =>
                                  openSearchResult(
                                    item.href
                                  )
                                }
                                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-blue-50"
                              >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                  <Icon className="h-4 w-4" />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-slate-800">
                                    {
                                      item.name
                                    }
                                  </p>

                                  <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                    {
                                      item.description
                                    }
                                  </p>
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <Search className="mx-auto h-6 w-6 text-slate-300" />

                        <p className="mt-2 text-xs font-semibold text-slate-600">
                          Tidak ditemukan
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Coba kata
                          kunci lain.
                        </p>
                      </div>
                    )}

                    {filteredSearchItems.length >
                      0 && (
                      <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
                        <p className="text-[9px] text-slate-400">
                          Tekan Enter
                          untuk membuka
                          hasil pertama
                        </p>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* ===============================================
                MOBILE BRAND
            ================================================ */}
            <div className="min-w-0 md:hidden">
              <p className="truncate text-xs font-bold text-slate-800">
                Study Buddy
              </p>

              <p className="truncate text-[9px] text-slate-400">
                Student Platform
              </p>
            </div>
          </div>

          {/* =================================================
              RIGHT
          ================================================== */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* ===============================================
                NOTIFICATIONS
            ================================================ */}
            <button
              type="button"
              aria-label="Buka notifikasi"
              onClick={() =>
                router.push(
                  '/dashboard/notifications'
                )
              }
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <Bell className="h-[18px] w-[18px]" />

              <span className="absolute right-[7px] top-[7px] h-2 w-2 rounded-full border-2 border-white bg-red-500" />
            </button>

            {/* ===============================================
                PROFILE
            ================================================ */}
            <button
              type="button"
              onClick={() =>
                router.push(
                  '/dashboard/profile'
                )
              }
              className="flex items-center gap-2.5 rounded-xl p-1 transition hover:bg-slate-50 sm:pl-3"
            >
              <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm shadow-blue-500/20">
                {userData?.profile?.avatar_url ? (
                  <Image
                    src={userData.profile.avatar_url}
                    alt={`Foto profil ${userData.name}`}
                    fill
                    sizes="36px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  userData?.name
                    ? userData.name
                        .charAt(0)
                        .toUpperCase()
                    : 'U'
                )}
              </div>

              <div className="hidden max-w-[145px] text-left sm:block">
                <p className="truncate text-xs font-bold leading-tight text-slate-800">
                  {userData?.name ||
                    'Mahasiswa'}
                </p>

                <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                  Mahasiswa
                </p>
              </div>
            </button>
          </div>
        </header>

        {/* ===================================================
            SCROLLABLE PAGE CONTENT
        ==================================================== */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-5 lg:p-6">
            {children}
          </div>
        </div>
      </main>

      {/* =====================================================
          LOGOUT MODAL
      ====================================================== */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowLogoutModal(
                false
              );
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-red-50">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Keluar dari
                  akun?
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Apakah Anda yakin
                  ingin keluar dari
                  Study Buddy? Anda
                  harus masuk kembali
                  untuk mengakses
                  dashboard.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={
                  logoutLoading
                }
                onClick={() =>
                  setShowLogoutModal(
                    false
                  )
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={
                  logoutLoading
                }
                onClick={
                  handleLogout
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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