'use client';

import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Users,
  MapPin,
  X,
  GraduationCap,
  Home,
  Search,
  BookOpen,
  Award,
  UserCheck,
  Bell,
  User,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Event {
  id: number;
  title: string;
  course: string;
  date: string;
  time: string;
  location: string;
  type: 'session' | 'quiz' | 'group';
  attendeesCount?: number;
}

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      title: 'Sesi Belajar Pemrograman Web',
      course: 'Pemrograman Web',
      date: '2026-09-22',
      time: '19:00 - 21:00 WITA',
      location: 'Google Meet',
      type: 'session',
      attendeesCount: 4,
    },
    {
      id: 2,
      title: 'Kuis Basis Data - SQL Joins',
      course: 'Basis Data',
      date: '2026-09-24',
      time: '10:00 WITA',
      location: 'Ruang D.2.1 / Online',
      type: 'quiz',
    },
    {
      id: 3,
      title: 'Diskusi Kelompok AI & Machine Learning',
      course: 'Kecerdasan Buatan',
      date: '2026-09-25',
      time: '14:00 - 16:00 WITA',
      location: 'Perpustakaan Lt. 2',
      type: 'group',
      attendeesCount: 5,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    course: 'Pemrograman Web',
    date: '',
    time: '',
    location: '',
    type: 'session' as 'session' | 'quiz' | 'group',
  });

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    router.push('/login');
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.time) return;

    const newEvent: Event = {
      id: Date.now(),
      title: formData.title,
      course: formData.course,
      date: formData.date,
      time: formData.time,
      location: formData.location || 'Online',
      type: formData.type,
      attendeesCount: formData.type === 'quiz' ? undefined : 1,
    };

    setEvents([...events, newEvent]);
    setIsModalOpen(false);
    setFormData({
      title: '',
      course: 'Pemrograman Web',
      date: '',
      time: '',
      location: '',
      type: 'session',
    });
  };

  const getTypeBadge = (type: Event['type']) => {
    switch (type) {
      case 'session':
        return <span className="bg-blue-50 text-blue-700 font-semibold text-[10px] px-2.5 py-0.5 rounded-md">Sesi Belajar</span>;
      case 'quiz':
        return <span className="bg-amber-50 text-amber-700 font-semibold text-[10px] px-2.5 py-0.5 rounded-md">Kuis / Ujian</span>;
      case 'group':
        return <span className="bg-emerald-50 text-emerald-700 font-semibold text-[10px] px-2.5 py-0.5 rounded-md">Kelompok Belajar</span>;
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
            <a href="/dashboard/calendar" className="flex items-center gap-3 px-3.5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm">
              <CalendarIcon className="w-4 h-4" /> Kalender
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
          <h2 className="text-base font-bold text-slate-800">Kalender & Jadwal Belajar</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Jadwal
          </button>
        </header>

        <div className="p-6 md:p-8 space-y-6 max-w-7xl">
          {/* Grid Konten Sejajar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Kolom Kiri: Ringkasan Status */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 h-5">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span>Ringkasan Minggu Ini</span>
              </h3>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="p-3 bg-blue-50/60 rounded-xl flex items-center justify-between border border-blue-100">
                  <span className="text-xs font-medium text-slate-700">Total Agenda</span>
                  <span className="text-base font-bold text-blue-600">{events.length}</span>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl flex items-center justify-between border border-emerald-100">
                  <span className="text-xs font-medium text-slate-700">Sesi Kelompok</span>
                  <span className="text-base font-bold text-emerald-600">
                    {events.filter((e) => e.type === 'group' || e.type === 'session').length}
                  </span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl flex items-center justify-between border border-amber-100">
                  <span className="text-xs font-medium text-slate-700">Kuis & Tugas</span>
                  <span className="text-base font-bold text-amber-600">
                    {events.filter((e) => e.type === 'quiz').length}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-5 rounded-2xl shadow-sm space-y-2">
                <h3 className="font-bold text-sm">Tip Belajar! 💡</h3>
                <p className="text-blue-100 text-xs leading-relaxed">
                  Jadwalkan sesi belajar rutin 2-3 kali seminggu bersama Study Buddy kamu untuk meningkatkan pemahaman materi kuis!
                </p>
              </div>
            </div>

            {/* Kolom Kanan: Daftar Agenda Upcoming */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center h-5">
                Agenda Mendatang
              </h3>

              {events.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-slate-500 text-xs font-medium">Belum ada agenda belajar yang dijadwalkan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getTypeBadge(event.type)}
                          <span className="text-[10px] text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                            {event.course}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">{event.title}</h4>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>

                      {event.attendeesCount && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-center font-medium">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>{event.attendeesCount} Peserta</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Modal Tambah Jadwal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Tambah Agenda Belajar</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Judul Agenda</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Belajar Bersama Kuis 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Jenis Agenda</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="session">Sesi Belajar</option>
                  <option value="group">Kelompok Belajar</option>
                  <option value="quiz">Kuis / Ujian</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Mata Kuliah</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pemrograman Web">Pemrograman Web</option>
                  <option value="Basis Data">Basis Data</option>
                  <option value="Kecerdasan Buatan">Kecerdasan Buatan</option>
                  <option value="Jaringan Komputer">Jaringan Komputer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Waktu</label>
                  <input
                    type="text"
                    required
                    placeholder="19:00 WITA"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Lokasi / Link</label>
                <input
                  type="text"
                  placeholder="Google Meet / Ruang D.2.1"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}