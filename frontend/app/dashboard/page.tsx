"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Home,
  LogOut,
  MessageSquare,
  Bell,
  Search,
  UserCheck,
  Users,
  Award,
  HelpCircle,
  Plus,
  User,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil data user dari localStorage
    const savedUser = localStorage.getItem("user_data");
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login"); // Tendang ke login jika tidak ada token
      return;
    }

    if (savedUser) {
      setUserData(JSON.parse(savedUser));
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_data");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium">Memuat Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* 1. SIDEBAR LEFT NAVIGATION */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex sticky top-0 h-screen">
        <div>
          {/* Logo Brand */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-100">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-900 tracking-tight">Study Buddy</h1>
              <p className="text-[10px] text-blue-600 font-medium -mt-1">Learn Together, Grow Together</p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1">
            <a href="/dashboard" className="flex items-center gap-3 px-3.5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm">
              <Home className="w-4 h-4" /> Beranda
            </a>
            <a href="/dashboard/find-buddy" className="flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
              <Search className="w-4 h-4" /> Cari Buddy
            </a>
            <a href="/dashboard/groups" className="flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
              <Users className="w-4 h-4" /> Grup
            </a>
            <a href="/dashboard/calendar" className="flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
              <Calendar className="w-4 h-4" /> Kalender
            </a>
            <a href="/dashboard/materials" className="flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
              <BookOpen className="w-4 h-4" /> Materi
            </a>
            <a href="/dashboard/quizzes" className="flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
              <Award className="w-4 h-4" /> Kuis
            </a>
            <a href="/dashboard/tutoring" className="flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
              <UserCheck className="w-4 h-4" /> Peer Tutoring
            </a>
            <a href="/dashboard/notifications" className="flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
              <Bell className="w-4 h-4" /> Notifikasi
            </a>
            <a href="/dashboard/profile" className="flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
              <User className="w-4 h-4" /> Profil
            </a>
          </nav>
        </div>

        {/* User Footer / Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" /> Keluar Akun
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="relative w-72 md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari mata kuliah, grup, atau teman belajar..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{userData?.name || "Mahasiswa"}</p>
                <p className="text-[10px] text-slate-400">Mahasiswa</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl">
          {/* Greeting Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Halo, {userData?.name || "Andi"} 👋</h2>
              <p className="text-xs text-blue-100 mt-1">Semangat belajar hari ini! Siapkan dirimu untuk sesi belajar berikutnya.</p>
            </div>
          </div>

          {/* Quick Actions / Shortcut Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all cursor-pointer group">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Cari Study Buddy</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Temukan teman satu matkul</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all cursor-pointer group">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Grup Belajar</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Gabung atau buat grup baru</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all cursor-pointer group">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-xl group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Jadwalkan Sesi</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Atur jadwal diskusi bersama</p>
              </div>
            </div>
          </div>

          {/* Sesi Mendatang Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Sesi Mendatang</h3>
              <a href="#" className="text-xs font-semibold text-blue-600 hover:underline">Lihat semua</a>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Review Database</h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Sen, 21 Sep</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 19:00 - 21:00</span>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-xs font-semibold">Lihat Sesi</span>
            </div>
          </div>

          {/* Grup Saya Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Grup Saya</h3>
              <a href="#" className="text-xs font-semibold text-blue-600 hover:underline">Lihat semua</a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                  DB
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Database Study Squad</h4>
                <p className="text-[11px] text-slate-400">4/6 anggota • Basis Data</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  WEB
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Web Programming Group</h4>
                <p className="text-[11px] text-slate-400">3/5 anggota • Pemrograman Web</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <h4 className="font-bold text-slate-800 text-sm">AI Discussion</h4>
                <p className="text-[11px] text-slate-400">2/5 anggota • Kecerdasan Buatan</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}