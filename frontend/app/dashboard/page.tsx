'use client';



import {

  useCallback,

  useEffect,

  useMemo,

  useState,

} from 'react';



import Link from 'next/link';

import { useRouter } from 'next/navigation';



import {

  parseUserDto,

  type UserDto,

} from '@/types/api';



import {

  AlertCircle,

  ArrowRight,

  BookOpen,

  Calendar,

  Clock,

  FileQuestion,

  GraduationCap,

  MessageSquare,

  RefreshCw,

  Search,

  Sparkles,

  Users,

} from 'lucide-react';



const API_URL = (

  process.env.NEXT_PUBLIC_API_URL || '/api/v1'

).replace(/\/$/, '');



// =========================================================

// TYPES

// =========================================================



type Subject = {

  id?: number;

  name?: string | null;

};



type MemberUser = {

  id?: number;

  name?: string | null;

};



type GroupMember = {

  id?: number;

  user_id?: number;

  role?: string | null;

  status?: string | null;

  user?: MemberUser | null;

};



type StudyGroup = {

  id: number;

  creator_id?: number;

  subject_id?: number;

  name: string;

  slug?: string;

  description?: string | null;

  max_members?: number;

  is_private?: boolean;

  subject?: Subject | null;

  members?: GroupMember[];

};



type StudySession = {

  id: number;

  host_id?: number;

  study_group_id?: number;

  subject_id?: number;



  title: string;

  description?: string | null;

  meeting_link?: string | null;



  max_participants?: number;

  participants_count?: number;



  scheduled_at?: string | null;

  duration_minutes?: number;



  status?: string | null;



  study_group?: {

    id?: number;

    name?: string | null;

    slug?: string | null;

  } | null;



  subject?: Subject | null;

};



type StudySessionResponse = {

  message?: string;

  data?: StudySession[];

};



// =========================================================

// AUTH HELPERS

// =========================================================



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



  localStorage.removeItem(

    'meetspace_auth_token'

  );



  localStorage.removeItem('user_data');

}



// =========================================================

// FORMATTERS

// =========================================================



function formatDate(

  value?: string | null

): string {

  if (!value) {

    return '-';

  }



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) {

    return '-';

  }



  return new Intl.DateTimeFormat(

    'id-ID',

    {

      weekday: 'short',

      day: 'numeric',

      month: 'short',

    }

  ).format(date);

}



function formatTime(

  value?: string | null

): string {

  if (!value) {

    return '-';

  }



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) {

    return '-';

  }



  return new Intl.DateTimeFormat(

    'id-ID',

    {

      hour: '2-digit',

      minute: '2-digit',

      hour12: false,

    }

  ).format(date);

}



function getEndTime(

  value?: string | null,

  durationMinutes?: number

): string {

  if (!value) {

    return '-';

  }



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) {

    return '-';

  }



  date.setMinutes(

    date.getMinutes() +

      (durationMinutes || 0)

  );



  return new Intl.DateTimeFormat(

    'id-ID',

    {

      hour: '2-digit',

      minute: '2-digit',

      hour12: false,

    }

  ).format(date);

}



function getInitials(name: string): string {

  const words = name

    .trim()

    .split(/\s+/)

    .filter(Boolean);



  if (words.length === 0) {

    return 'GR';

  }



  if (words.length === 1) {

    return words[0]

      .slice(0, 2)

      .toUpperCase();

  }



  return (

    words[0].charAt(0) +

    words[1].charAt(0)

  ).toUpperCase();

}



function getActiveMemberCount(

  group: StudyGroup

): number {

  if (!Array.isArray(group.members)) {

    return 0;

  }



  return group.members.filter(

    (member) =>

      !member.status ||

      member.status === 'accepted'

  ).length;

}



function isMyGroup(

  group: StudyGroup,

  userId?: number

): boolean {

  if (!userId) {

    return false;

  }



  if (group.creator_id === userId) {

    return true;

  }



  return Boolean(

    group.members?.some(

      (member) => {

        const memberUserId =

          member.user_id ??

          member.user?.id;



        return (

          memberUserId === userId &&

          member.status === 'accepted'

        );

      }

    )

  );

}



// =========================================================

// PAGE

// =========================================================



export default function DashboardPage() {

  const router = useRouter();



  const [userData, setUserData] =

    useState<UserDto | null>(null);



  const [groups, setGroups] =

    useState<StudyGroup[]>([]);



  const [sessions, setSessions] =

    useState<StudySession[]>([]);



  const [loading, setLoading] =

    useState(true);



  const [refreshing, setRefreshing] =

    useState(false);



  const [error, setError] =

    useState('');



  // =======================================================

  // LOAD DASHBOARD DATA

  // =======================================================



  const loadDashboardData =

    useCallback(

      async (

        isRefresh = false

      ) => {

        const token =

          getStoredToken();



        if (!token) {

          clearAuthStorage();



          router.replace(

            '/login'

          );



          return;

        }



        if (isRefresh) {

          setRefreshing(true);

        } else {

          setLoading(true);

        }



        setError('');



        try {

          // -----------------------------------------------

          // USER

          // -----------------------------------------------

          let currentUser:

            | UserDto

            | null = null;



          const savedUser =

            localStorage.getItem(

              'user_data'

            );



          if (savedUser) {

            currentUser =

              parseUserDto(

                savedUser

              );



            if (currentUser) {

              setUserData(

                currentUser

              );

            }

          }



          // -----------------------------------------------

          // REQUEST DASHBOARD DATA

          // -----------------------------------------------

          const [

            groupResponse,

            sessionResponse,

          ] = await Promise.all([

            fetch(

              `${API_URL}/groups`,

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

            ),



            fetch(

              `${API_URL}/study-sessions`,

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

            ),

          ]);



          // -----------------------------------------------

          // AUTH EXPIRED

          // -----------------------------------------------

          if (

            groupResponse.status ===

              401 ||

            sessionResponse.status ===

              401

          ) {

            clearAuthStorage();



            router.replace(

              '/login'

            );



            return;

          }



          // -----------------------------------------------

          // GROUP RESPONSE

          // GroupController returns array directly.

          // -----------------------------------------------

          if (

            !groupResponse.ok

          ) {

            throw new Error(

              'Gagal mengambil data grup belajar.'

            );

          }



          const groupPayload =

            await groupResponse.json();



          const groupList:

            StudyGroup[] =

            Array.isArray(

              groupPayload

            )

              ? groupPayload

              : Array.isArray(

                    groupPayload?.data

                  )

                ? groupPayload.data

                : [];



          setGroups(groupList);



          // -----------------------------------------------

          // SESSION RESPONSE

          // StudySessionController:

          // {

          //   message: "...",

          //   data: [...]

          // }

          // -----------------------------------------------

          if (

            !sessionResponse.ok

          ) {

            throw new Error(

              'Gagal mengambil data sesi belajar.'

            );

          }



          const sessionPayload: StudySessionResponse =

            await sessionResponse.json();



          setSessions(

            Array.isArray(

              sessionPayload.data

            )

              ? sessionPayload.data

              : []

          );

        } catch (

          requestError: unknown

        ) {

          console.error(

            'Dashboard error:',

            requestError

          );



          setError(

            requestError instanceof

              Error

              ? requestError.message

              : 'Terjadi kesalahan saat mengambil data Dashboard.'

          );

        } finally {

          setLoading(false);



          setRefreshing(false);

        }

      },

      [router]

    );



  useEffect(() => {

    loadDashboardData();

  }, [loadDashboardData]);



  // =======================================================

  // UPCOMING SESSIONS

  // =======================================================



  const upcomingSessions =

    useMemo(() => {

      const now =

        new Date().getTime();



      return sessions

        .filter((session) => {

          if (

            session.status ===

            'cancelled'

          ) {

            return false;

          }



          if (

            !session.scheduled_at

          ) {

            return false;

          }



          const sessionTime =

            new Date(

              session.scheduled_at

            ).getTime();



          return (

            !Number.isNaN(

              sessionTime

            ) &&

            sessionTime >= now

          );

        })

        .sort((a, b) => {

          const timeA = a

            .scheduled_at

            ? new Date(

                a.scheduled_at

              ).getTime()

            : 0;



          const timeB = b

            .scheduled_at

            ? new Date(

                b.scheduled_at

              ).getTime()

            : 0;



          return timeA - timeB;

        })

        .slice(0, 3);

    }, [sessions]);



  // =======================================================

  // MY GROUPS

  // =======================================================



  const myGroups =

    useMemo(() => {

      if (!userData?.id) {

        return [];

      }



      return groups

        .filter((group) =>

          isMyGroup(

            group,

            userData.id

          )

        )

        .slice(0, 3);

    }, [groups, userData]);



  // =======================================================

  // LOADING

  // =======================================================



  if (loading) {

    return (

      <div className="flex min-h-[420px] items-center justify-center">

        <div className="flex flex-col items-center gap-3">

          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />



          <div className="text-center">

            <p className="text-sm font-semibold text-slate-700">

              Memuat Dashboard

            </p>



            <p className="mt-1 text-xs text-slate-400">

              Mengambil data belajar

              terbaru...

            </p>

          </div>

        </div>

      </div>

    );

  }



  return (

    <div className="w-full space-y-6 pb-8">

      {/* ===================================================
          HERO
      ==================================================== */}

      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-blue-500/10 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl" />

        <div className="relative z-10 grid gap-6 xl:grid-cols-[1.35fr_0.65fr] xl:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-50 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />

              Dashboard Mahasiswa
            </div>

            <h1 className="max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
              Halo, {userData?.name || 'Mahasiswa'} 👋
            </h1>

            <p className="mt-2 max-w-2xl text-xs leading-6 text-blue-100 sm:text-sm">
              Belajar lebih terarah bersama Study Buddy.
              Temukan partner belajar, ikuti grup, dan
              persiapkan sesi berikutnya dari satu tempat.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/dashboard/find-buddy"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                <Search className="h-3.5 w-3.5" />

                Cari Study Buddy
              </Link>

              <Link
                href="/dashboard/calendar"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <Calendar className="h-3.5 w-3.5" />

                Lihat Kalender
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-100">
                  Ringkasan Belajar
                </p>

                <p className="mt-1 text-xs text-white/70">
                  Aktivitas akunmu saat ini
                </p>
              </div>

              <button
                type="button"
                disabled={refreshing}
                onClick={() => loadDashboardData(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Refresh dashboard"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing ? 'animate-spin' : ''
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/10 p-3 text-center">
                <p className="text-xl font-bold">
                  {myGroups.length}
                </p>

                <p className="mt-1 text-[9px] font-medium text-blue-100">
                  Grup Saya
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-3 text-center">
                <p className="text-xl font-bold">
                  {upcomingSessions.length}
                </p>

                <p className="mt-1 text-[9px] font-medium text-blue-100">
                  Mendatang
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-3 text-center">
                <p className="text-xl font-bold">
                  {sessions.length}
                </p>

                <p className="mt-1 text-[9px] font-medium text-blue-100">
                  Total Sesi
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <AlertCircle className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-bold text-red-700">
                Data Dashboard belum dapat dimuat
              </p>

              <p className="mt-1 text-xs text-red-600">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* ===================================================
          SUMMARY CARDS
      ==================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Grup Saya"
          value={myGroups.length}
          description="Grup belajar yang kamu ikuti"
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-indigo-50 text-indigo-600"
        />

        <SummaryCard
          label="Sesi Mendatang"
          value={upcomingSessions.length}
          description="Jadwal belajar terdekat"
          icon={<Calendar className="h-5 w-5" />}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          label="Grup Tersedia"
          value={groups.length}
          description="Grup yang dapat dijelajahi"
          icon={<GraduationCap className="h-5 w-5" />}
          iconClass="bg-violet-50 text-violet-600"
        />

        <SummaryCard
          label="Total Sesi"
          value={sessions.length}
          description="Sesi belajar yang tersedia"
          icon={<Clock className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-600"
        />
      </section>

      {/* ===================================================
          QUICK ACCESS
      ==================================================== */}

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-bold text-slate-900">
            Akses Cepat
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Pilih aktivitas belajar yang ingin kamu lakukan.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickActionCard
            href="/dashboard/find-buddy"
            title="Cari Study Buddy"
            description="Temukan teman belajar yang paling cocok."
            icon={<Search className="h-5 w-5" />}
            iconClass="bg-blue-50 text-blue-600"
            hoverClass="hover:border-blue-200"
          />

          <QuickActionCard
            href="/dashboard/groups"
            title="Grup Belajar"
            description="Gabung atau kelola grup belajarmu."
            icon={<Users className="h-5 w-5" />}
            iconClass="bg-indigo-50 text-indigo-600"
            hoverClass="hover:border-indigo-200"
          />

          <QuickActionCard
            href="/dashboard/calendar"
            title="Kalender"
            description="Atur dan pantau jadwal sesi belajar."
            icon={<Calendar className="h-5 w-5" />}
            iconClass="bg-sky-50 text-sky-600"
            hoverClass="hover:border-sky-200"
          />

          <QuickActionCard
            href="/dashboard/materials"
            title="Materi Belajar"
            description="Akses materi dari komunitas belajarmu."
            icon={<BookOpen className="h-5 w-5" />}
            iconClass="bg-cyan-50 text-cyan-600"
            hoverClass="hover:border-cyan-200"
          />

          <QuickActionCard
            href="/dashboard/quizzes"
            title="Kuis"
            description="Latih pemahamanmu melalui quiz."
            icon={<FileQuestion className="h-5 w-5" />}
            iconClass="bg-amber-50 text-amber-600"
            hoverClass="hover:border-amber-200"
          />

          <QuickActionCard
            href="/dashboard/tutoring"
            title="Peer Tutoring"
            description="Temukan tutor untuk belajar bersama."
            icon={<MessageSquare className="h-5 w-5" />}
            iconClass="bg-emerald-50 text-emerald-600"
            hoverClass="hover:border-emerald-200"
          />
        </div>
      </section>

      {/* ===================================================
          UPCOMING + LEARNING HUB
      ==================================================== */}

      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Calendar className="h-4 w-4" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      Sesi Mendatang
                    </h2>

                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                      {upcomingSessions.length}
                    </span>
                  </div>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Jadwal belajar terdekat dari grup yang kamu ikuti.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/calendar"
              className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Lihat semua

              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {upcomingSessions.length > 0 ? (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <Link
                  key={session.id}
                  href="/dashboard/calendar"
                  className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                      <BookOpen className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-slate-800">
                        {session.title}
                      </h3>

                      <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                        {session.study_group?.name ||
                          session.subject?.name ||
                          'Sesi Belajar'}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />

                          {formatDate(session.scheduled_at)}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />

                          {formatTime(session.scheduled_at)}

                          {' - '}

                          {getEndTime(
                            session.scheduled_at,
                            session.duration_minutes
                          )}
                        </span>

                        {typeof session.participants_count ===
                          'number' && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />

                            {session.participants_count}

                            {session.max_participants
                              ? `/${session.max_participants}`
                              : ''}{' '}
                            peserta
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    Lihat Sesi

                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 px-6 py-9 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-500 shadow-sm">
                <Calendar className="h-5 w-5" />
              </div>

              <h3 className="mt-3 text-sm font-bold text-slate-700">
                Belum ada sesi mendatang
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                Sesi belajar dari grup yang kamu ikuti akan tampil
                otomatis di sini.
              </p>

              <Link
                href="/dashboard/calendar"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Buka Kalender

                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        <aside className="rounded-[26px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Learning Hub
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Lanjutkan aktivitas belajarmu.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <LearningHubItem
              href="/dashboard/materials"
              title="Jelajahi Materi"
              description="Cari referensi belajar"
              icon={<BookOpen className="h-4 w-4" />}
              iconClass="bg-cyan-50 text-cyan-600"
            />

            <LearningHubItem
              href="/dashboard/quizzes"
              title="Kerjakan Kuis"
              description="Uji pemahaman materi"
              icon={<FileQuestion className="h-4 w-4" />}
              iconClass="bg-amber-50 text-amber-600"
            />

            <LearningHubItem
              href="/dashboard/tutoring"
              title="Cari Tutor"
              description="Belajar bersama peer tutor"
              icon={<MessageSquare className="h-4 w-4" />}
              iconClass="bg-emerald-50 text-emerald-600"
            />
          </div>

          <div className="mt-5 rounded-2xl border border-indigo-100 bg-white/80 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-500">
              Study Tip
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              Lengkapi profil belajar dan jadwalmu agar fitur
              Cari Buddy dapat memberikan hasil match yang lebih relevan.
            </p>

            <Link
              href="/dashboard/profile"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
            >
              Lengkapi Profil

              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </section>

      {/* ===================================================
          MY GROUPS
      ==================================================== */}

      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-4 w-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Grup Saya
                </h2>

                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                  {myGroups.length}
                </span>
              </div>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Grup belajar aktif yang sedang kamu ikuti.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/groups"
            className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Lihat semua

            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {myGroups.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {myGroups.map((group) => {
              const memberCount =
                getActiveMemberCount(group);

              return (
                <Link
                  key={group.id}
                  href="/dashboard/groups"
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-indigo-50/70" />

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-sm shadow-indigo-500/20">
                      {getInitials(group.name)}
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                        group.is_private
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {group.is_private
                        ? 'Private'
                        : 'Publik'}
                    </span>
                  </div>

                  <h3 className="relative mt-4 truncate text-sm font-bold text-slate-800 transition group-hover:text-indigo-600">
                    {group.name}
                  </h3>

                  <p className="relative mt-1 truncate text-[11px] text-slate-400">
                    {group.subject?.name ||
                      'Mata kuliah belum tersedia'}
                  </p>

                  <div className="relative mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Users className="h-3.5 w-3.5 text-slate-400" />

                      {memberCount}

                      {group.max_members
                        ? `/${group.max_members}`
                        : ''}{' '}
                      anggota
                    </span>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-100 bg-indigo-50/30 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm">
              <Users className="h-5 w-5" />
            </div>

            <h3 className="mt-3 text-sm font-bold text-slate-700">
              Belum bergabung ke grup
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Temukan grup belajar yang sesuai dengan mata kuliahmu
              atau buat grup baru bersama teman.
            </p>

            <Link
              href="/dashboard/groups"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              Cari Grup

              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </section>
    </div>

  );

}

function SummaryCard({
  label,
  value,
  description,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-500">
            {label}
          </p>

          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-[10px] leading-4 text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  description,
  icon,
  iconClass,
  hoverClass,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
  hoverClass: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${hoverClass}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-slate-800">
          {title}
        </h3>

        <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
          {description}
        </p>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
    </Link>
  );
}

function LearningHubItem({
  href,
  title,
  description,
  icon,
  iconClass,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-white bg-white/80 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-700">
          {title}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">
          {description}
        </p>
      </div>

      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
    </Link>
  );
}