import { API_URL } from "@/lib/auth";
import { apiFetch as sharedApiFetch } from "@/lib/api-fetch";
import type { Availability, RequestStatus } from "./types";

export const TOKEN_KEYS = ["access_token", "meetspace_auth_token"];

export const DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

export function getToken() {
  if (typeof window === "undefined") return "";

  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  return "";
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();

  return sharedApiFetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
}

export async function readPayload(response: Response) {
  return response.json().catch(() => ({}));
}

export function defaultDateTime() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setHours(19, 0, 0, 0);

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );

  return local.toISOString().slice(0, 16);
}

export function toDateTimeLocal(value?: string | null) {
  if (!value) return defaultDateTime();

  const date = new Date(value);
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );

  return local.toISOString().slice(0, 16);
}

export function timeLabel(value: string) {
  return value.slice(0, 5);
}

export function statusLabel(status: RequestStatus) {
  const labels: Record<RequestStatus, string> = {
    pending: "Menunggu",
    accepted: "Diterima",
    rejected: "Ditolak",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };

  return labels[status];
}

export function statusClass(status: RequestStatus) {
  if (status === "accepted" || status === "completed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected" || status === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  return "bg-amber-50 text-amber-700";
}

export function emptyAvailability(): Availability {
  return {
    day_of_week: 1,
    start_time: "18:00",
    end_time: "20:00",
  };
}
