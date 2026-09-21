"use client";

import { useState, useEffect } from "react";
import {
  User,
  GraduationCap,
  Home,
  Search,
  Users,
  Calendar,
  BookOpen,
  Award,
  UserCheck,
  Bell,
  LogOut,
  Save,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    course: "Basis Data",
    skills: "",
    bio: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("http://localhost:8000/api/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.ok) {
          const user = await res.json();
          setFormData({
            name: user.name || "",
            email: user.email || "",
            course: user.course || "Basis Data",
            skills: user.skills ? user.skills.join(", ") : "",
            bio: user.bio || "",
          });
        }
      } catch (err) {
        console.error("Gagal mengambil profil:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_data");
    router.push("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");

    const token = localStorage.getItem("access_token");

    // Ubah string skill terpisah koma menjadi array
    const skillsArray = formData.skills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const res = await fetch("http://localhost:8000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          course: formData.course,
          skills: skillsArray,
          bio: formData.bio,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Profil berhasil diperbarui!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Gagal memperbarui profil:", err);
    } finally {
      setSaving(false);
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
            <a href="/dashboard/profile" className="flex items-center gap-3 px-3.5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm">
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
          <h2 className="text-base font-bold text-slate-800">Pengaturan Profil</h2>
        </header>

        <div className="p-6 md:p-8 max-w-3xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-xs text-slate-500 font-medium">Memuat data profil...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  {successMsg}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Email (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Mata Kuliah Utama</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Basis Data">Basis Data</option>
                  <option value="Pemrograman Web">Pemrograman Web</option>
                  <option value="Kecerdasan Buatan">Kecerdasan Buatan</option>
                  <option value="Jaringan Komputer">Jaringan Komputer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Keahlian / Skill (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="Contoh: Python, SQL, React, Laravel"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Bio Singkat</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Ceritakan sedikit tentang minat belajar atau topik yang ingin kamu kuasai..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}