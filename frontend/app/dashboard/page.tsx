"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Clock,
  Search,
  Users,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-slate-500 font-medium">Memuat Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Halo, {userData?.name || "Mahasiswa"} 👋</h2>
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
  );
}