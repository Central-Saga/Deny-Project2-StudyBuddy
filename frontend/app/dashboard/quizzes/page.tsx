'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

interface QuizOption {
  id: number;
  option_text: string;
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
  title: string;
  description?: string | null;
  duration_minutes?: number | null;
  pass_score: number;
  subject_name?: string | null;
  creator_name?: string | null;
  question_count: number;
  questions: QuizQuestion[];
}

interface QuestionDraft {
  question_text: string;
  question_type: QuizQuestion['question_type'];
  points: number;
  options: { option_text: string; is_correct: boolean }[];
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEYS = ['meetspace_auth_token', 'access_token'];

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

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, { optionId?: number; answerText?: string }>>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; earned_points: number; total_points: number } | null>(null);
  const [form, setForm] = useState({ title: '', description: '', duration_minutes: '30', pass_score: '70', subject_id: '' });
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[]>([newQuestion()]);
  const [savingQuiz, setSavingQuiz] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [quizResponse, subjectResponse] = await Promise.all([
        apiFetch('/quizzes'),
        apiFetch('/subjects'),
      ]);
      if (quizResponse.status === 401) throw new Error('Sesi login berakhir. Silakan login kembali.');
      if (!quizResponse.ok) throw new Error('Gagal mengambil data kuis.');
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
    loadData();
  }, []);

  async function openQuiz(quiz: Quiz) {
    setError('');
    setResult(null);
    try {
      const detailResponse = await apiFetch(`/quizzes/${quiz.id}`);
      if (!detailResponse.ok) throw new Error('Gagal mengambil detail kuis.');
      const detail = await detailResponse.json();
      const quizData: Quiz = detail?.data || detail;
      const attemptResponse = await apiFetch(`/quizzes/${quiz.id}/attempts`, { method: 'POST' });
      const attemptPayload = await attemptResponse.json();
      if (!attemptResponse.ok) throw new Error(attemptPayload?.message || 'Gagal memulai kuis.');
      setSelectedQuiz(quizData);
      setAttemptId(attemptPayload.attempt_id);
      setAnswers({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuka kuis.');
    }
  }

  async function submitAttempt() {
    if (!selectedQuiz || !attemptId) return;
    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([questionId, value]) => ({
        question_id: Number(questionId),
        option_id: value.optionId,
        answer_text: value.answerText,
      }));
      const response = await apiFetch(`/quizzes/${selectedQuiz.id}/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Gagal mengumpulkan kuis.');
      setResult({
        score: data.score,
        passed: data.passed,
        earned_points: data.earned_points,
        total_points: data.total_points,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengumpulkan kuis.');
    } finally {
      setSubmitting(false);
    }
  }

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setDraftQuestions((current) => current.map((question, i) => (i === index ? { ...question, ...patch } : question)));
  }

  function updateOption(questionIndex: number, optionIndex: number, patch: Partial<QuestionDraft['options'][number]>) {
    setDraftQuestions((current) => current.map((question, i) => {
      if (i !== questionIndex) return question;
      return {
        ...question,
        options: question.options.map((option, j) => (j === optionIndex ? { ...option, ...patch } : option)),
      };
    }));
  }

  function setCorrectOption(questionIndex: number, optionIndex: number) {
    setDraftQuestions((current) => current.map((question, i) => {
      if (i !== questionIndex) return question;
      return { ...question, options: question.options.map((option, j) => ({ ...option, is_correct: j === optionIndex })) };
    }));
  }

  function changeQuestionType(index: number, type: QuestionDraft['question_type']) {
    setDraftQuestions((current) => current.map((question, i) => {
      if (i !== index) return question;
      if (type === 'essay') return { ...question, question_type: type, options: [] };
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
      return { ...question, question_type: type, options: question.options.length >= 2 ? question.options : newQuestion().options };
    }));
  }

  async function createQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingQuiz(true);
    setError('');
    try {
      const response = await apiFetch('/quizzes', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          duration_minutes: Number(form.duration_minutes) || null,
          pass_score: Number(form.pass_score) || 70,
          subject_id: form.subject_id ? Number(form.subject_id) : null,
          is_published: true,
          questions: draftQuestions,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Gagal membuat kuis.');
      setCreateOpen(false);
      setForm({ title: '', description: '', duration_minutes: '30', pass_score: '70', subject_id: '' });
      setDraftQuestions([newQuestion()]);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat kuis.');
    } finally {
      setSavingQuiz(false);
    }
  }

  return (
    <div className="w-full space-y-6 pb-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200"><FileQuestion className="h-6 w-6" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">Interactive Quiz</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Kuis Belajar</h1>
              <p className="mt-1 text-sm text-slate-500">Buat, kerjakan, dan lihat hasil kuis langsung dari database.</p>
            </div>
          </div>
          <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Buat Kuis</button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />Memuat kuis...</div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center"><Sparkles className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-4 text-base font-bold text-slate-700">Belum ada kuis</h2><p className="mt-1 text-sm text-slate-400">Buat kuis pertama untuk mulai belajar interaktif.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => (
            <button key={quiz.id} type="button" onClick={() => openQuiz(quiz)} className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><BookOpen className="h-5 w-5" /></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Lulus {quiz.pass_score}%</span></div>
              <h3 className="mt-5 line-clamp-2 text-base font-bold text-slate-900">{quiz.title}</h3>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{quiz.description || 'Tidak ada deskripsi kuis.'}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500"><span>{quiz.subject_name || 'Umum'}</span><span>• {quiz.question_count} soal</span>{quiz.duration_minutes && <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{quiz.duration_minutes} menit</span>}</div>
              <p className="mt-3 text-[10px] text-slate-400">Dibuat oleh {quiz.creator_name || 'Mahasiswa'}</p>
            </button>
          ))}
        </div>
      )}

      {selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">Mengerjakan Kuis</p><h2 className="mt-1 text-lg font-bold text-slate-900">{selectedQuiz.title}</h2></div>
              <button type="button" onClick={() => setSelectedQuiz(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            {result ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Trophy className="h-8 w-8" /></div>
                <h3 className="mt-5 text-2xl font-bold text-slate-900">Nilai {result.score}%</h3>
                <p className="mt-2 text-sm text-slate-500">{result.earned_points} dari {result.total_points} poin</p>
                <div className={`mx-auto mt-5 w-fit rounded-full px-4 py-2 text-xs font-bold ${result.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{result.passed ? 'Lulus' : 'Belum lulus'}</div>
                <button type="button" onClick={() => setSelectedQuiz(null)} className="mt-7 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800">Tutup</button>
              </div>
            ) : (
              <div className="space-y-5 p-5 sm:p-6">
                {selectedQuiz.questions.map((question, index) => {
                  const currentAnswer = answers[question.id];
                  return <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold leading-6 text-slate-900">{index + 1}. {question.question_text}</p><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{question.points} poin</span></div>
                    {question.question_type === 'essay' ? (
                      <textarea rows={4} value={currentAnswer?.answerText || ''} onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: { answerText: e.target.value } }))} placeholder="Tulis jawabanmu..." className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white" />
                    ) : (
                      <div className="mt-4 space-y-2">{question.options.map((option) => <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 hover:bg-white"><input type="radio" name={`q-${question.id}`} checked={currentAnswer?.optionId === option.id} onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: { optionId: option.id } }))} className="h-4 w-4 accent-blue-600" /><span>{option.option_text}</span></label>)}</div>
                    )}
                  </div>;
                })}
                <button type="button" disabled={submitting} onClick={submitAttempt} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Send className="h-4 w-4" /> {submitting ? 'Mengirim...' : 'Kumpulkan Kuis'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">Create Quiz</p><h2 className="mt-1 text-lg font-bold text-slate-900">Buat Kuis Baru</h2></div><button type="button" onClick={() => setCreateOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <form onSubmit={createQuiz} className="space-y-5 p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2"><label className="mb-1.5 block text-xs font-bold text-slate-600">Judul kuis</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white" placeholder="Contoh: Quiz Basis Data" /></div>
                <div><label className="mb-1.5 block text-xs font-bold text-slate-600">Mata kuliah</label><select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none"><option value="">Umum</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>
                <div><label className="mb-1.5 block text-xs font-bold text-slate-600">Durasi (menit)</label><input type="number" min="1" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none" /></div>
                <div><label className="mb-1.5 block text-xs font-bold text-slate-600">Nilai lulus (%)</label><input type="number" min="0" max="100" value={form.pass_score} onChange={(e) => setForm({ ...form, pass_score: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none" /></div>
                <div><label className="mb-1.5 block text-xs font-bold text-slate-600">Deskripsi</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none" placeholder="Opsional" /></div>
              </div>

              <div className="space-y-4">
                {draftQuestions.map((question, qIndex) => <div key={qIndex} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-slate-700">Pertanyaan {qIndex + 1}</p>{draftQuestions.length > 1 && <button type="button" onClick={() => setDraftQuestions((current) => current.filter((_, i) => i !== qIndex))} className="text-[10px] font-bold text-red-500">Hapus</button>}</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_100px]">
                    <textarea required rows={3} value={question.question_text} onChange={(e) => updateQuestion(qIndex, { question_text: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none" placeholder="Tulis pertanyaan..." />
                    <select value={question.question_type} onChange={(e) => changeQuestionType(qIndex, e.target.value as QuestionDraft['question_type'])} className="h-fit rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="multiple_choice">Pilihan ganda</option><option value="true_false">Benar / Salah</option><option value="essay">Esai</option></select>
                    <input type="number" min="1" value={question.points} onChange={(e) => updateQuestion(qIndex, { points: Number(e.target.value) || 1 })} className="h-fit rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm" />
                  </div>
                  {question.question_type !== 'essay' && <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">{question.options.map((option, oIndex) => <div key={oIndex} className="flex items-center gap-2"><input type="radio" name={`correct-${qIndex}`} checked={option.is_correct} onChange={() => setCorrectOption(qIndex, oIndex)} className="accent-blue-600" /><input required value={option.option_text} onChange={(e) => updateOption(qIndex, oIndex, { option_text: e.target.value })} className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder={`Opsi ${oIndex + 1}`} /></div>)}</div>}
                </div>)}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between"><button type="button" onClick={() => setDraftQuestions((current) => [...current, newQuestion()])} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"><Plus className="h-4 w-4" /> Tambah pertanyaan</button><button disabled={savingQuiz} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"><CheckCircle2 className="h-4 w-4" /> {savingQuiz ? 'Menyimpan...' : 'Publikasikan Kuis'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
