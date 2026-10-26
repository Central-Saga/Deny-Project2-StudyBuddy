import { useMemo, useState } from "react";
import { defaultDateTime, emptyAvailability } from "@/components/tutoring/utils";
import type { Subject, Availability, Tutor, TutorProfile, TutoringRequestRow, Tab, SessionForm, ReviewForm, TutorReviewItem } from "@/components/tutoring/types";

export function useTutoringState() {
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
  const [mainLoadError, setMainLoadError] = useState("");
  const [hasLoadedMainData, setHasLoadedMainData] = useState(false);
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

  return {
    tab,
    setTab,
    tutors,
    setTutors,
    subjects,
    setSubjects,
    outgoing,
    setOutgoing,
    incoming,
    setIncoming,
    profile,
    setProfile,
    loading,
    setLoading,
    searchLoading,
    setSearchLoading,
    saving,
    setSaving,
    error,
    setError,
    mainLoadError,
    setMainLoadError,
    hasLoadedMainData,
    setHasLoadedMainData,
    success,
    setSuccess,
    subjectFilter,
    setSubjectFilter,
    formatFilter,
    setFormatFilter,
    dayFilter,
    setDayFilter,
    timeFilter,
    setTimeFilter,
    requestTutor,
    setRequestTutor,
    requestForm,
    setRequestForm,
    profileOpen,
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
    reviewListTutor,
    setReviewListTutor,
    reviewList,
    setReviewList,
    reviewListLoading,
    setReviewListLoading,
    incomingPendingCount,
  };
}

export type TutoringState = ReturnType<typeof useTutoringState>;
