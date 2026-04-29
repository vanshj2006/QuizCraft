import { create } from 'zustand';
import api from '../lib/axios';

export const useQuizStore = create((set) => ({
  myQuizzes: [],
  publicQuizzes: [],
  currentQuiz: null,
  loading: false,

  fetchMyQuizzes: async () => {
    set({ loading: true });
    const { data } = await api.get('/quizzes/mine');
    set({ myQuizzes: data.quizzes, loading: false });
  },

  fetchPublicQuizzes: async (params = {}) => {
    set({ loading: true });
    const { data } = await api.get('/quizzes/public', { params });
    set({ publicQuizzes: data.quizzes, loading: false });
    return data;
  },

  fetchQuiz: async (id) => {
    const { data } = await api.get(`/quizzes/${id}`);
    set({ currentQuiz: data.quiz });
    return data.quiz;
  },

  createQuiz: async (payload) => {
    const { data } = await api.post('/quizzes', payload);
    set((s) => ({ myQuizzes: [data.quiz, ...s.myQuizzes] }));
    return data.quiz;
  },

  updateQuiz: async (id, payload) => {
    const { data } = await api.put(`/quizzes/${id}`, payload);
    set((s) => ({
      myQuizzes: s.myQuizzes.map((q) => (q._id === id ? data.quiz : q)),
      currentQuiz: data.quiz,
    }));
    return data.quiz;
  },

  deleteQuiz: async (id) => {
    await api.delete(`/quizzes/${id}`);
    set((s) => ({ myQuizzes: s.myQuizzes.filter((q) => q._id !== id) }));
  },

  publishQuiz: async (id) => {
    const { data } = await api.patch(`/quizzes/${id}/publish`);
    set((s) => ({
      myQuizzes: s.myQuizzes.map((q) => (q._id === id ? data.quiz : q)),
    }));
    return data;
  },

  submitAttempt: async (id, answers, timeTaken) => {
    const { data } = await api.post(`/quizzes/${id}/attempt`, { answers, timeTaken });
    return data;
  },

  addQuestionToQuiz: async (quizId, questionId) => {
    const { data } = await api.post(`/quizzes/${quizId}/questions`, { questionId });
    return data;
  },
}));