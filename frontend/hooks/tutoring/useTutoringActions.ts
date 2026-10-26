import { FormEvent } from "react";
import { apiFetch, readPayload, defaultDateTime, toDateTimeLocal, emptyAvailability } from "@/components/tutoring/utils";
import type { Availability, Tutor, TutoringRequestRow } from "@/components/tutoring/types";
import type { TutoringState } from "./useTutoringState";

export function useTutoringActions(
  state: TutoringState,
  data: { loadMainData: () => Promise<void> }
) {
  const {
    setTab,
    profile,
    setSaving,
    setError,
    setSuccess,
    requestTutor,
    setRequestTutor,
    requestForm,
    setRequestForm,
    setProfileOpen,
    profileForm,
    setProfileForm,
    sessionRequest,
    setSessionRequest,
    sessionMode,
    setSessionMode,
    sessionForm,
    setSessionForm,
    reviewRequest,
    setReviewRequest,
    reviewForm,
    setReviewForm,
    setReviewListTutor,
    setReviewList,
    setReviewListLoading,
  } = state;
  const { loadMainData } = data;

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

  return {
    openRequest,
    submitRequest,
    openProfile,
    updateAvailability,
    removeAvailability,
    saveProfile,
    toggleTutorStatus,
    changeStatus,
    openSessionModal,
    submitSession,
    openTutorReviews,
    openReview,
    submitReview,
  };
}
