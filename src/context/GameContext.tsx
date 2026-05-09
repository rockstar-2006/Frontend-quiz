// src/context/GameContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { GameState, Player, Quiz, Question } from '@/types/quiz';
import { useGameApi } from '@/hooks/useGameApi';

interface GameContextType {
  // State
  currentGame: GameState | null;
  currentPlayer: Player | null;
  isHost: boolean;
  quizzes: Quiz[];
  loading: boolean;
  error: string | null;

  // Host actions
  createQuiz: (title: string, description: string) => Promise<Quiz>;
  updateQuiz: (quiz: Quiz) => Promise<void>;
  deleteQuiz: (quizId: string) => Promise<void>;
  addQuestion: (
    quizId: string,
    question: Omit<Question, 'id'>
  ) => Promise<void>;
  removeQuestion: (quizId: string, questionId: string) => Promise<void>;

  // Game actions
  createGame: (quiz: Quiz) => Promise<string>;
  joinGame: (
    pin: string,
    nickname: string,
    avatarId: number
  ) => Promise<boolean>;
  startGame: () => Promise<void>;
  submitAnswer: (answerIndex: number) => Promise<void>;
  nextQuestion: () => Promise<void>;
  showLeaderboard: () => Promise<void>;
  endGame: () => Promise<void>;
  leaveGame: () => Promise<void>;

  // Game state updates
  setGameStatus: (status: GameState['status']) => void;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const gameApi = useGameApi(); // <- implemented below

  return (
    <GameContext.Provider value={gameApi}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
