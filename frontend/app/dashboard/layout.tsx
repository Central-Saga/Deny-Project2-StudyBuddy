'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);

  // Cek token & ambil data user dari localStorage
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user_data');

    if (!token) {
      router.push('/login');
      return;
    }

    if (savedUser) {
      try {
        setUserData(JSON.parse(savedUser));
      } catch (e) {
        console.error('Gagal membaca data user dari localStorage', e);
      }
    }
  }, [router]);

  // Fungsi Logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    router.push('/login');
  };

  // Daftar menu navigasi Sidebar
  const navItems = [
    { name: 'Beranda', href: '/dashboard', icon: Home },
    { name: 'Cari Buddy', href: '/dashboard/find-buddy', icon: Search },
    { name: 'Grup', href: '/dashboard/groups', icon: Users },
    { name: 'Kalender', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Materi', href: '/dashboard/materials', icon: BookOpen },
    { name: 'Kuis', href: '/dashboard/quizzes', icon: FileQuestion },
    { name: 'Peer Tutoring', href: '/dashboard/tutoring', icon: MessageSquare },
    { name: 'Notifikasi', href: '/dashboard/notifications', icon: Bell },
    { name: 'Profil', href: '/dashboard/profile', icon: User },
  ];

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC]">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 border-b border-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800 text-base leading-tight">
                  Study Buddy
                </h1>
                <p className="text-[10px] font-medium text-blue-600">
                  Learn Together, Grow Together
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-blue-700' : 'text-slate-400'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            suppressHydrationWarning
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* ================= KONTEN UTAMA & NAVBAR ================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
          {/* Search Bar */}
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Cari mata kuliah, grup, atau teman belajar..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border-none rounded-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <button
              suppressHydrationWarning
              className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* User Profile Dinamis */}
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-slate-800 leading-tight">
                  {userData?.name || 'Mahasiswa'}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Mahasiswa
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Area Render Halaman (Page Content) */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}