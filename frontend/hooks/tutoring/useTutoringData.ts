import { FormEvent, useEffect } from "react";
import { apiFetch, readPayload, timeLabel, emptyAvailability } from "@/components/tutoring/utils";
import type { Availability, TutorFilters } from "@/components/tutoring/types";
import type { TutoringState } from "./useTutoringState";

export function useTutoringData(state: TutoringState) {
  const {
    setTutors,
    setSubjects,
    setOutgoing,
    setIncoming,
    setProfile,
    setLoading,
    setSearchLoading,
    setError,
    setMainLoadError,
    setHasLoadedMainData,
    setSuccess,
    subjectFilter,
    setSubjectFilter,
    formatFilter,
    setFormatFilter,
    dayFilter,
    setDayFilter,
    timeFilter,
    setTimeFilter,
    setProfileForm,
  } = state;

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

      const tutorItems = Array.isArray(payload)
        ? payload
        : payload?.data;

      if (!Array.isArray(tutorItems)) {
        throw new Error("Respons daftar tutor tidak valid.");
      }

      setTutors(tutorItems);
    } finally {
      setSearchLoading(false);
    }
  }

  async function loadMainData() {
    setLoading(true);
    setError("");
    setMainLoadError("");

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
      setHasLoadedMainData(true);
    } catch (err) {
      setMainLoadError(
        err instanceof Error
          ? err.message
          : "Gagal memuat peer tutoring."
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

  return {
    currentFilters,
    loadTutors,
    loadMainData,
    applyTutorFilter,
    resetFilters,
  };
}
