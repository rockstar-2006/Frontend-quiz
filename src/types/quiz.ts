export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  timeLimit: number; // in seconds
    code?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: Date;

}

export interface Player {
  id: string;
  nickname: string;
  avatarId: number;
  score: number;
  currentAnswer: number | null;
  answerTime: number | null;
}

export interface GameState {
  id: string;
  pin: string;
  quizId: string;
  quiz: Quiz;
  status: 'lobby' | 'countdown' | 'question' | 'results' | 'leaderboard' | 'finished';
  currentQuestionIndex: number;
  players: Player[];
  questionStartTime: number | null;
  hostId: string;
  imageUrl?: string;   // 👈 new
  code?: string;  
}

export type GameAction =
  | { type: 'JOIN_GAME'; player: Player }
  | { type: 'LEAVE_GAME'; playerId: string }
  | { type: 'START_GAME' }
  | { type: 'START_QUESTION' }
  | { type: 'SUBMIT_ANSWER'; playerId: string; answerIndex: number; time: number }
  | { type: 'END_QUESTION' }
  | { type: 'SHOW_LEADERBOARD' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'END_GAME' };

export const AVATARS = [
  '🦊', '🐼', '🦁', '🐸', '🐵', '🦄', '🐲', '🦋',
  '🐙', '🦜', '🐺', '🦈', '🐯', '🦉', '🐨', '🦩'
];
