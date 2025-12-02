// Mock API - simulates backend for preview/demo purposes
// This allows the frontend to work without a real backend

import { Quiz, Question, GameState, Player } from '@/types/quiz';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage
let quizzes: Quiz[] = [];
let games: Map<string, GameState> = new Map();

// Helper to generate PIN
const generatePin = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Quiz functions
export const createQuiz = async (
  title: string, 
  description: string, 
  hostId: string
): Promise<Quiz> => {
  const quiz: Quiz = {
    id: uuidv4(),
    title,
    description,
    questions: [],
    createdAt: new Date(),
  };
  quizzes.push(quiz);
  return quiz;
};

export const getQuizzesByHost = async (hostId: string): Promise<Quiz[]> => {
  return quizzes;
};

export const getQuiz = async (quizId: string): Promise<Quiz | null> => {
  return quizzes.find(q => q.id === quizId) || null;
};

export const updateQuiz = async (quiz: Quiz): Promise<Quiz> => {
  const index = quizzes.findIndex(q => q.id === quiz.id);
  if (index !== -1) {
    quizzes[index] = quiz;
  }
  return quiz;
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  quizzes = quizzes.filter(q => q.id !== quizId);
};

export const addQuestionToQuiz = async (
  quizId: string, 
  question: Omit<Question, 'id'>
): Promise<Quiz> => {
  const quiz = quizzes.find(q => q.id === quizId);
  if (quiz) {
    quiz.questions.push({ ...question, id: uuidv4() });
  }
  return quiz!;
};

export const removeQuestionFromQuiz = async (
  quizId: string, 
  questionId: string
): Promise<Quiz> => {
  const quiz = quizzes.find(q => q.id === quizId);
  if (quiz) {
    quiz.questions = quiz.questions.filter(q => q.id !== questionId);
  }
  return quiz!;
};

// Game functions
export const createGame = async (quizId: string, hostId: string): Promise<GameState> => {
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) throw new Error('Quiz not found');
  
  const pin = generatePin();
  const game: GameState = {
    id: uuidv4(),
    pin,
    quizId,
    quiz,
    status: 'lobby',
    currentQuestionIndex: 0,
    players: [],
    questionStartTime: null,
    hostId,
  };
  
  games.set(game.id, game);
  games.set(pin, game); // Also index by PIN for easy lookup
  
  return game;
};

export const getGameByPin = async (pin: string): Promise<GameState | null> => {
  for (const game of games.values()) {
    if (game.pin === pin && game.status !== 'finished') {
      return game;
    }
  }
  return null;
};

export const getGame = async (gameId: string): Promise<GameState | null> => {
  return games.get(gameId) || null;
};

export const joinGame = async (
  pin: string, 
  nickname: string, 
  avatarId: number, 
  playerId: string
): Promise<{ game: GameState; player: Player } | null> => {
  const game = await getGameByPin(pin);
  if (!game || game.status !== 'lobby') return null;
  
  // Check nickname uniqueness
  if (game.players.some(p => p.nickname.toLowerCase() === nickname.toLowerCase())) {
    return null;
  }
  
  const player: Player = {
    id: playerId,
    nickname,
    avatarId,
    score: 0,
    currentAnswer: null,
    answerTime: null,
  };
  
  game.players.push(player);
  return { game, player };
};

export const leaveGame = async (gameId: string, playerId: string): Promise<void> => {
  const game = games.get(gameId);
  if (game) {
    game.players = game.players.filter(p => p.id !== playerId);
  }
};

export const startGame = async (gameId: string): Promise<GameState> => {
  const game = games.get(gameId);
  if (!game) throw new Error('Game not found');
  
  game.status = 'countdown';
  return game;
};

export const startQuestion = async (gameId: string): Promise<GameState> => {
  const game = games.get(gameId);
  if (!game) throw new Error('Game not found');
  
  game.status = 'question';
  game.questionStartTime = Date.now();
  
  // Reset player answers
  game.players.forEach(player => {
    player.currentAnswer = null;
    player.answerTime = null;
  });
  
  return game;
};

export const submitAnswer = async (
  gameId: string, 
  playerId: string, 
  answerIndex: number
): Promise<void> => {
  const game = games.get(gameId);
  if (!game) return;
  
  const player = game.players.find(p => p.id === playerId);
  if (!player || player.currentAnswer !== null) return;
  
  const answerTime = game.questionStartTime 
    ? (Date.now() - game.questionStartTime) / 1000 
    : 0;
  
  player.currentAnswer = answerIndex;
  player.answerTime = answerTime;
};

export const endQuestion = async (gameId: string): Promise<GameState> => {
  const game = games.get(gameId);
  if (!game) throw new Error('Game not found');
  
  const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
  
  // Calculate scores
  game.players.forEach(player => {
    if (player.currentAnswer === currentQuestion.correctIndex) {
      const timeLeft = currentQuestion.timeLimit - (player.answerTime || currentQuestion.timeLimit);
      const timeBonus = Math.round((timeLeft / currentQuestion.timeLimit) * 500);
      player.score += 500 + timeBonus;
    }
  });
  
  game.status = 'leaderboard';
  return game;
};

export const nextQuestion = async (gameId: string): Promise<GameState> => {
  const game = games.get(gameId);
  if (!game) throw new Error('Game not found');
  
  const nextIndex = game.currentQuestionIndex + 1;
  
  if (nextIndex >= game.quiz.questions.length) {
    game.status = 'finished';
  } else {
    game.currentQuestionIndex = nextIndex;
    game.status = 'countdown';
    
    // Reset player answers
    game.players.forEach(player => {
      player.currentAnswer = null;
      player.answerTime = null;
    });
  }
  
  return game;
};

export const endGame = async (gameId: string): Promise<GameState> => {
  const game = games.get(gameId);
  if (!game) throw new Error('Game not found');
  
  game.status = 'finished';
  return game;
};

export const getGameState = async (gameId: string): Promise<GameState | null> => {
  return games.get(gameId) || null;
};

// Export games map for socket simulation
export const getGamesMap = () => games;
