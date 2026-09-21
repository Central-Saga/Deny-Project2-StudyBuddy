"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  GraduationCap,
  Home,
  Users,
  Calendar,
  BookOpen,
  Award,
  UserCheck,
  Bell,
  User,
  LogOut,
  UserPlus,
  MessageCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Buddy {
  id: number;
  name: string;
  email: string;
  course?: string;
  skills?: string[];
  bio?: string;
}

export default function FindBuddyPage() {
  const router = useRouter();
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("Semua");
  const [invitedBuddies, setInvitedBuddies] = useState<number[]>([]);

  // Fetch Data Buddies dari API Laravel
  useEffect(() => {
    const fetchBuddies = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append("search", searchTerm);
        if (selectedCourse !== "Semua") queryParams.append("course", selectedCourse);

        const res = await fetch(`http://localhost:8000/api/buddies?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("access_token");
          router.push("/login");
          return;
        }

        const data = await res.json();
        setBuddies(data);
      } catch (err) {
        console.error("Gagal mengambil data buddy:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchBuddies();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCourse, router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_data");
    router.push("/login");
  };

  const handleInvite = (id: number) => {
    if (invitedBuddies.includes(id)) {
      setInvitedBuddies(invitedBuddies.filter((item) => item !== id));
    } else {
      setInvitedBuddies([...invitedBuddies, id]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex sticky top-0 h-screen">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-100">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-900 tracking-tight">Study Buddy</h1>
              <p className="text-[10px] text-blue-600 font-medium -mt-1">Learn Together, Grow Together</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <a href="/dashboard" className="flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
              <Home className="w-4 h-4" /> Beranda
            </a>
            <a href="/dashboard/find-buddy" className="flex items-center gap-3 px-3.5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm">
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

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors">
            <LogOut className="w-4 h-4" /> Keluar Akun
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-base font-bold text-slate-800">Cari Teman Belajar (Study Buddy)</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              A
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-6 max-w-7xl">
          {/* SEARCH & FILTER BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama atau mata kuliah..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Semua">Mata Kuliah: Semua</option>
                <option value="Basis Data">Basis Data</option>
                <option value="Pemrograman Web">Pemrograman Web</option>
                <option value="Kecerdasan Buatan">Kecerdasan Buatan</option>
              </select>
            </div>
          </div>

          {/* LOADING STATE */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-xs text-slate-500 font-medium">Memuat data dari database...</p>
            </div>
          ) : (
            /* LIST BUDDIES GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {buddies.map((buddy) => {
                const isInvited = invitedBuddies.includes(buddy.id);
                return (
                  <div key={buddy.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                            {buddy.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">{buddy.name}</h3>
                            <p className="text-[11px] text-slate-400">{buddy.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                        <div className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md text-[10px]">
                          Matkul: {buddy.course || "Belum diatur"}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                          "{buddy.bio || "Belum ada bio."}"
                        </p>
                      </div>

                      {buddy.skills && buddy.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {buddy.skills.map((skill) => (
                            <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium">
                              #{skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleInvite(buddy.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          isInvited
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        }`}
                      >
                        {isInvited ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Undangan Terkirim
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" /> Ajak Belajar
                          </>
                        )}
                      </button>

                      <button className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && buddies.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500 text-sm font-medium">Tidak ada pengguna lain yang ditemukan di database.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}