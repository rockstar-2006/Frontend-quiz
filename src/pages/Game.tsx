import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { CountdownTimer } from '@/components/CountdownTimer';
import { AnswerButton } from '@/components/AnswerButton';
import { Leaderboard } from '@/components/Leaderboard';
import { useGame } from '@/context/GameContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Home, RotateCcw } from 'lucide-react';

const Game = () => {
  const navigate = useNavigate();
  const { pin } = useParams<{ pin: string }>();

  const {
    currentGame,
    currentPlayer,
    isHost,
    submitAnswer,
    showLeaderboard,
    nextQuestion,
    leaveGame,
    setGameStatus,
  } = useGame();

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const previousStatusRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!currentGame) return;
    if (pin && currentGame.pin !== pin) {
      navigate('/');
    }
  }, [currentGame, pin, navigate]);

  useEffect(() => {
    if (!currentGame) return;
    setSelectedAnswer(null);
    setShowResults(false);
  }, [currentGame?.currentQuestionIndex]);

  useEffect(() => {
    if (!currentGame) return;

    const prev = previousStatusRef.current;
    if (prev === 'question' && currentGame.status !== 'question') {
      setShowResults(true);
    }
    previousStatusRef.current = currentGame.status;
  }, [currentGame?.status]);

  const handleAnswer = useCallback(
    async (index: number) => {
      if (!currentGame) return;
      if (!currentPlayer) return;
      if (currentGame.status !== 'question') return;
      if (selectedAnswer !== null) return;

      setSelectedAnswer(index);

      try {
        await submitAnswer(index);
      } catch (err) {
        console.error('Error submitting answer:', err);
      }
    },
    [currentGame, currentPlayer, selectedAnswer, submitAnswer]
  );

  const handleTimeUp = useCallback(async () => {
    setShowResults(true);

    if (isHost) {
      setTimeout(async () => {
        try {
          await showLeaderboard();
        } catch (err) {
          console.error('Error showing leaderboard:', err);
        }
      }, 3000);
    }
  }, [isHost, showLeaderboard]);

  const handleNextQuestion = useCallback(async () => {
    try {
      await nextQuestion();
    } catch (err) {
      console.error('Error going to next question:', err);
    }
  }, [nextQuestion]);

  const handlePlayAgain = useCallback(async () => {
    try {
      await leaveGame();
    } finally {
      navigate('/host');
    }
  }, [leaveGame, navigate]);

  const handleGoHome = useCallback(async () => {
    try {
      await leaveGame();
    } finally {
      navigate('/');
    }
  }, [leaveGame, navigate]);

  if (!currentGame) {
    return null;
  }

  const quiz = currentGame.quiz;
  const questions = quiz?.questions ?? [];
  const currentQuestion =
    questions.length > 0
      ? questions[currentGame.currentQuestionIndex] ?? null
      : null;

  const isLastQuestion =
    questions.length > 0 &&
    currentGame.currentQuestionIndex >= questions.length - 1;

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background">
        <AnimatedBackground />
        <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen items-center justify-center">
          <div className="glass-card p-8 rounded-2xl text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">No questions available</h2>
            <p className="text-muted-foreground mb-6">
              This game doesn&apos;t seem to have any questions configured yet.
            </p>
            <Button variant="hero" onClick={handleGoHome}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isMultilineQuestion = currentQuestion?.text?.includes('\n');

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <AnimatedBackground />

      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen">
        <AnimatePresence mode="wait">
          {/* Countdown */}
          {currentGame.status === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <CountdownTimer
                seconds={3}
                onComplete={() => setGameStatus('question')}
                isLarge
              />
            </motion.div>
          )}

          {/* Question */}
          {currentGame.status === 'question' && currentQuestion && (
            <motion.div
              key="question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="glass-card px-4 py-2 rounded-full">
                  <span className="text-sm text-muted-foreground">
                    Question {currentGame.currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>

                <CountdownTimer
                  seconds={currentQuestion.timeLimit}
                  onComplete={handleTimeUp}
                />
              </div>

              {/* Question text / code */}
              <motion.div
                className="glass-card p-8 rounded-2xl mb-8 text-center"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {isMultilineQuestion ? (
                  <pre className="whitespace-pre-wrap text-left font-mono text-sm md:text-base max-h-72 overflow-auto">
                    {currentQuestion.text}
                  </pre>
                ) : (
                  <h2 className="text-2xl md:text-4xl font-bold text-foreground">
                    {currentQuestion.text}
                  </h2>
                )}
              </motion.div>

              {/* Answers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {currentQuestion.options.map((option: string, index: number) => (
                  <AnswerButton
                    key={index}
                    index={index}
                    text={option}
                    onClick={() => handleAnswer(index)}
                    disabled={
                      showResults || currentGame.status !== 'question'
                    }
                    selected={selectedAnswer === index}
                    isCorrect={index === currentQuestion.correctIndex}
                    showResult={
                      showResults || currentGame.status !== 'question'
                    }
                  />
                ))}
              </div>

              {/* Feedback */}
              {selectedAnswer !== null && !showResults && (
                <motion.div
                  className="text-center mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="glass-card px-8 py-4 rounded-full inline-block">
                    <p className="text-lg text-foreground">
                      Answer locked! Waiting for results...
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Leaderboard */}
          {currentGame.status === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <Leaderboard players={currentGame.players} />

              {isHost && (
                <motion.div
                  className="mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    variant="hero"
                    size="xl"
                    onClick={handleNextQuestion}
                    className="gap-3"
                  >
                    {isLastQuestion ? 'See Final Results' : 'Next Question'}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Finished */}
          {currentGame.status === 'finished' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <Leaderboard players={currentGame.players} isFinal showConfetti />

              <motion.div
                className="flex gap-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
              >
                <Button
                  variant="glass"
                  size="lg"
                  onClick={handleGoHome}
                  className="gap-2"
                >
                  <Home className="w-5 h-5" />
                  Home
                </Button>
                {isHost && (
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={handlePlayAgain}
                    className="gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Play Again
                  </Button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Game;
