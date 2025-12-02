// src/hooks/useGameApi.ts
import { useCallback, useEffect, useState } from 'react';
import { GameState, Player, Quiz, Question } from '@/types/quiz';
import * as api from '@/services/api';
import {
  socket,
  joinGame as joinSocketGame,
  leaveGame as leaveSocketGame,
  emitGameStart,
  emitQuestionStart,
  emitQuestionEnd,
  emitShowLeaderboard,
  emitNextQuestion,
  emitGameEnd,
} from '@/services/socket';
import { v4 as uuidv4 } from 'uuid';

type GameStatus = GameState['status'];

export const useGameApi = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isHost, setIsHost] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // one client id per browser (used as hostId / playerId base)
  const [clientId] = useState(() => {
    if (typeof window === 'undefined') return '';
    const stored = localStorage.getItem('quizblitz_client_id');
    if (stored) return stored;
    const id = uuidv4();
    localStorage.setItem('quizblitz_client_id', id);
    return id;
  });

  const hostId = clientId;

  const clearError = useCallback(() => setError(null), []);

  const wrap = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        return await fn();
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? 'Something went wrong');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // --- refresh helpers --------------------------------------------------

  const refreshGame = useCallback(
    async (gameId?: string) => {
      const id = gameId ?? currentGame?.id;
      if (!id) return;
      try {
        const updated = await api.getGameState(id);
        if (updated) setCurrentGame(updated);
      } catch (err) {
        console.error('Failed to refresh game', err);
      }
    },
    [currentGame?.id]
  );

  // --- initial quizzes --------------------------------------------------

  useEffect(() => {
    if (!hostId) return;
    wrap(async () => {
      const list = await api.getQuizzesByHost(hostId);
      setQuizzes(list);
      return list;
    }).catch(() => {});
  }, [hostId, wrap]);

  // --- socket listeners -------------------------------------------------

  useEffect(() => {
    if (!currentGame) return;

    const gameId = currentGame.id;

    const handleSync = () => {
      // for most events, server sends no payload, so just refresh
      refreshGame(gameId);
    };

    const handlePlayerChange = () => {
      refreshGame(gameId);
    };

    // game flow events
    socket.on('game-started', handleSync);
    socket.on('question-started', handleSync);
    socket.on('question-ended', handleSync);
    socket.on('leaderboard-shown', handleSync);
    socket.on('next-question-started', handleSync);
    socket.on('game-ended', handleSync);

    // player events
    socket.on('player-joined', handlePlayerChange);
    socket.on('player-left', handlePlayerChange);

    return () => {
      socket.off('game-started', handleSync);
      socket.off('question-started', handleSync);
      socket.off('question-ended', handleSync);
      socket.off('leaderboard-shown', handleSync);
      socket.off('next-question-started', handleSync);
      socket.off('game-ended', handleSync);

      socket.off('player-joined', handlePlayerChange);
      socket.off('player-left', handlePlayerChange);
    };
  }, [currentGame, refreshGame]);

  // --- quiz CRUD --------------------------------------------------------

  const createQuiz = useCallback(
    async (title: string, description: string): Promise<Quiz> =>
      wrap(async () => {
        const quiz = await api.createQuiz(title, description, hostId);
        setQuizzes((prev) => [quiz, ...prev]);
        return quiz;
      }),
    [hostId, wrap]
  );

  const updateQuiz = useCallback(
    async (quiz: Quiz): Promise<void> =>
      wrap(async () => {
        const updated = await api.updateQuiz(quiz);
        setQuizzes((prev) =>
          prev.map((q) => (q.id === updated.id ? updated : q))
        );
      }),
    [wrap]
  );

  const deleteQuiz = useCallback(
    async (quizId: string): Promise<void> =>
      wrap(async () => {
        await api.deleteQuiz(quizId);
        setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      }),
    [wrap]
  );

  const addQuestion = useCallback(
    async (quizId: string, question: Omit<Question, 'id'>): Promise<void> =>
      wrap(async () => {
        const updated = await api.addQuestionToQuiz(quizId, question);
        setQuizzes((prev) =>
          prev.map((q) => (q.id === updated.id ? updated : q))
        );
      }),
    [wrap]
  );

  const removeQuestion = useCallback(
    async (quizId: string, questionId: string): Promise<void> =>
      wrap(async () => {
        const updated = await api.removeQuestionFromQuiz(quizId, questionId);
        setQuizzes((prev) =>
          prev.map((q) => (q.id === updated.id ? updated : q))
        );
      }),
    [wrap]
  );

  // --- host: create / start game ----------------------------------------

  const createGame = useCallback(
    async (quiz: Quiz): Promise<string> =>
      wrap(async () => {
        const game = await api.createGame(quiz.id, hostId);
        setCurrentGame(game);
        setCurrentPlayer(null);
        setIsHost(true);

        // join socket room
        joinSocketGame(game.id, hostId);

        return game.pin;
      }),
    [hostId, wrap]
  );

  const startGame = useCallback(
    async (): Promise<void> =>
      wrap(async () => {
        if (!currentGame) return;
        const updated = await api.startGame(currentGame.id);
        setCurrentGame(updated);
        emitGameStart(updated.id);
      }),
    [currentGame, wrap]
  );

  // --- player: join / leave game ----------------------------------------

  const joinGame = useCallback(
    async (
      pin: string,
      nickname: string,
      avatarId: number
    ): Promise<boolean> =>
      wrap(async () => {
        const result = await api.joinGame(pin, nickname, avatarId, clientId);
        if (!result) return false;

        const { game, player } = result;
        setCurrentGame(game);
        setCurrentPlayer(player);
        setIsHost(false);

        joinSocketGame(game.id, player.id);

        return true;
      }).catch(() => false),
    [clientId, wrap]
  );

  const leaveGame = useCallback(
    async (): Promise<void> =>
      wrap(async () => {
        if (!currentGame) return;
        if (currentPlayer) {
          await api.leaveGame(currentGame.id, currentPlayer.id);
          leaveSocketGame(currentGame.id, currentPlayer.id);
        }
        setCurrentGame(null);
        setCurrentPlayer(null);
        setIsHost(false);
      }),
    [currentGame, currentPlayer, wrap]
  );

  // --- game flow: status / questions / scoring --------------------------

  const setGameStatus = useCallback(
    (status: GameStatus) => {
      if (!currentGame) return;

      // Only host should actually drive backend transitions
      if (status === 'question' && isHost) {
        wrap(async () => {
          const updated = await api.startQuestion(currentGame.id);
          setCurrentGame(updated);
          emitQuestionStart(updated.id, updated.currentQuestionIndex);
        }).catch(() => {});
      }
      // Non-hosts will sync from socket events / refreshGame
    },
    [currentGame, isHost, wrap]
  );

  const submitAnswer = useCallback(
    async (answerIndex: number): Promise<void> =>
      wrap(async () => {
        if (!currentGame || !currentPlayer) return;
        await api.submitAnswer(currentGame.id, currentPlayer.id, answerIndex);
      }),
    [currentGame, currentPlayer, wrap]
  );

  const showLeaderboard = useCallback(
    async (): Promise<void> =>
      wrap(async () => {
        if (!currentGame || !isHost) return;
        const updated = await api.endQuestion(currentGame.id);
        setCurrentGame(updated);
        emitQuestionEnd(updated.id);
        emitShowLeaderboard(updated.id);
      }),
    [currentGame, isHost, wrap]
  );

  const nextQuestion = useCallback(
    async (): Promise<void> =>
      wrap(async () => {
        if (!currentGame || !isHost) return;
        const updated = await api.nextQuestion(currentGame.id);
        setCurrentGame(updated);
        emitNextQuestion(updated.id);
      }),
    [currentGame, isHost, wrap]
  );

  const endGame = useCallback(
    async (): Promise<void> =>
      wrap(async () => {
        if (!currentGame || !isHost) return;
        const updated = await api.endGame(currentGame.id);
        setCurrentGame(updated);
        emitGameEnd(updated.id);
      }),
    [currentGame, isHost, wrap]
  );

  // ----------------------------------------------------------------------

  return {
    // state
    currentGame,
    currentPlayer,
    isHost,
    quizzes,
    loading,
    error,

    // host actions
    createQuiz,
    updateQuiz,
    deleteQuiz,
    addQuestion,
    removeQuestion,

    // game actions
    createGame,
    joinGame,
    startGame,
    submitAnswer,
    nextQuestion,
    showLeaderboard,
    endGame,
    leaveGame,

    // misc
    setGameStatus,
    clearError,
  };
};
