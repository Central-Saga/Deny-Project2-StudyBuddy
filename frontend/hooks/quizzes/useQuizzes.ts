import { FormEvent, useEffect, useState } from 'react';
import type {
  QuestionDraft,
  Quiz,
  QuizAnswers,
  QuizForm,
  QuizResult,
} from '@/components/quizzes/types';
import {
  apiFetch,
  emptyForm,
  newQuestion,
} from '@/components/quizzes/utils';

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizListError, setQuizListError] = useState('');
  const [quizStatus, setQuizStatus] = useState<'active' | 'inactive'>('active');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
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
    setQuizListError('');
    try {
      const [quizResponse, subjectResponse] = await Promise.all([
        apiFetch(status === 'inactive' ? '/quizzes?status=inactive' : '/quizzes'),
        apiFetch('/subjects'),
      ]);
      if (quizResponse.status === 401 || subjectResponse.status === 401) {
        throw new Error('Sesi login berakhir. Silakan login kembali.');
      }
      if (!quizResponse.ok) {
        throw new Error('Gagal mengambil data kuis.');
      }
      if (!subjectResponse.ok) {
        throw new Error('Gagal mengambil data mata kuliah.');
      }
      const quizPayload = await quizResponse.json().catch(() => null);
      const subjectPayload = await subjectResponse.json().catch(() => null);
      const quizItems = Array.isArray(quizPayload)
        ? quizPayload
        : quizPayload?.data;
      const subjectItems = Array.isArray(subjectPayload)
        ? subjectPayload
        : subjectPayload?.data;
      if (!Array.isArray(quizItems) || !Array.isArray(subjectItems)) {
        throw new Error('Respons daftar kuis dari server tidak valid.');
      }
      setQuizzes(quizItems);
      setSubjects(subjectItems);
    } catch (err) {
      setQuizListError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat kuis.'
      );
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

  return {
    quizzes,
    subjects,
    loading,
    error,
    quizListError,
    quizStatus,
    setQuizStatus,
    selectedQuiz,
    setSelectedQuiz,
    previewMode,
    setPreviewMode,
    answers,
    setAnswers,
    submitting,
    result,
    formOpen,
    setFormOpen,
    editingQuiz,
    form,
    setForm,
    draftQuestions,
    setDraftQuestions,
    savingQuiz,
    deactivatingId,
    reactivatingId,
    deactivateTarget,
    setDeactivateTarget,
    loadData,
    openQuiz,
    openPreview,
    submitAttempt,
    retryQuiz,
    updateQuestion,
    updateOption,
    setCorrectOption,
    changeQuestionType,
    openCreate,
    openEdit,
    saveQuiz,
    deactivateQuiz,
    reactivateQuiz,
  };
}
