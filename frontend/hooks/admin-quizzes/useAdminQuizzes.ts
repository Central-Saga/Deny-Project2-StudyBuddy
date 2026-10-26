import { useQuizzesData } from './useQuizzesData';
import { useQuizModeration } from './useQuizModeration';

export function useAdminQuizzes() {
  const data = useQuizzesData();

  const moderation = useQuizModeration({
    handleUnauthorized: data.handleUnauthorized,
    loadQuizzes: data.loadQuizzes,
    setSelectedQuiz: data.setSelectedQuiz,
    setError: data.setError,
    setSuccess: data.setSuccess,
  });

  return { ...data, ...moderation };
}
