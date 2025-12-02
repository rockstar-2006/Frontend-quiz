// API Service - connects frontend to backend
// Toggle USE_MOCK to switch between mock (for preview) and real backend

const USE_MOCK = false; // Set to false when connecting to real backend
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api') as string;

import { Quiz, Question, GameState, Player } from '@/types/quiz';
import * as mockApi from './mockApi';

// ---------- Helpers to normalize backend data ----------

// Some backends send `_id`, but our TS types use `id`
const normalizeQuestion = (q: any): Question => {
  if (!q) return q;
  return {
    ...q,
    id: q.id ?? q._id, // prefer id, fallback to _id
  };
};

const normalizeQuiz = (raw: any): Quiz => {
  if (!raw) return raw;
  return {
    ...raw,
    id: raw.id ?? raw._id,
    questions: Array.isArray(raw.questions)
      ? raw.questions.map(normalizeQuestion)
      : [],
  };
};

const normalizeGame = (raw: any): GameState => {
  if (!raw) return raw;

  // Figure out where the quiz data lives:
  // - some backends send `quiz`
  // - others send populated quiz under `quizId`
  const quizRaw =
    raw.quiz ??
    (raw.quizId && typeof raw.quizId === 'object' ? raw.quizId : undefined);

  const quiz = quizRaw ? normalizeQuiz(quizRaw) : undefined;

  return {
    ...raw,
    id: raw.id ?? raw._id,
    quiz,                                 // always expose quiz if we have it
    quizId: quiz ? quiz.id : raw.quizId,  // ensure quizId is just the id
    players: Array.isArray(raw.players)
      ? raw.players.map((p: any) => ({
          ...p,
          id: p.id ?? p._id ?? p.playerId, // be defensive
        }))
      : [],
  } as GameState;
};

// ---------- Quiz API ----------

export const createQuiz = async (
  title: string,
  description: string,
  hostId: string
): Promise<Quiz> => {
  if (USE_MOCK) return mockApi.createQuiz(title, description, hostId);

  const response = await fetch(`${API_BASE_URL}/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, hostId, questions: [] }),
  });

  if (!response.ok) {
    throw new Error(`createQuiz failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  return normalizeQuiz(raw);
};

export const getQuizzesByHost = async (hostId: string): Promise<Quiz[]> => {
  if (USE_MOCK) return mockApi.getQuizzesByHost(hostId);

  const response = await fetch(`${API_BASE_URL}/quizzes/host/${hostId}`);
  if (!response.ok) {
    throw new Error(`getQuizzesByHost failed: ${response.status} ${response.statusText}`);
  }
  const raw = await response.json();
  return Array.isArray(raw) ? raw.map(normalizeQuiz) : [];
};

export const getQuiz = async (quizId: string): Promise<Quiz | null> => {
  if (USE_MOCK) return mockApi.getQuiz(quizId);

  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`);
  if (!response.ok) return null;
  const raw = await response.json();
  return normalizeQuiz(raw);
};

export const updateQuiz = async (quiz: Quiz): Promise<Quiz> => {
  if (USE_MOCK) return mockApi.updateQuiz(quiz);

  // ensure we have an id to send
  const id = quiz.id as string;
  const response = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quiz),
  });

  if (!response.ok) {
    throw new Error(`updateQuiz failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  return normalizeQuiz(raw);
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  if (USE_MOCK) return mockApi.deleteQuiz(quizId);

  await fetch(`${API_BASE_URL}/quizzes/${quizId}`, { method: 'DELETE' });
};

export const addQuestionToQuiz = async (
  quizId: string,
  question: Omit<Question, 'id'>
): Promise<Quiz> => {
  if (USE_MOCK) return mockApi.addQuestionToQuiz(quizId, question);

  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(question),
  });

  if (!response.ok) {
    throw new Error(`addQuestionToQuiz failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  return normalizeQuiz(raw);
};

export const removeQuestionFromQuiz = async (
  quizId: string,
  questionId: string
): Promise<Quiz> => {
  if (USE_MOCK) return mockApi.removeQuestionFromQuiz(quizId, questionId);

  const response = await fetch(
    `${API_BASE_URL}/quizzes/${quizId}/questions/${questionId}`,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    throw new Error(`removeQuestionFromQuiz failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  return normalizeQuiz(raw);
};

// ---------- Game API ----------

export const createGame = async (
  quizId: string,
  hostId: string
): Promise<GameState> => {
  if (USE_MOCK) return mockApi.createGame(quizId, hostId);

  const response = await fetch(`${API_BASE_URL}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quizId, hostId }),
  });

  if (!response.ok) {
    throw new Error(`createGame failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  return normalizeGame(raw);
};

export const getGameByPin = async (pin: string): Promise<GameState | null> => {
  if (USE_MOCK) return mockApi.getGameByPin(pin);

  const response = await fetch(`${API_BASE_URL}/games/pin/${pin}`);
  if (!response.ok) return null;
  const raw = await response.json();
  return normalizeGame(raw);
};

export const getGame = async (gameId: string): Promise<GameState | null> => {
  if (USE_MOCK) return mockApi.getGame(gameId);

  const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
  if (!response.ok) return null;
  const raw = await response.json();
  return normalizeGame(raw);
};

export const joinGame = async (
  pin: string,
  nickname: string,
  avatarId: number,
  playerId: string
): Promise<{ game: GameState; player: Player } | null> => {
  if (USE_MOCK) return mockApi.joinGame(pin, nickname, avatarId, playerId);

  const response = await fetch(`${API_BASE_URL}/games/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, nickname, avatarId, playerId }),
  });

  if (!response.ok) return null;

  const rawGame = await response.json();
  const game = normalizeGame(rawGame);
  const player = game.players.find((p: Player) => p.id === playerId);

  return { game, player };
};

export const leaveGame = async (
  gameId: string,
  playerId: string
): Promise<void> => {
  if (USE_MOCK) return mockApi.leaveGame(gameId, playerId);

  await fetch(`${API_BASE_URL}/games/${gameId}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId }),
  });
};

export const startGame = async (gameId: string): Promise<GameState> => {
  if (USE_MOCK) return mockApi.startGame(gameId);

  const response = await fetch(`${API_BASE_URL}/games/${gameId}/start`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`startGame failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  return normalizeGame(raw);
};

export const startQuestion = async (gameId: string): Promise<GameState> => {
  if (USE_MOCK) return mockApi.startQuestion(gameId);

  const response = await fetch(`${API_BASE_URL}/games/${gameId}/start-question`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`startQuestion failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  return normalizeGame(raw);
};

export const submitAnswer = async (
  gameId: string,
  playerId: string,
  answerIndex: number
): Promise<void> => {
  if (USE_MOCK) return mockApi.submitAnswer(gameId, playerId, answerIndex);

  await fetch(`${API_BASE_URL}/games/${gameId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, answerIndex }),
  });
};

export const endQuestion = async (gameId: string): Promise<GameState> => {
  if (USE_MOCK) return mockApi.endQuestion(gameId);

  const response = await fetch(`${API_BASE_URL}/games/${gameId}/end-question`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`endQuestion failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  return normalizeGame(raw);
};

export const nextQuestion = async (gameId: string): Promise<GameState> => {
  if (USE_MOCK) return mockApi.nextQuestion(gameId);

  const response = await fetch(`${API_BASE_URL}/games/${gameId}/next-question`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`nextQuestion failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  return normalizeGame(raw);
};

export const endGame = async (gameId: string): Promise<GameState> => {
  if (USE_MOCK) return mockApi.endGame(gameId);

  const response = await fetch(`${API_BASE_URL}/games/${gameId}/end`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`endGame failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  return normalizeGame(raw);
};

export const getGameState = async (gameId: string): Promise<GameState | null> => {
  if (USE_MOCK) return mockApi.getGameState(gameId);

  const response = await fetch(`${API_BASE_URL}/games/${gameId}/state`);
  if (!response.ok) return null;
  const raw = await response.json();
  return normalizeGame(raw);
};
