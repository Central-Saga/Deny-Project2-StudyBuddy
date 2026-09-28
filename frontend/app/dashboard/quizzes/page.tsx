'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  Edit3,
  FileQuestion,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';

interface QuizOption {
  id: number;
  option_text: string;
  is_correct?: boolean;
}

interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay';
  points: number;
  order: number;
  options: QuizOption[];
}

interface Quiz {
  id: number;
  creator_id: number;
  subject_id?: number | null;
  title: string;
  description?: string | null;
  duration_minutes?: number | null;
  max_attempts?: number | null;
  pass_score: number;
  is_published?: boolean;
  subject_name?: string | null;
  creator_name?: string | null;
  question_count: number;
  attempt_count?: number;
  attempts_used?: number;
  attempts_remaining?: number | null;
  has_in_progress_attempt?: boolean;
  can_attempt?: boolean;
  can_manage?: boolean;
  questions: QuizQuestion[];
}

interface QuestionDraft {
  question_text: string;
  question_type: QuizQuestion['question_type'];
  points: number;
  options: { option_text: string; is_correct: boolean }[];
}

interface QuizForm {
  title: string;
  description: string;
  duration_minutes: string;
  pass_score: string;
  max_attempts: string;
  subject_id: string;
}

interface QuizReviewItem {
  question_id: number;
  question_text: string;
  question_type: QuizQuestion['question_type'];
  points: number;
  user_answer: {
    option_id?: number | null;
    option_text?: string | null;
    answer_text?: string | null;
  };
  correct_answer?: {
    option_id: number;
    option_text: string;
  } | null;
  is_correct: boolean | null;
  points_awarded: number;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEYS = ['access_token', 'meetspace_auth_token'];

function getToken() {
  if (typeof window === 'undefined') return '';

  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  return '';
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
}

function newQuestion(): QuestionDraft {
  return {
    question_text: '',
    question_type: 'multiple_choice',
    points: 1,
    options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ],
  };
}

function emptyForm(): QuizForm {
  return {
    title: '',
    description: '',
    duration_minutes: '30',
    pass_score: '70',
    max_attempts: 'unlimited',
    subject_id: '',
  };
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizStatus, setQuizStatus] = useState<'active' | 'inactive'>('active');

  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [answers, setAnswers] = useState<Record<number, { optionId?: number; answerText?: string }>>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    earned_points: number;
    total_points: number;
    max_attempts: number | null;
    attempts_used: number;
    attempts_remaining: number | null;
    can_attempt: boolean;
    review: QuizReviewItem[];
  } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [form, setForm] = useState<QuizForm>(emptyForm());
  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[]>([newQuestion()]);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Quiz | null>(null);

  async function loadData(status: 'active' | 'inactive' = quizStatus) {
    setLoading(true);
    setError('');

    try {
      const [quizResponse, subjectResponse] = await Promise.all([
        apiFetch(status === 'inactive' ? '/quizzes?status=inactive' : '/quizzes'),
        apiFetch('/subjects'),
      ]);

      if (quizResponse.status === 401) {
        throw new Error('Sesi login berakhir. Silakan login kembali.');
      }

      if (!quizResponse.ok) {
        throw new Error('Gagal mengambil data kuis.');
      }

      const quizPayload = await quizResponse.json();
      const subjectPayload = subjectResponse.ok ? await subjectResponse.json() : [];

      setQuizzes(Array.isArray(quizPayload) ? quizPayload : quizPayload?.data || []);
      setSubjects(Array.isArray(subjectPayload) ? subjectPayload : subjectPayload?.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat kuis.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(quizStatus);
  }, [quizStatus]);

  async function openQuiz(quiz: Quiz) {
    setError('');
    setResult(null);
    setPreviewMode(false);

    if (quiz.can_attempt === false && !quiz.has_in_progress_attempt) {
      setError('Batas percobaan kuis telah tercapai.');
      return;
    }

    try {
      const detailResponse = await apiFetch(`/quizzes/${quiz.id}`);
      const detail = await detailResponse.json().catch(() => ({}));

      if (!detailResponse.ok) {
        throw new Error(detail?.message || 'Gagal mengambil detail kuis.');
      }

      const quizData: Quiz = detail?.data || detail;

      const attemptResponse = await apiFetch(`/quizzes/${quiz.id}/attempts`, {
        method: 'POST',
      });
      const attemptPayload = await attemptResponse.json().catch(() => ({}));

      if (!attemptResponse.ok) {
        throw new Error(attemptPayload?.message || 'Gagal memulai kuis.');
      }

      setSelectedQuiz({
        ...quizData,
        max_attempts: attemptPayload.max_attempts ?? quizData.max_attempts ?? null,
        attempts_used: attemptPayload.attempts_used ?? quizData.attempts_used ?? 0,
        attempts_remaining:
          attemptPayload.attempts_remaining ?? quizData.attempts_remaining ?? null,
        can_attempt: attemptPayload.can_attempt ?? true,
      });
      setAttemptId(attemptPayload.attempt_id);
      setAnswers({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuka kuis.');
    }
  }

  async function openPreview(quiz: Quiz) {
    setError('');
    setResult(null);
    setAttemptId(null);
    setAnswers({});

    try {
      const detailResponse = await apiFetch(`/quizzes/${quiz.id}`);
      const detail = await detailResponse.json().catch(() => ({}));

      if (!detailResponse.ok) {
        throw new Error(detail?.message || 'Gagal mengambil detail kuis.');
      }

      const quizData: Quiz = detail?.data || detail;

      if (!quizData.can_manage) {
        throw new Error('Preview hanya tersedia untuk pembuat kuis.');
      }

      setSelectedQuiz(quizData);
      setPreviewMode(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuka preview kuis.');
    }
  }

  async function submitAttempt() {
    if (!selectedQuiz || !attemptId) return;

    setSubmitting(true);
    setError('');

    try {
      const payload = Object.entries(answers).map(([questionId, value]) => ({
        question_id: Number(questionId),
        option_id: value.optionId,
        answer_text: value.answerText,
      }));

      const response = await apiFetch(
        `/quizzes/${selectedQuiz.id}/attempts/${attemptId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ answers: payload }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'Gagal mengumpulkan kuis.');
      }

      setResult({
        score: data.score,
        passed: data.passed,
        earned_points: data.earned_points,
        total_points: data.total_points,
        max_attempts: data.max_attempts ?? null,
        attempts_used: data.attempts_used ?? 0,
        attempts_remaining: data.attempts_remaining ?? null,
        can_attempt: data.can_attempt ?? true,
        review: Array.isArray(data.review) ? data.review : [],
      });

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengumpulkan kuis.');
    } finally {
      setSubmitting(false);
    }
  }

  async function retryQuiz() {
    if (!selectedQuiz || !result?.can_attempt) return;

    const quiz = selectedQuiz;
    setSelectedQuiz(null);
    setResult(null);
    setAttemptId(null);
    setAnswers({});

    await openQuiz(quiz);
  }

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setDraftQuestions((current) =>
      current.map((question, i) => (i === index ? { ...question, ...patch } : question)),
    );
  }

  function updateOption(
    questionIndex: number,
    optionIndex: number,
    patch: Partial<QuestionDraft['options'][number]>,
  ) {
    setDraftQuestions((current) =>
      current.map((question, i) => {
        if (i !== questionIndex) return question;

        return {
          ...question,
          options: question.options.map((option, j) =>
            j === optionIndex ? { ...option, ...patch } : option,
          ),
        };
      }),
    );
  }

  function setCorrectOption(questionIndex: number, optionIndex: number) {
    setDraftQuestions((current) =>
      current.map((question, i) => {
        if (i !== questionIndex) return question;

        return {
          ...question,
          options: question.options.map((option, j) => ({
            ...option,
            is_correct: j === optionIndex,
          })),
        };
      }),
    );
  }

  function changeQuestionType(index: number, type: QuestionDraft['question_type']) {
    setDraftQuestions((current) =>
      current.map((question, i) => {
        if (i !== index) return question;

        if (type === 'essay') {
          return { ...question, question_type: type, options: [] };
        }

        if (type === 'true_false') {
          return {
            ...question,
            question_type: type,
            options: [
              { option_text: 'Benar', is_correct: true },
              { option_text: 'Salah', is_correct: false },
            ],
          };
        }

        return {
          ...question,
          question_type: type,
          options: question.options.length >= 2 ? question.options : newQuestion().options,
        };
      }),
    );
  }

  function openCreate() {
    setEditingQuiz(null);
    setForm(emptyForm());
    setDraftQuestions([newQuestion()]);
    setError('');
    setFormOpen(true);
  }

  async function openEdit(quiz: Quiz) {
    setError('');

    try {
      const response = await apiFetch(`/quizzes/${quiz.id}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || 'Gagal mengambil data kuis untuk diedit.');
      }

      const detail: Quiz = payload?.data || payload;

      if (!detail.can_manage) {
        throw new Error('Kamu tidak memiliki izin untuk mengedit kuis ini.');
      }

      setEditingQuiz(detail);
      setForm({
        title: detail.title,
        description: detail.description || '',
        duration_minutes: detail.duration_minutes ? String(detail.duration_minutes) : '',
        pass_score: String(detail.pass_score ?? 70),
        max_attempts: detail.max_attempts ? String(detail.max_attempts) : 'unlimited',
        subject_id: detail.subject_id ? String(detail.subject_id) : '',
      });

      setDraftQuestions(
        detail.questions.map((question) => ({
          question_text: question.question_text,
          question_type: question.question_type,
          points: question.points,
          options: question.options.map((option, index) => ({
            option_text: option.option_text,
            is_correct: option.is_correct ?? index === 0,
          })),
        })),
      );

      setFormOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuka form edit.');
    }
  }

  async function saveQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingQuiz(true);
    setError('');

    try {
      const basePayload = {
        title: form.title,
        description: form.description || null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        max_attempts: form.max_attempts === 'unlimited' ? null : Number(form.max_attempts),
        pass_score: Number(form.pass_score) || 70,
        subject_id: form.subject_id ? Number(form.subject_id) : null,
        is_published: editingQuiz ? editingQuiz.is_published !== false : true,
      };

      const canEditQuestions = !editingQuiz || (editingQuiz.attempt_count ?? 0) === 0;
      const body = {
        ...basePayload,
        ...(canEditQuestions ? { questions: draftQuestions } : {}),
      };

      const response = await apiFetch(
        editingQuiz ? `/quizzes/${editingQuiz.id}` : '/quizzes',
        {
          method: editingQuiz ? 'PUT' : 'POST',
          body: JSON.stringify(body),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || (editingQuiz ? 'Gagal memperbarui kuis.' : 'Gagal membuat kuis.'),
        );
      }

      setFormOpen(false);
      const wasCreating = !editingQuiz;
      setEditingQuiz(null);
      setForm(emptyForm());
      setDraftQuestions([newQuestion()]);

      if (wasCreating) {
        setQuizStatus('active');
        await loadData('active');
      } else {
        await loadData(quizStatus);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingQuiz
            ? 'Gagal memperbarui kuis.'
            : 'Gagal membuat kuis.',
      );
    } finally {
      setSavingQuiz(false);
    }
  }

  async function deactivateQuiz(quiz: Quiz) {
    if (!quiz.can_manage) return;

    setDeactivatingId(quiz.id);
    setError('');

    try {
      const response = await apiFetch(`/quizzes/${quiz.id}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'Gagal menonaktifkan kuis.');
      }

      if (selectedQuiz?.id === quiz.id) {
        setSelectedQuiz(null);
      }

      setDeactivateTarget(null);
      setQuizStatus('inactive');
      await loadData('inactive');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menonaktifkan kuis.');
    } finally {
      setDeactivatingId(null);
    }
  }

  async function reactivateQuiz(quiz: Quiz) {
    if (!quiz.can_manage) return;

    setReactivatingId(quiz.id);
    setError('');

    try {
      const response = await apiFetch(`/quizzes/${quiz.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_published: true }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'Gagal mengaktifkan kembali kuis.');
      }

      setQuizStatus('active');
      await loadData('active');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengaktifkan kembali kuis.');
    } finally {
      setReactivatingId(null);
    }
  }

  return (
    <div className="w-full space-y-6 pb-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <FileQuestion className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                Interactive Quiz
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Kuis Belajar
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Buat, kerjakan, edit, dan kelola kuis pembelajaran.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Buat Kuis
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setQuizStatus('active')}
          className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            quizStatus === 'active'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Kuis Aktif
        </button>
        <button
          type="button"
          onClick={() => setQuizStatus('inactive')}
          className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            quizStatus === 'inactive'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Kuis Nonaktif Saya
        </button>
        <p className="ml-auto hidden px-2 text-[11px] text-slate-400 sm:block">
          {quizStatus === 'active'
            ? 'Kuis aktif dapat dilihat dan dikerjakan pengguna.'
            : 'Hanya kuis nonaktif milikmu yang ditampilkan.'}
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
          Memuat kuis...
        </div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-slate-300" />
          <h2 className="mt-4 text-base font-bold text-slate-700">
            {quizStatus === 'active' ? 'Belum ada kuis aktif' : 'Belum ada kuis nonaktif'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {quizStatus === 'active'
              ? 'Buat kuis pertama untuk mulai belajar interaktif.'
              : 'Kuis yang kamu nonaktifkan akan tersimpan di sini dan dapat diaktifkan kembali.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => {
            const attemptLabel =
              quiz.max_attempts === null || quiz.max_attempts === undefined
                ? `${quiz.attempts_used ?? 0} selesai · tidak terbatas`
                : `${quiz.attempts_used ?? 0}/${quiz.max_attempts} percobaan`;

            const actionLabel = quiz.has_in_progress_attempt
              ? 'Lanjutkan Kuis'
              : (quiz.attempts_used ?? 0) > 0
                ? 'Kerjakan Lagi'
                : 'Kerjakan Kuis';

            return (
              <article
                key={quiz.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                      quiz.is_published === false
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {quiz.is_published === false ? 'Nonaktif' : `Lulus ${quiz.pass_score}%`}
                    </span>
                    {quiz.is_published === false && (
                      <span className="text-[9px] font-semibold text-slate-400">Lulus {quiz.pass_score}%</span>
                    )}
                  </div>
                </div>

                <h3 className="mt-5 line-clamp-2 text-base font-bold text-slate-900">
                  {quiz.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                  {quiz.description || 'Tidak ada deskripsi kuis.'}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500">
                  <span>{quiz.subject_name || 'Umum'}</span>
                  <span>• {quiz.question_count} soal</span>
                  {quiz.duration_minutes && (
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {quiz.duration_minutes} menit
                    </span>
                  )}
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-500">
                  Percobaan: {attemptLabel}
                </div>

                <p className="mt-3 text-[10px] text-slate-400">
                  Dibuat oleh {quiz.creator_name || 'Mahasiswa'}
                </p>

                {quiz.can_manage ? (
                  <button
                    type="button"
                    onClick={() => openPreview(quiz)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    <BookOpen className="h-4 w-4" />
                    Preview Kuis
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={quiz.can_attempt === false && !quiz.has_in_progress_attempt}
                    onClick={() => openQuiz(quiz)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    <BookOpen className="h-4 w-4" />
                    {quiz.can_attempt === false && !quiz.has_in_progress_attempt
                      ? 'Batas Percobaan Tercapai'
                      : actionLabel}
                  </button>
                )}

                {quiz.can_manage && (
                  <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(quiz)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>
                    {quiz.is_published === false ? (
                      <button
                        type="button"
                        disabled={reactivatingId === quiz.id}
                        onClick={() => reactivateQuiz(quiz)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                      >
                        {reactivatingId === quiz.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Aktifkan Kembali
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={deactivatingId === quiz.id}
                        onClick={() => setDeactivateTarget(quiz)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        {deactivatingId === quiz.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Nonaktifkan
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                  {previewMode ? 'Preview Kuis' : 'Mengerjakan Kuis'}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{selectedQuiz.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedQuiz(null); setPreviewMode(false); }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {result ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Trophy className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-slate-900">Nilai {result.score}%</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {result.earned_points} dari {result.total_points} poin
                </p>
                <div
                  className={`mx-auto mt-5 w-fit rounded-full px-4 py-2 text-xs font-bold ${
                    result.passed
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {result.passed ? 'Lulus' : 'Belum lulus'}
                </div>
                <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  {result.max_attempts === null
                    ? `Percobaan selesai: ${result.attempts_used} · tidak terbatas`
                    : `Percobaan ${result.attempts_used} dari ${result.max_attempts}`}
                </div>

                {result.review.length > 0 && (
                  <div className="mt-7 text-left">
                    <div className="mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                        Review Jawaban
                      </p>
                      <h4 className="mt-1 text-base font-bold text-slate-900">
                        Pembahasan hasil kuis
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Jawaban benar baru ditampilkan setelah kuis dikumpulkan.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {result.review.map((item, index) => {
                        const isEssay = item.question_type === 'essay';
                        const userAnswer = isEssay
                          ? item.user_answer?.answer_text || 'Tidak dijawab'
                          : item.user_answer?.option_text || 'Tidak dijawab';

                        return (
                          <div
                            key={item.question_id}
                            className={`rounded-2xl border p-4 ${
                              isEssay
                                ? 'border-amber-200 bg-amber-50/50'
                                : item.is_correct
                                  ? 'border-emerald-200 bg-emerald-50/50'
                                  : 'border-red-200 bg-red-50/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-bold leading-6 text-slate-900">
                                {index + 1}. {item.question_text}
                              </p>
                              <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  isEssay
                                    ? 'bg-amber-100 text-amber-700'
                                    : item.is_correct
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {isEssay ? 'Esai' : item.is_correct ? 'Benar' : 'Salah'}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl border border-white/80 bg-white p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  Jawaban kamu
                                </p>
                                <p className="mt-1.5 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-700">
                                  {userAnswer}
                                </p>
                              </div>

                              {isEssay ? (
                                <div className="rounded-xl border border-amber-100 bg-white p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
                                    Penilaian
                                  </p>
                                  <p className="mt-1.5 text-xs leading-5 text-slate-600">
                                    Jawaban esai disimpan, tetapi belum dinilai otomatis.
                                  </p>
                                </div>
                              ) : (
                                <div className="rounded-xl border border-white/80 bg-white p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                                    Jawaban benar
                                  </p>
                                  <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-700">
                                    {item.correct_answer?.option_text || 'Tidak tersedia'}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                              <span>Bobot {item.points} poin</span>
                              <span>Diperoleh {item.points_awarded} poin</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {result.can_attempt ? (
                  <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setSelectedQuiz(null)}
                      className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Tutup
                    </button>
                    <button
                      type="button"
                      onClick={retryQuiz}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Kerjakan Lagi
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="mt-4 text-xs font-semibold text-amber-700">
                      Batas percobaan kuis telah tercapai.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedQuiz(null)}
                      className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Tutup
                    </button>
                  </>
                )}
              </div>
            ) : previewMode ? (
              <div className="space-y-5 p-5 sm:p-6">
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
                  Ini adalah mode preview creator. Membuka preview tidak membuat attempt, tidak mengurangi batas percobaan, dan jawaban benar ditandai untuk membantu pengecekan soal.
                </div>

                {selectedQuiz.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold leading-6 text-slate-900">
                        {index + 1}. {question.question_text}
                      </p>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                        {question.points} poin
                      </span>
                    </div>

                    {question.question_type === 'essay' ? (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                        Ini soal esai lama. Pembuatan soal esai baru sudah dinonaktifkan karena fase Quiz saat ini memakai soal yang dapat dinilai otomatis.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${
                              option.is_correct
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                option.is_correct
                                  ? 'border-emerald-500 bg-emerald-500 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {option.is_correct && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </span>
                            <span>{option.option_text}</span>
                            {option.is_correct && (
                              <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                Jawaban benar
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => { setSelectedQuiz(null); setPreviewMode(false); }}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Tutup Preview
                </button>
              </div>
            ) : (
              <div className="space-y-5 p-5 sm:p-6">
                {selectedQuiz.questions.map((question, index) => {
                  const currentAnswer = answers[question.id];

                  return (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold leading-6 text-slate-900">
                          {index + 1}. {question.question_text}
                        </p>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                          {question.points} poin
                        </span>
                      </div>

                      {question.question_type === 'essay' ? (
                        <textarea
                          rows={4}
                          value={currentAnswer?.answerText || ''}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: { answerText: e.target.value },
                            }))
                          }
                          placeholder="Tulis jawabanmu..."
                          className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                        />
                      ) : (
                        <div className="mt-4 space-y-2">
                          {question.options.map((option) => (
                            <label
                              key={option.id}
                              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 hover:bg-white"
                            >
                              <input
                                type="radio"
                                name={`q-${question.id}`}
                                checked={currentAnswer?.optionId === option.id}
                                onChange={() =>
                                  setAnswers((prev) => ({
                                    ...prev,
                                    [question.id]: { optionId: option.id },
                                  }))
                                }
                                className="h-4 w-4 accent-blue-600"
                              />
                              <span>{option.option_text}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitAttempt}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Mengirim...' : 'Kumpulkan Kuis'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {deactivateTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">Nonaktifkan Kuis?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              <span className="font-semibold text-slate-700">{deactivateTarget.title}</span> akan
              hilang dari daftar kuis aktif. Riwayat attempt, jawaban, dan nilai tetap disimpan.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deactivatingId === deactivateTarget.id}
                onClick={() => setDeactivateTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deactivatingId === deactivateTarget.id}
                onClick={() => deactivateQuiz(deactivateTarget)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deactivatingId === deactivateTarget.id && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                  {editingQuiz ? 'Manage Quiz' : 'Create Quiz'}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {editingQuiz ? 'Edit Kuis' : 'Buat Kuis Baru'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveQuiz} className="space-y-5 p-5 sm:p-6">
              {editingQuiz && (editingQuiz.attempt_count ?? 0) > 0 && (
                <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold">Soal dikunci karena kuis sudah pernah dikerjakan.</p>
                    <p className="mt-1 text-xs leading-5">
                      Kamu masih bisa mengubah judul, mata kuliah, deskripsi, durasi, nilai lulus, dan batas percobaan.
                      Soal tidak diubah agar riwayat attempt dan jawaban tetap konsisten.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Judul kuis</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 [color-scheme:light] placeholder:text-slate-400 outline-none focus:border-blue-400 focus:bg-white"
                    placeholder="Contoh: Quiz Basis Data"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Mata kuliah</label>
                  <select
                    value={form.subject_id}
                    onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 [color-scheme:light] outline-none"
                  >
                    <option value="">Umum</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Durasi (menit)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 [color-scheme:light] outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Maksimal percobaan
                  </label>
                  <select
                    value={form.max_attempts}
                    onChange={(e) => setForm({ ...form, max_attempts: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 [color-scheme:light] outline-none"
                  >
                    <option value="1">1 kali</option>
                    <option value="3">3 kali</option>
                    <option value="unlimited">Tidak terbatas</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Nilai lulus (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.pass_score}
                    onChange={(e) => setForm({ ...form, pass_score: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 [color-scheme:light] outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Deskripsi</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 [color-scheme:light] outline-none"
                    placeholder="Opsional"
                  />
                </div>
              </div>

              {(!editingQuiz || (editingQuiz.attempt_count ?? 0) === 0) && (
                <>
                  <div className="space-y-4">
                    {draftQuestions.map((question, qIndex) => (
                      <div
                        key={qIndex}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-700">Pertanyaan {qIndex + 1}</p>
                          {draftQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setDraftQuestions((current) =>
                                  current.filter((_, i) => i !== qIndex),
                                )
                              }
                              className="text-[10px] font-bold text-red-500"
                            >
                              Hapus
                            </button>
                          )}
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_100px]">
                          <textarea
                            required
                            rows={3}
                            value={question.question_text}
                            onChange={(e) =>
                              updateQuestion(qIndex, { question_text: e.target.value })
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 [color-scheme:light] placeholder:text-slate-400 outline-none"
                            placeholder="Tulis pertanyaan..."
                          />
                          <select
                            value={question.question_type}
                            onChange={(e) =>
                              changeQuestionType(
                                qIndex,
                                e.target.value as QuestionDraft['question_type'],
                              )
                            }
                            className="h-fit rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 [color-scheme:light]"
                          >
                            <option value="multiple_choice">Pilihan ganda</option>
                            <option value="true_false">Benar / Salah</option>
                          </select>
                          <input
                            type="number"
                            min="1"
                            value={question.points}
                            onChange={(e) =>
                              updateQuestion(qIndex, { points: Number(e.target.value) || 1 })
                            }
                            className="h-fit rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 [color-scheme:light]"
                          />
                        </div>

                        {question.question_type !== 'essay' && (
                          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${qIndex}`}
                                  checked={option.is_correct}
                                  onChange={() => setCorrectOption(qIndex, oIndex)}
                                  className="accent-blue-600"
                                />
                                <input
                                  required
                                  value={option.option_text}
                                  onChange={(e) =>
                                    updateOption(qIndex, oIndex, {
                                      option_text: e.target.value,
                                    })
                                  }
                                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 [color-scheme:light] placeholder:text-slate-400"
                                  placeholder={`Opsi ${oIndex + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDraftQuestions((current) => [...current, newQuestion()])}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah pertanyaan
                  </button>
                </>
              )}

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                  disabled={savingQuiz}
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingQuiz ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {savingQuiz
                    ? 'Menyimpan...'
                    : editingQuiz
                      ? 'Simpan Perubahan'
                      : 'Publikasikan Kuis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
