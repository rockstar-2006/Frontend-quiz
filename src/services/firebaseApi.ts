import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Quiz, Question, GameState, Player } from "../types/quiz";
import { v4 as uuidv4 } from "uuid";

// Helper to generate PIN
const generatePin = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// --- Quiz CRUD ---

export const createQuiz = async (
  title: string,
  description: string,
  hostId: string
): Promise<Quiz> => {
  const quizId = uuidv4();
  const quiz: Quiz = {
    id: quizId,
    title,
    description,
    questions: [],
    createdAt: new Date(),
  };
  
  await setDoc(doc(db, "quizzes", quizId), {
    ...quiz,
    createdAt: Timestamp.fromDate(quiz.createdAt)
  });
  
  return quiz;
};

export const getQuizzesByHost = async (hostId: string): Promise<Quiz[]> => {
  const q = query(collection(db, "quizzes"), where("hostId", "==", hostId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Quiz);
};

export const getQuiz = async (quizId: string): Promise<Quiz | null> => {
  const docSnap = await getDoc(doc(db, "quizzes", quizId));
  if (docSnap.exists()) {
    return docSnap.data() as Quiz;
  }
  return null;
};

export const updateQuiz = async (quiz: Quiz): Promise<Quiz> => {
  await updateDoc(doc(db, "quizzes", quiz.id), { ...quiz });
  return quiz;
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  await deleteDoc(doc(db, "quizzes", quizId));
};

export const addQuestionToQuiz = async (
  quizId: string,
  question: Omit<Question, 'id'>
): Promise<Quiz> => {
  const newQuestion = { ...question, id: uuidv4() };
  await updateDoc(doc(db, "quizzes", quizId), {
    questions: arrayUnion(newQuestion)
  });
  const quiz = await getQuiz(quizId);
  return quiz!;
};

export const removeQuestionFromQuiz = async (
  quizId: string,
  questionId: string
): Promise<Quiz> => {
  const quiz = await getQuiz(quizId);
  if (quiz) {
    const updatedQuestions = quiz.questions.filter(q => q.id !== questionId);
    await updateDoc(doc(db, "quizzes", quizId), {
      questions: updatedQuestions
    });
  }
  const updatedQuiz = await getQuiz(quizId);
  return updatedQuiz!;
};

// --- Game Logic ---

export const createGame = async (quizId: string, hostId: string): Promise<GameState> => {
  const quiz = await getQuiz(quizId);
  if (!quiz) throw new Error("Quiz not found");
  
  const pin = generatePin();
  const gameId = uuidv4();
  
  const game: GameState = {
    id: gameId,
    pin,
    quizId,
    quiz,
    status: 'lobby',
    currentQuestionIndex: 0,
    players: [],
    questionStartTime: null,
    hostId,
  };
  
  await setDoc(doc(db, "games", gameId), game);
  // Also store a mapping from PIN to gameId for joining
  await setDoc(doc(db, "pins", pin), { gameId });
  
  return game;
};

export const getGameByPin = async (pin: string): Promise<GameState | null> => {
  const pinSnap = await getDoc(doc(db, "pins", pin));
  if (!pinSnap.exists()) return null;
  
  const { gameId } = pinSnap.data();
  return getGame(gameId);
};

export const getGame = async (gameId: string): Promise<GameState | null> => {
  const docSnap = await getDoc(doc(db, "games", gameId));
  if (docSnap.exists()) {
    return docSnap.data() as GameState;
  }
  return null;
};

export const joinGame = async (
  pin: string,
  nickname: string,
  avatarId: number,
  playerId: string
): Promise<{ game: GameState; player: Player } | null> => {
  const game = await getGameByPin(pin);
  if (!game || game.status !== 'lobby') return null;
  
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
  
  await updateDoc(doc(db, "games", game.id), {
    players: arrayUnion(player)
  });
  
  const updatedGame = await getGame(game.id);
  return { game: updatedGame!, player };
};

export const leaveGame = async (gameId: string, playerId: string): Promise<void> => {
  const game = await getGame(gameId);
  if (game) {
    const updatedPlayers = game.players.filter(p => p.id !== playerId);
    await updateDoc(doc(db, "games", gameId), {
      players: updatedPlayers
    });
  }
};

export const startGame = async (gameId: string): Promise<GameState> => {
  await updateDoc(doc(db, "games", gameId), {
    status: 'countdown'
  });
  return (await getGame(gameId))!;
};

export const startQuestion = async (gameId: string): Promise<GameState> => {
  const game = await getGame(gameId);
  if (!game) throw new Error("Game not found");
  
  const updatedPlayers = game.players.map(p => ({
    ...p,
    currentAnswer: null,
    textAnswer: null,
    answerTime: null
  }));
  
  await updateDoc(doc(db, "games", gameId), {
    status: 'question',
    questionStartTime: Date.now(),
    players: updatedPlayers
  });
  
  return (await getGame(gameId))!;
};

export const submitAnswer = async (
  gameId: string,
  playerId: string,
  answerIndex: number | null,
  textAnswer?: string
): Promise<void> => {
  const game = await getGame(gameId);
  if (!game || game.status !== 'question') return;
  
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1 || (game.players[playerIndex].currentAnswer !== null || game.players[playerIndex].textAnswer)) return;
  
  const answerTime = game.questionStartTime 
    ? (Date.now() - game.questionStartTime) / 1000 
    : 0;
  
  const updatedPlayers = [...game.players];
  updatedPlayers[playerIndex] = {
    ...updatedPlayers[playerIndex],
    currentAnswer: answerIndex,
    textAnswer: textAnswer || null,
    answerTime: answerTime
  };
  
  await updateDoc(doc(db, "games", gameId), {
    players: updatedPlayers
  });
};

export const endQuestion = async (gameId: string): Promise<GameState> => {
  const game = await getGame(gameId);
  if (!game) throw new Error("Game not found");
  
  const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
  
  const updatedPlayers = game.players.map(player => {
    // Multiple Choice Scoring
    if (currentQuestion.type === 'multiple-choice' && player.currentAnswer === currentQuestion.correctIndex) {
      const actualAnswerTime = player.answerTime ?? currentQuestion.timeLimit;
      const timeLeft = Math.max(0, currentQuestion.timeLimit - actualAnswerTime);
      const timeBonus = Math.round((timeLeft / currentQuestion.timeLimit) * 500);
      return {
        ...player,
        score: player.score + 500 + timeBonus
      };
    }
    
    // Text Answer Scoring (if correctAnswer is provided)
    if (currentQuestion.type === 'text' && currentQuestion.correctAnswer && player.textAnswer) {
      const normalizedPlayer = player.textAnswer.trim().toUpperCase().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
      const normalizedCorrect = currentQuestion.correctAnswer.trim().toUpperCase().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
      
      if (normalizedPlayer === normalizedCorrect) {
        const actualAnswerTime = player.answerTime ?? currentQuestion.timeLimit;
        const timeLeft = Math.max(0, currentQuestion.timeLimit - actualAnswerTime);
        const timeBonus = Math.round((timeLeft / currentQuestion.timeLimit) * 500);
        return {
          ...player,
          score: player.score + 500 + timeBonus
        };
      }
    }
    
    return player;
  });
  
  await updateDoc(doc(db, "games", gameId), {
    status: 'leaderboard',
    players: updatedPlayers
  });
  
  return (await getGame(gameId))!;
};

export const nextQuestion = async (gameId: string): Promise<GameState> => {
  const game = await getGame(gameId);
  if (!game) throw new Error("Game not found");
  
  const nextIndex = game.currentQuestionIndex + 1;
  
  if (nextIndex >= game.quiz.questions.length) {
    await updateDoc(doc(db, "games", gameId), {
      status: 'finished'
    });
  } else {
    const resetPlayers = game.players.map(p => ({
      ...p,
      currentAnswer: null,
      textAnswer: null,
      answerTime: null
    }));
    
    await updateDoc(doc(db, "games", gameId), {
      currentQuestionIndex: nextIndex,
      status: 'countdown',
      players: resetPlayers
    });
  }
  
  return (await getGame(gameId))!;
};

export const endGame = async (gameId: string): Promise<GameState> => {
  await updateDoc(doc(db, "games", gameId), {
    status: 'finished'
  });
  return (await getGame(gameId))!;
};

export const getGameState = async (gameId: string): Promise<GameState | null> => {
  return getGame(gameId);
};
