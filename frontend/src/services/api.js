import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    'Accept': 'application/json',
  },
});

/**
 * Upload a PDF file and extract text
 */
export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Analyze extracted document text
 */
export const analyzeDocument = async ({ text, income, goal, language }) => {
  const response = await api.post('/analyze', {
    text,
    income: income ? parseFloat(income) : null,
    goal: goal || null,
    language: language || 'English',
  });
  return response.data;
};

/**
 * Chat about the document
 */
export const chatWithDocument = async ({ question, documentText, language }) => {
  const response = await api.post('/chat', {
    question,
    document_text: documentText || '',
    language: language || 'English',
  });
  return response.data;
};

export default api;
