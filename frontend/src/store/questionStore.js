import { create } from 'zustand';
import api from '../lib/axios';

export const useQuestionStore = create((set) => ({
  questions: [],
  total: 0,
  pages: 1,
  loading: false,

  fetchQuestions: async (params = {}) => {
    set({ loading: true });
    const { data } = await api.get('/questions', { params });
    set({ questions: data.questions, total: data.total, pages: data.pages, loading: false });
    return data;
  },

  createQuestion: async (payload) => {
    const { data } = await api.post('/questions', payload);
    set((s) => ({ questions: [data.question, ...s.questions] }));
    return data.question;
  },

  updateQuestion: async (id, payload) => {
    const { data } = await api.put(`/questions/${id}`, payload);
    set((s) => ({
      questions: s.questions.map((q) => (q._id === id ? data.question : q)),
    }));
    return data.question;
  },

  deleteQuestion: async (id) => {
    await api.delete(`/questions/${id}`);
    set((s) => ({ questions: s.questions.filter((q) => q._id !== id) }));
  },

  toggleBookmark: async (id) => {
    const { data } = await api.post(`/questions/${id}/bookmark`);
    return data;
  },
}));