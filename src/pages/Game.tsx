import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { CountdownTimer } from '@/components/CountdownTimer';
import { AnswerButton } from '@/components/AnswerButton';
import { Leaderboard } from '@/components/Leaderboard';
import { ResultsChart } from '@/components/ResultsChart';
import { useGame } from '@/context/GameContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Home, RotateCcw, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const [textInput, setTextInput] = useState('');
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
    setTextInput('');
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

  const handleTextSubmit = useCallback(async () => {
    if (!currentGame || !currentPlayer || !textInput.trim() || showResults) return;
    
    // Lock it locally
    setSelectedAnswer(-1); // Use -1 as a flag for "submitted text"
    
    try {
      await submitAnswer(null, textInput.trim());
    } catch (err) {
      console.error('Error submitting text answer:', err);
    }
  }, [currentGame, currentPlayer, textInput, showResults, submitAnswer]);

  const handleTimeUp = useCallback(async () => {
    setShowResults(true);

    if (isHost) {
      // Transition to polling results faster (1 second instead of 3)
      setTimeout(async () => {
        try {
          await showLeaderboard();
        } catch (err) {
          console.error('Error showing leaderboard:', err);
        }
      }, 1000);
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

              {/* Total Votes Counter for Host/Players */}
              <div className="flex justify-center mb-6">
                <div className="glass-card px-6 py-2 rounded-full border-primary/20 bg-primary/5">
                  <span className="text-lg font-bold gradient-text">
                    {currentGame.players.filter(p => p.currentAnswer !== null || p.textAnswer).length} / {currentGame.players.length} Votes Received
                  </span>
                </div>
              </div>

              {/* Question text / code */}
              {(!showResults || isHost) && (
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
                    <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground">
                      {currentQuestion.text}
                    </h2>
                  )}
                </motion.div>
              )}

              {/* Answers */}
              {(!showResults || isHost) ? (
                currentQuestion.type === 'multiple-choice' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
                    {currentQuestion.options.map((option: string, index: number) => (
                      <AnswerButton
                        key={index}
                        index={index}
                        text={option}
                        onClick={() => handleAnswer(index)}
                        disabled={
                          isHost || showResults || currentGame.status !== 'question'
                        }
                        selected={!isHost && selectedAnswer === index}
                        isCorrect={index === currentQuestion.correctIndex}
                        showResult={
                          showResults || currentGame.status !== 'question'
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {!isHost ? (
                      <div className="w-full max-w-xl space-y-4 sm:space-y-6">
                        <div className="relative">
                          <Input
                            placeholder="Type response..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            className="text-center text-xl sm:text-3xl h-16 sm:h-24 rounded-2xl border-4 border-primary/20 bg-card/40 focus:border-primary/50 transition-all shadow-inner"
                            disabled={selectedAnswer !== null || showResults}
                            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                            maxLength={50}
                          />
                          {selectedAnswer !== null && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -right-4 -top-4 bg-success text-white p-3 rounded-full shadow-lg border-4 border-background"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                          )}
                        </div>
                        
                        <Button 
                          onClick={handleTextSubmit} 
                          disabled={!textInput.trim() || selectedAnswer !== null || showResults}
                          className="w-full h-16 text-2xl font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                          variant="hero"
                        >
                          {selectedAnswer !== null ? 'RESPONSE LOCKED' : 'SUBMIT ANSWER'}
                        </Button>
                        
                        <p className="text-center text-muted-foreground animate-pulse">
                          {selectedAnswer !== null ? 'Wait for the timer to see everyone\'s results!' : 'Type and submit before time runs out!'}
                        </p>
                      </div>
                    ) : (
                      <div className="glass-card p-12 rounded-3xl text-center border-2 border-primary/10">
                        <div className="mb-6 inline-block p-4 bg-primary/10 rounded-full animate-bounce">
                          <Send className="w-12 h-12 text-primary" />
                        </div>
                        <h3 className="text-3xl font-bold mb-2">Polling in Progress...</h3>
                        <p className="text-xl text-muted-foreground">Waiting for {currentGame.players.length} players to submit their names.</p>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <motion.div
                  className={`flex-1 flex items-center justify-center rounded-2xl p-8 text-white shadow-2xl ${
                    currentQuestion.type === 'multiple-choice' 
                      ? (selectedAnswer === currentQuestion.correctIndex ? 'bg-success' : 'bg-destructive')
                      : 'bg-primary/80'
                  }`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="text-center">
                    <h2 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-md">
                      {currentQuestion.type === 'multiple-choice' 
                        ? (selectedAnswer === currentQuestion.correctIndex ? 'Correct!' : (selectedAnswer === null ? "Time's Up!" : 'Incorrect!'))
                        : 'Vote Received!'
                      }
                    </h2>
                    {currentQuestion.type === 'text' && currentQuestion.correctAnswer && (
                      <p className="text-2xl font-semibold opacity-90 drop-shadow-sm">
                        Correct answer: {currentQuestion.correctAnswer.toUpperCase()}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Feedback */}
              {!isHost && selectedAnswer !== null && !showResults && (
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

          {/* Results (Answer Pooling) */}
          {currentGame.status === 'leaderboard' && currentQuestion && (
            <motion.div
              key="results-pooling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center w-full"
            >
              <ResultsChart 
                players={currentGame.players} 
                question={currentQuestion} 
              />

              {isHost && (
                <motion.div
                  className="mt-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    variant="hero"
                    size="xl"
                    onClick={handleNextQuestion}
                    className="gap-3 shadow-xl"
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
