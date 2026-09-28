"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CircleOff,
  Clock3,
  GraduationCap,
  Loader2,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Send,
  Settings2,
  Star,
  UserRound,
  Video,
  X,
} from "lucide-react";

interface Subject {
  id: number;
  name: string;
  code?: string;
}

interface TutorSubject extends Subject {
  proficiency_level: string;
}

interface Availability {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring?: boolean;
}

interface Tutor {
  id: number;
  user_id: number;
  name: string;
  avatar_url?: string | null;
  bio?: string | null;
  hourly_rate: number;
  is_verified: boolean;
  rating_avg: number;
  reviews_count: number;
  format_online: boolean;
  format_offline: boolean;
  last_active_at?: string | null;
  subjects: TutorSubject[];
  availability: Availability[];
}

interface TutorProfile {
  id: number;
  user_id: number;
  bio?: string | null;
  hourly_rate: number;
  status: "active" | "inactive";
  format_online: boolean;
  format_offline: boolean;
  subject_ids: number[];
  availability: Availability[];
}

type RequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled";

interface TutoringRequestRow {
  id: number;
  topic: string;
  notes?: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: RequestStatus;
  meeting_link?: string | null;
  session_format?: "online" | "offline" | null;
  location?: string | null;
  session_notes?: string | null;
  subject_name?: string;
  tutor_name?: string;
  student_name?: string;
  review_id?: number | null;
  review_rating?: number | null;
  review_comment?: string | null;
}

type Tab = "search" | "requests" | "tutor";

interface SessionForm {
  scheduled_at: string;
  duration_minutes: string;
  session_format: "online" | "offline";
  meeting_link: string;
  location: string;
  session_notes: string;
}

interface ReviewForm {
  rating: number;
  comment: string;
}

interface TutorReviewItem {
  id: number;
  rating: number;
  comment?: string | null;
  student?: {
    id: number;
    name: string;
  } | null;
  created_at?: string | null;
}

interface TutorFilters {
  subject: string;
  format: string;
  day: string;
  time: string;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");
const TOKEN_KEYS = ["meetspace_auth_token", "access_token"];

const DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

function getToken() {
  if (typeof window === "undefined") return "";

  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  return "";
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
}

async function readPayload(response: Response) {
  return response.json().catch(() => ({}));
}

function defaultDateTime() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setHours(19, 0, 0, 0);

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );

  return local.toISOString().slice(0, 16);
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return defaultDateTime();

  const date = new Date(value);
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );

  return local.toISOString().slice(0, 16);
}

function timeLabel(value: string) {
  return value.slice(0, 5);
}

function statusLabel(status: RequestStatus) {
  const labels: Record<RequestStatus, string> = {
    pending: "Menunggu",
    accepted: "Diterima",
    rejected: "Ditolak",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };

  return labels[status];
}

function statusClass(status: RequestStatus) {
  if (status === "accepted" || status === "completed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected" || status === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  return "bg-amber-50 text-amber-700";
}

function emptyAvailability(): Availability {
  return {
    day_of_week: 1,
    start_time: "18:00",
    end_time: "20:00",
  };
}

export default function TutoringPage() {
  const [tab, setTab] = useState<Tab>("search");

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [outgoing, setOutgoing] = useState<TutoringRequestRow[]>([]);
  const [incoming, setIncoming] = useState<TutoringRequestRow[]>([]);
  const [profile, setProfile] = useState<TutorProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [subjectFilter, setSubjectFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");

  const [requestTutor, setRequestTutor] = useState<Tutor | null>(null);
  const [requestForm, setRequestForm] = useState({
    subject_id: "",
    topic: "",
    notes: "",
    scheduled_at: defaultDateTime(),
    duration_minutes: "60",
  });

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bio: "",
    subject_ids: [] as number[],
    format_online: true,
    format_offline: false,
    availability: [emptyAvailability()] as Availability[],
  });

  const [sessionRequest, setSessionRequest] =
    useState<TutoringRequestRow | null>(null);
  const [sessionMode, setSessionMode] =
    useState<"accept" | "edit">("accept");
  const [sessionForm, setSessionForm] = useState<SessionForm>({
    scheduled_at: defaultDateTime(),
    duration_minutes: "60",
    session_format: "online",
    meeting_link: "",
    location: "",
    session_notes: "",
  });

  const [reviewRequest, setReviewRequest] =
    useState<TutoringRequestRow | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    rating: 5,
    comment: "",
  });

  const [reviewListTutor, setReviewListTutor] = useState<Tutor | null>(null);
  const [reviewList, setReviewList] = useState<TutorReviewItem[]>([]);
  const [reviewListLoading, setReviewListLoading] = useState(false);

  const incomingPendingCount = useMemo(
    () => incoming.filter((row) => row.status === "pending").length,
    [incoming]
  );

  function currentFilters(): TutorFilters {
    return {
      subject: subjectFilter,
      format: formatFilter,
      day: dayFilter,
      time: timeFilter,
    };
  }

  async function loadTutors(filters: TutorFilters) {
    setSearchLoading(true);

    try {
      const query = new URLSearchParams();

      if (filters.subject) {
        query.set("subject_id", filters.subject);
      }

      if (filters.format) {
        query.set("format", filters.format);
      }

      if (filters.day !== "") {
        query.set("day_of_week", filters.day);

        if (filters.time) {
          query.set("time", filters.time);
        }
      }

      const suffix = query.toString() ? `?${query.toString()}` : "";
      const response = await apiFetch(`/tutoring/tutors${suffix}`);
      const payload = await readPayload(response);

      if (response.status === 401) {
        throw new Error("Sesi login berakhir. Silakan login kembali.");
      }

      if (!response.ok) {
        throw new Error(payload?.message || "Gagal memuat daftar tutor.");
      }

      setTutors(Array.isArray(payload) ? payload : payload?.data || []);
    } finally {
      setSearchLoading(false);
    }
  }

  async function loadMainData() {
    setLoading(true);
    setError("");

    try {
      const [subjectsResponse, requestResponse, profileResponse] =
        await Promise.all([
          apiFetch("/subjects"),
          apiFetch("/tutoring/requests"),
          apiFetch("/tutoring/profile/me"),
        ]);

      if (
        subjectsResponse.status === 401 ||
        requestResponse.status === 401 ||
        profileResponse.status === 401
      ) {
        throw new Error("Sesi login berakhir. Silakan login kembali.");
      }

      const [subjectPayload, requestPayload, profilePayload] =
        await Promise.all([
          readPayload(subjectsResponse),
          readPayload(requestResponse),
          readPayload(profileResponse),
        ]);

      if (!subjectsResponse.ok) {
        throw new Error(
          subjectPayload?.message || "Gagal memuat mata kuliah."
        );
      }

      if (!requestResponse.ok) {
        throw new Error(
          requestPayload?.message || "Gagal memuat request tutoring."
        );
      }

      if (!profileResponse.ok) {
        throw new Error(
          profilePayload?.message || "Gagal memuat profil tutor."
        );
      }

      setSubjects(
        Array.isArray(subjectPayload)
          ? subjectPayload
          : subjectPayload?.data || []
      );

      setOutgoing(requestPayload?.outgoing || []);
      setIncoming(requestPayload?.incoming || []);
      setProfile(profilePayload || null);

      if (profilePayload) {
        setProfileForm({
          bio: profilePayload.bio || "",
          subject_ids: (profilePayload.subject_ids || []).map(Number),
          format_online: Boolean(profilePayload.format_online),
          format_offline: Boolean(profilePayload.format_offline),
          availability:
            profilePayload.availability?.length > 0
              ? profilePayload.availability.map(
                  (slot: Availability) => ({
                    id: slot.id,
                    day_of_week: Number(slot.day_of_week),
                    start_time: timeLabel(slot.start_time),
                    end_time: timeLabel(slot.end_time),
                  })
                )
              : [emptyAvailability()],
        });
      }

      await loadTutors(currentFilters());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat peer tutoring."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMainData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyTutorFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await loadTutors(currentFilters());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memfilter tutor."
      );
    }
  }

  async function resetFilters() {
    const empty = {
      subject: "",
      format: "",
      day: "",
      time: "",
    };

    setSubjectFilter("");
    setFormatFilter("");
    setDayFilter("");
    setTimeFilter("");
    setError("");

    try {
      await loadTutors(empty);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mereset filter tutor."
      );
    }
  }

  function openRequest(tutor: Tutor) {
    setRequestTutor(tutor);
    setError("");
    setSuccess("");

    setRequestForm({
      subject_id: tutor.subjects[0]
        ? String(tutor.subjects[0].id)
        : "",
      topic: "",
      notes: "",
      scheduled_at: defaultDateTime(),
      duration_minutes: "60",
    });
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requestTutor) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch("/tutoring/requests", {
        method: "POST",
        body: JSON.stringify({
          tutor_profile_id: requestTutor.id,
          subject_id: Number(requestForm.subject_id),
          topic: requestForm.topic,
          notes: requestForm.notes || null,
          scheduled_at: requestForm.scheduled_at,
          duration_minutes: Number(requestForm.duration_minutes),
        }),
      });

      const payload = await readPayload(response);

      if (!response.ok) {
        throw new Error(
          payload?.message || "Gagal mengirim request tutoring."
        );
      }

      setSuccess(
        payload?.message || "Permintaan tutoring berhasil dikirim."
      );
      setRequestTutor(null);
      setTab("requests");

      await loadMainData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengirim request."
      );
    } finally {
      setSaving(false);
    }
  }

  function openProfile() {
    setError("");
    setSuccess("");

    if (!profile) {
      setProfileForm({
        bio: "",
        subject_ids: [],
        format_online: true,
        format_offline: false,
        availability: [emptyAvailability()],
      });
    }

    setProfileOpen(true);
  }

  function updateAvailability(
    index: number,
    key: keyof Availability,
    value: string | number
  ) {
    setProfileForm((previous) => ({
      ...previous,
      availability: previous.availability.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [key]: value } : slot
      ),
    }));
  }

  function removeAvailability(index: number) {
    setProfileForm((previous) => ({
      ...previous,
      availability: previous.availability.filter(
        (_, slotIndex) => slotIndex !== index
      ),
    }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch("/tutoring/profile", {
        method: "POST",
        body: JSON.stringify({
          bio: profileForm.bio || null,
          subject_ids: profileForm.subject_ids,
          format_online: profileForm.format_online,
          format_offline: profileForm.format_offline,
          availability: profileForm.availability.map((slot) => ({
            day_of_week: Number(slot.day_of_week),
            start_time: slot.start_time,
            end_time: slot.end_time,
          })),
        }),
      });

      const payload = await readPayload(response);

      if (!response.ok) {
        throw new Error(
          payload?.message || "Gagal menyimpan profil tutor."
        );
      }

      setSuccess(payload?.message || "Profil tutor berhasil disimpan.");
      setProfileOpen(false);
      setTab("tutor");

      await loadMainData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan profil."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTutorStatus() {
    if (!profile) return;

    const nextStatus =
      profile.status === "active" ? "inactive" : "active";

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch("/tutoring/profile/status", {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = await readPayload(response);

      if (!response.ok) {
        throw new Error(
          payload?.message || "Gagal mengubah status tutor."
        );
      }

      setSuccess(
        payload?.message || "Status tutor berhasil diperbarui."
      );

      await loadMainData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengubah status tutor."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(
    id: number,
    status: "rejected" | "completed" | "cancelled"
  ) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(
        `/tutoring/requests/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      const payload = await readPayload(response);

      if (!response.ok) {
        throw new Error(
          payload?.message || "Gagal memperbarui status tutoring."
        );
      }

      setSuccess(
        payload?.message || "Status tutoring berhasil diperbarui."
      );

      await loadMainData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memperbarui status."
      );
    } finally {
      setSaving(false);
    }
  }

  function openSessionModal(
    row: TutoringRequestRow,
    mode: "accept" | "edit"
  ) {
    const defaultFormat =
      row.session_format ||
      (profile?.format_online ? "online" : "offline");

    setSessionRequest(row);
    setSessionMode(mode);
    setError("");
    setSuccess("");

    setSessionForm({
      scheduled_at: toDateTimeLocal(row.scheduled_at),
      duration_minutes: String(row.duration_minutes || 60),
      session_format: defaultFormat,
      meeting_link: row.meeting_link || "",
      location: row.location || "",
      session_notes: row.session_notes || "",
    });
  }

  async function submitSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionRequest) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const sessionPayload = {
      scheduled_at: sessionForm.scheduled_at,
      duration_minutes: Number(sessionForm.duration_minutes),
      session_format: sessionForm.session_format,
      meeting_link:
        sessionForm.session_format === "online"
          ? sessionForm.meeting_link
          : null,
      location:
        sessionForm.session_format === "offline"
          ? sessionForm.location
          : null,
      session_notes: sessionForm.session_notes || null,
    };

    try {
      const path =
        sessionMode === "accept"
          ? `/tutoring/requests/${sessionRequest.id}/status`
          : `/tutoring/requests/${sessionRequest.id}/session`;

      const response = await apiFetch(path, {
        method: "PATCH",
        body: JSON.stringify(
          sessionMode === "accept"
            ? { status: "accepted", ...sessionPayload }
            : sessionPayload
        ),
      });

      const payload = await readPayload(response);

      if (!response.ok) {
        throw new Error(
          payload?.message || "Gagal menyimpan detail sesi."
        );
      }

      setSuccess(
        payload?.message || "Detail sesi tutoring berhasil disimpan."
      );
      setSessionRequest(null);

      await loadMainData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan detail sesi."
      );
    } finally {
      setSaving(false);
    }
  }


  async function openTutorReviews(tutor: Tutor) {
    if (tutor.reviews_count < 1) return;

    setError("");
    setReviewListTutor(tutor);
    setReviewList([]);
    setReviewListLoading(true);

    try {
      const response = await apiFetch(
        `/tutoring/tutors/${tutor.id}/reviews`
      );
      const payload = await readPayload(response);

      if (!response.ok) {
        throw new Error(payload?.message || "Gagal memuat review tutor.");
      }

      setReviewList(Array.isArray(payload?.data) ? payload.data : []);
    } catch (err) {
      setReviewListTutor(null);
      setError(
        err instanceof Error ? err.message : "Gagal memuat review tutor."
      );
    } finally {
      setReviewListLoading(false);
    }
  }

  function openReview(row: TutoringRequestRow) {
    if (row.status !== "completed" || row.review_id) return;

    setError("");
    setSuccess("");
    setReviewRequest(row);
    setReviewForm({ rating: 5, comment: "" });
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewRequest) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(
        `/tutoring/requests/${reviewRequest.id}/reviews`,
        {
          method: "POST",
          body: JSON.stringify({
            rating: reviewForm.rating,
            comment: reviewForm.comment || null,
          }),
        }
      );

      const payload = await readPayload(response);

      if (!response.ok) {
        throw new Error(
          payload?.message || "Gagal mengirim review tutoring."
        );
      }

      setSuccess(payload?.message || "Review tutoring berhasil dikirim.");
      setReviewRequest(null);
      await loadMainData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengirim review."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-6 pb-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
              <GraduationCap className="h-6 w-6" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                Peer Tutoring
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Belajar dengan Tutor Sebaya
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Cari bantuan berdasarkan mata kuliah dan jadwal, atau
                aktifkan mode tutor untuk membantu mahasiswa lain.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openProfile}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Settings2 className="h-4 w-4" />
            {profile ? "Kelola Mode Tutor" : "Jadi Tutor"}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setTab("search")}
          className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
            tab === "search"
              ? "bg-emerald-600 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          Cari Tutor
        </button>

        <button
          type="button"
          onClick={() => setTab("requests")}
          className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
            tab === "requests"
              ? "bg-emerald-600 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          Request Saya ({outgoing.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("tutor")}
          className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
            tab === "tutor"
              ? "bg-emerald-600 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          Mode Tutor ({incomingPendingCount})
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
          Memuat peer tutoring...
        </div>
      ) : (
        <>
          {tab === "search" && (
            <div className="space-y-5">
              <form
                onSubmit={applyTutorFilter}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Search className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Filter Tutor
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <select
                    value={subjectFilter}
                    onChange={(event) =>
                      setSubjectFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                  >
                    <option value="">Semua mata kuliah</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={formatFilter}
                    onChange={(event) =>
                      setFormatFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                  >
                    <option value="">Semua format</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>

                  <select
                    value={dayFilter}
                    onChange={(event) =>
                      setDayFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                  >
                    <option value="">Semua hari</option>
                    {DAYS.map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>

                  <input
                    type="time"
                    value={timeFilter}
                    disabled={dayFilter === ""}
                    onChange={(event) =>
                      setTimeFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 disabled:opacity-50"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {searchLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Terapkan Filter
                  </button>

                  <button
                    type="button"
                    onClick={() => void resetFilters()}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
                  >
                    Reset
                  </button>
                </div>
              </form>

              {searchLoading ? (
                <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
                  Mencari tutor...
                </div>
              ) : tutors.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                  <GraduationCap className="mx-auto h-8 w-8 text-slate-300" />
                  <h2 className="mt-4 text-base font-bold text-slate-700">
                    Tutor tidak ditemukan
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Coba perluas filter atau jadilah tutor untuk mata
                    kuliah yang kamu kuasai.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {tutors.map((tutor) => (
                    <article
                      key={tutor.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        {tutor.avatar_url ? (
                          <img
                            src={tutor.avatar_url}
                            alt={`Foto ${tutor.name}`}
                            className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                            <UserRound className="h-5 w-5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-bold text-slate-900">
                            {tutor.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-[10px] text-slate-500">
                              {tutor.rating_avg.toFixed(1)} / 5 ·{" "}
                              {tutor.reviews_count} review
                            </p>

                            {tutor.reviews_count > 0 && (
                              <button
                                type="button"
                                onClick={() => void openTutorReviews(tutor)}
                                className="text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:underline"
                              >
                                Lihat Review
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="mt-4 line-clamp-3 text-xs leading-5 text-slate-500">
                        {tutor.bio || "Belum ada bio tutor."}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {tutor.subjects.map((subject) => (
                          <span
                            key={subject.id}
                            className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700"
                          >
                            {subject.name}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {tutor.format_online && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                            <Video className="h-3 w-3" />
                            Online
                          </span>
                        )}

                        {tutor.format_offline && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700">
                            <MapPin className="h-3 w-3" />
                            Offline
                          </span>
                        )}
                      </div>

                      <div className="mt-4 space-y-1">
                        {tutor.availability
                          .slice(0, 3)
                          .map((slot, index) => (
                            <p
                              key={`${tutor.id}-${slot.day_of_week}-${index}`}
                              className="flex items-center gap-1 text-[10px] text-slate-400"
                            >
                              <Clock3 className="h-3 w-3" />
                              {DAYS[Number(slot.day_of_week)]},{" "}
                              {timeLabel(slot.start_time)} -{" "}
                              {timeLabel(slot.end_time)}
                            </p>
                          ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => openRequest(tutor)}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Minta Tutoring
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "requests" && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Request Tutoring Saya
                </h2>
              </div>

              {outgoing.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-400">
                  Belum ada request tutoring.
                </p>
              ) : (
                <div className="space-y-4">
                  {outgoing.map((row) => (
                    <article
                      key={row.id}
                      className="rounded-2xl border border-slate-100 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {row.topic}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Tutor: {row.tutor_name} · {row.subject_name}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock3 className="h-3 w-3" />
                            {new Date(row.scheduled_at).toLocaleString(
                              "id-ID"
                            )}{" "}
                            · {row.duration_minutes} menit
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(
                            row.status
                          )}`}
                        >
                          {statusLabel(row.status)}
                        </span>
                      </div>

                      {row.notes && (
                        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                          {row.notes}
                        </p>
                      )}

                      {(row.status === "accepted" || row.status === "completed") && (
                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            Detail Sesi
                          </p>

                          <div className="mt-2 space-y-1 text-xs text-slate-600">
                            <p>
                              Format:{" "}
                              <strong className="capitalize">
                                {row.session_format || "-"}
                              </strong>
                            </p>

                            {row.session_format === "offline" &&
                              row.location && (
                                <p>Lokasi: {row.location}</p>
                              )}

                            {row.session_notes && (
                              <p>Catatan tutor: {row.session_notes}</p>
                            )}
                          </div>

                          {row.session_format === "online" &&
                            row.meeting_link && (
                              <a
                                href={row.meeting_link}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white"
                              >
                                <Video className="h-3.5 w-3.5" />
                                Buka Meeting
                              </a>
                            )}
                        </div>
                      )}

                      {row.status === "pending" && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            void changeStatus(row.id, "cancelled")
                          }
                          className="mt-3 rounded-lg border border-red-200 px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Batalkan Request
                        </button>
                      )}

                      {row.status === "completed" && !row.review_id && (
                        <button
                          type="button"
                          onClick={() => openReview(row)}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-[10px] font-bold text-white hover:bg-amber-600"
                        >
                          <Star className="h-3.5 w-3.5" />
                          Beri Review
                        </button>
                      )}

                      {row.status === "completed" && row.review_id && (
                        <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
                            <Star className="h-4 w-4 fill-current" />
                            Review Anda: {row.review_rating}/5
                          </div>
                          {row.review_comment && (
                            <p className="mt-1 text-[11px] leading-5 text-slate-600">
                              {row.review_comment}
                            </p>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "tutor" && (
            <div className="space-y-5">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Mode Tutor
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Atur profil, mata kuliah, availability, dan status
                      kamu sebagai peer tutor.
                    </p>
                  </div>

                  {!profile ? (
                    <button
                      type="button"
                      onClick={openProfile}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Buat Profil Tutor
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={openProfile}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit Profil
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void toggleTutorStatus()}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50 ${
                          profile.status === "active"
                            ? "bg-red-600"
                            : "bg-emerald-600"
                        }`}
                      >
                        {profile.status === "active" ? (
                          <CircleOff className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}

                        {profile.status === "active"
                          ? "Nonaktifkan Tutor"
                          : "Aktifkan Tutor"}
                      </button>
                    </div>
                  )}
                </div>

                {profile && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                    Status:{" "}
                    <strong
                      className={
                        profile.status === "active"
                          ? "text-emerald-700"
                          : "text-red-600"
                      }
                    >
                      {profile.status === "active"
                        ? "Aktif"
                        : "Nonaktif"}
                    </strong>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Request Masuk
                  </h2>
                </div>

                {incoming.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-400">
                    Belum ada request tutoring masuk.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {incoming.map((row) => (
                      <article
                        key={row.id}
                        className="rounded-2xl border border-slate-100 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {row.topic}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Dari: {row.student_name} ·{" "}
                              {row.subject_name}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              Usulan:{" "}
                              {new Date(
                                row.scheduled_at
                              ).toLocaleString("id-ID")}{" "}
                              · {row.duration_minutes} menit
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(
                              row.status
                            )}`}
                          >
                            {statusLabel(row.status)}
                          </span>
                        </div>

                        {row.notes && (
                          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                            Kebutuhan: {row.notes}
                          </p>
                        )}

                        {row.status === "pending" && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openSessionModal(row, "accept")
                              }
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white"
                            >
                              Terima & Atur Sesi
                            </button>

                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                void changeStatus(row.id, "rejected")
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-[10px] font-bold text-red-600 disabled:opacity-50"
                            >
                              Tolak
                            </button>
                          </div>
                        )}

                        {row.status === "accepted" && (
                          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                            <div className="space-y-1 text-xs text-slate-600">
                              <p>
                                Format:{" "}
                                <strong className="capitalize">
                                  {row.session_format || "-"}
                                </strong>
                              </p>

                              {row.location && (
                                <p>Lokasi: {row.location}</p>
                              )}

                              {row.meeting_link && (
                                <p className="truncate">
                                  Meeting: {row.meeting_link}
                                </p>
                              )}

                              {row.session_notes && (
                                <p>Catatan: {row.session_notes}</p>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openSessionModal(row, "edit")
                                }
                                className="rounded-lg border border-emerald-200 px-3 py-2 text-[10px] font-bold text-emerald-700"
                              >
                                Edit Detail Sesi
                              </button>

                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  void changeStatus(
                                    row.id,
                                    "completed"
                                  )
                                }
                                className="rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50"
                              >
                                Tandai Selesai
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}

      {requestTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                  Request Tutoring
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Minta sesi dengan {requestTutor.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setRequestTutor(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitRequest} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Mata kuliah
                </label>
                <select
                  required
                  value={requestForm.subject_id}
                  onChange={(event) =>
                    setRequestForm({
                      ...requestForm,
                      subject_id: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                >
                  {requestTutor.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Topik
                </label>
                <input
                  required
                  value={requestForm.topic}
                  onChange={(event) =>
                    setRequestForm({
                      ...requestForm,
                      topic: event.target.value,
                    })
                  }
                  placeholder="Contoh: Normalisasi database"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Usulan jadwal
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={requestForm.scheduled_at}
                    onChange={(event) =>
                      setRequestForm({
                        ...requestForm,
                        scheduled_at: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Durasi
                  </label>
                  <select
                    value={requestForm.duration_minutes}
                    onChange={(event) =>
                      setRequestForm({
                        ...requestForm,
                        duration_minutes: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  >
                    <option value="30">30 menit</option>
                    <option value="60">60 menit</option>
                    <option value="90">90 menit</option>
                    <option value="120">120 menit</option>
                  </select>
                </div>
              </div>

              <p className="rounded-xl bg-blue-50 p-3 text-[11px] leading-5 text-blue-700">
                Pilih waktu yang sesuai dengan availability tutor. Tutor
                dapat menyesuaikan detail akhir saat menerima request.
              </p>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Kebutuhan belajar
                </label>
                <textarea
                  rows={3}
                  value={requestForm.notes}
                  onChange={(event) =>
                    setRequestForm({
                      ...requestForm,
                      notes: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  placeholder="Jelaskan bagian yang ingin dibantu..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}

                {saving ? "Mengirim..." : "Kirim Request"}
              </button>
            </form>
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                  Tutor Profile
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {profile ? "Edit Profil Tutor" : "Aktifkan Mode Tutor"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveProfile} className="space-y-5 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Bio / keahlian
                </label>
                <textarea
                  rows={4}
                  value={profileForm.bio}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      bio: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  placeholder="Contoh: Saya dapat membantu Laravel, routing, dan REST API."
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Format tutoring
                </label>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={profileForm.format_online}
                      onChange={(event) =>
                        setProfileForm({
                          ...profileForm,
                          format_online: event.target.checked,
                        })
                      }
                      className="accent-emerald-600"
                    />
                    <Video className="h-4 w-4" />
                    Online
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={profileForm.format_offline}
                      onChange={(event) =>
                        setProfileForm({
                          ...profileForm,
                          format_offline: event.target.checked,
                        })
                      }
                      className="accent-emerald-600"
                    />
                    <MapPin className="h-4 w-4" />
                    Offline
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Mata kuliah yang ditawarkan
                </label>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {subjects.map((subject) => (
                    <label
                      key={subject.id}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={profileForm.subject_ids.includes(
                          subject.id
                        )}
                        onChange={(event) =>
                          setProfileForm((previous) => ({
                            ...previous,
                            subject_ids: event.target.checked
                              ? [
                                  ...previous.subject_ids,
                                  subject.id,
                                ]
                              : previous.subject_ids.filter(
                                  (id) => id !== subject.id
                                ),
                          }))
                        }
                        className="accent-emerald-600"
                      />
                      {subject.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-xs font-bold text-slate-600">
                    Availability mingguan
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm((previous) => ({
                        ...previous,
                        availability: [
                          ...previous.availability,
                          emptyAvailability(),
                        ],
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600"
                  >
                    <Plus className="h-3 w-3" />
                    Tambah Jadwal
                  </button>
                </div>

                <div className="space-y-2">
                  {profileForm.availability.map((slot, index) => (
                    <div
                      key={`${slot.id ?? "new"}-${index}`}
                      className="grid grid-cols-1 gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                    >
                      <select
                        value={slot.day_of_week}
                        onChange={(event) =>
                          updateAvailability(
                            index,
                            "day_of_week",
                            Number(event.target.value)
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700"
                      >
                        {DAYS.map((day, dayIndex) => (
                          <option key={day} value={dayIndex}>
                            {day}
                          </option>
                        ))}
                      </select>

                      <input
                        type="time"
                        value={slot.start_time}
                        onChange={(event) =>
                          updateAvailability(
                            index,
                            "start_time",
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700"
                      />

                      <input
                        type="time"
                        value={slot.end_time}
                        onChange={(event) =>
                          updateAvailability(
                            index,
                            "end_time",
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700"
                      />

                      <button
                        type="button"
                        disabled={
                          profileForm.availability.length === 1
                        }
                        onClick={() =>
                          removeAvailability(index)
                        }
                        className="flex h-10 items-center justify-center rounded-xl border border-red-100 px-3 text-red-500 disabled:opacity-30"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <p className="rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-700">
                Phase 2 belum menggunakan pembayaran. Profil tutor
                digunakan untuk bantuan peer-to-peer.
              </p>

              <button
                type="submit"
                disabled={
                  saving ||
                  profileForm.subject_ids.length === 0 ||
                  profileForm.availability.length === 0 ||
                  (!profileForm.format_online &&
                    !profileForm.format_offline)
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}

                {saving ? "Menyimpan..." : "Simpan Profil Tutor"}
              </button>
            </form>
          </div>
        </div>
      )}


      {reviewListTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">
                  Review Tutor
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {reviewListTutor.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {reviewListTutor.rating_avg.toFixed(1)} / 5 ·{" "}
                  {reviewListTutor.reviews_count} review
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReviewListTutor(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-5">
              {reviewListLoading ? (
                <div className="flex min-h-[160px] items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-500" />
                  Memuat review...
                </div>
              ) : reviewList.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">
                  Belum ada review yang dapat ditampilkan.
                </div>
              ) : (
                reviewList.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-slate-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {review.student?.name || "Mahasiswa"}
                        </p>
                        {review.created_at && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            {new Date(review.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-600">
                      {review.comment || "Tidak ada komentar."}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {reviewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">
                  Review Tutor
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Nilai sesi dengan {reviewRequest.tutor_name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setReviewRequest(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitReview} className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setReviewForm((previous) => ({
                          ...previous,
                          rating,
                        }))
                      }
                      aria-label={`${rating} bintang`}
                      className="rounded-xl p-1.5 transition hover:bg-amber-50"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          rating <= reviewForm.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  {reviewForm.rating} dari 5 bintang
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Komentar <span className="font-normal text-slate-400">(opsional)</span>
                </label>
                <textarea
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(event) =>
                    setReviewForm((previous) => ({
                      ...previous,
                      comment: event.target.value,
                    }))
                  }
                  placeholder="Contoh: Penjelasan mudah dipahami dan membantu."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
                {saving ? "Mengirim..." : "Kirim Review"}
              </button>
            </form>
          </div>
        </div>
      )}

      {sessionRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                  Detail Sesi
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {sessionMode === "accept"
                    ? "Terima & Atur Sesi"
                    : "Edit Detail Sesi"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSessionRequest(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitSession} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Jadwal sesi
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={sessionForm.scheduled_at}
                    onChange={(event) =>
                      setSessionForm({
                        ...sessionForm,
                        scheduled_at: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Durasi
                  </label>
                  <select
                    value={sessionForm.duration_minutes}
                    onChange={(event) =>
                      setSessionForm({
                        ...sessionForm,
                        duration_minutes: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  >
                    <option value="30">30 menit</option>
                    <option value="60">60 menit</option>
                    <option value="90">90 menit</option>
                    <option value="120">120 menit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Format sesi
                </label>
                <select
                  value={sessionForm.session_format}
                  onChange={(event) =>
                    setSessionForm({
                      ...sessionForm,
                      session_format: event.target.value as
                        | "online"
                        | "offline",
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                >
                  {profile?.format_online && (
                    <option value="online">Online</option>
                  )}
                  {profile?.format_offline && (
                    <option value="offline">Offline</option>
                  )}
                </select>
              </div>

              {sessionForm.session_format === "online" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Meeting link
                  </label>
                  <input
                    required
                    type="url"
                    value={sessionForm.meeting_link}
                    onChange={(event) =>
                      setSessionForm({
                        ...sessionForm,
                        meeting_link: event.target.value,
                      })
                    }
                    placeholder="https://meet.google.com/..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Lokasi
                  </label>
                  <input
                    required
                    value={sessionForm.location}
                    onChange={(event) =>
                      setSessionForm({
                        ...sessionForm,
                        location: event.target.value,
                      })
                    }
                    placeholder="Contoh: Perpustakaan Kampus"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Catatan tutor
                </label>
                <textarea
                  rows={3}
                  value={sessionForm.session_notes}
                  onChange={(event) =>
                    setSessionForm({
                      ...sessionForm,
                      session_notes: event.target.value,
                    })
                  }
                  placeholder="Contoh: Siapkan project atau materi yang ingin dibahas."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}

                {saving
                  ? "Menyimpan..."
                  : sessionMode === "accept"
                    ? "Terima Request"
                    : "Simpan Detail Sesi"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
