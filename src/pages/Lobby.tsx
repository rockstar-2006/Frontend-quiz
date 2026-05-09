// src/pages/Lobby.tsx
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Logo } from '@/components/Logo';
import { PinDisplay } from '@/components/PinDisplay';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { useGame } from '@/context/GameContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Users } from 'lucide-react';
import { socket } from '@/services/socket';

const Lobby = () => {
  const navigate = useNavigate();
  const { pin } = useParams<{ pin: string }>();
  const { currentGame, isHost, startGame, leaveGame } = useGame();

  // If someone opens Lobby with invalid pin/game, kick them home
  useEffect(() => {
    if (!currentGame || currentGame.pin !== pin) {
      navigate('/');
    }
  }, [currentGame, pin, navigate]);

  // If local game status changes (e.g. via polling), move to game screen
  useEffect(() => {
    if (currentGame?.status === 'countdown' || currentGame?.status === 'question') {
      navigate(`/game/${pin}`);
    }
  }, [currentGame?.status, pin, navigate]);

  // 🔔 NEW: react to "game-started" broadcast from backend via Socket.IO
  useEffect(() => {
    if (!pin) return;

    const handleGameStarted = () => {
      console.log('[Lobby] game-started event received, navigating to game');
      navigate(`/game/${pin}`);
    };

    socket.on('game-started', handleGameStarted);

    return () => {
      socket.off('game-started', handleGameStarted);
    };
  }, [pin, navigate]);

  if (!currentGame) {
    return null;
  }

  const handleStart = async () => {
    if (currentGame.players.length === 0) {
      // Allow starting with 0 players for testing
    }

    // This updates backend game status and (in your context) should emit "game-start"
    await startGame();

    // Host also navigates (in case socket event arrives with delay)
    navigate(`/game/${pin}`);
  };

  const handleLeave = async () => {
    await leaveGame();
    navigate('/');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <AnimatedBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={handleLeave}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Leave
          </Button>
          <Logo size="sm" />
          <div className="w-20" />
        </header>

        <main className="flex-1 flex flex-col items-center">
          {/* Game info */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {currentGame.quiz.title}
            </h1>
            <PinDisplay pin={currentGame.pin} size="lg" />
          </motion.div>

          {/* Players */}
          <motion.div
            className="glass-card p-8 rounded-2xl w-full max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Players ({currentGame.players.length})
              </h2>
            </div>

            {currentGame.players.length === 0 ? (
              <motion.div 
                className="text-center py-12"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <p className="text-xl text-muted-foreground">Waiting for players to join...</p>
                <p className="text-sm text-muted-foreground mt-2">Share the PIN with your friends!</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-6 justify-items-center">
                <AnimatePresence>
                  {currentGame.players.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <PlayerAvatar
                        avatarId={player.avatarId}
                        nickname={player.nickname}
                        size="md"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Start button (host only) */}
          {isHost && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="hero"
                size="xl"
                onClick={handleStart}
                className="gap-3 min-w-64"
              >
                <Play className="w-6 h-6" />
                Start Game
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-3">
                {currentGame.quiz.questions.length} questions ready
              </p>
            </motion.div>
          )}

          {/* Player waiting message */}
          {!isHost && (
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div
                className="glass-card px-8 py-4 rounded-full inline-block"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <p className="text-lg text-foreground">
                  Waiting for host to start the game...
                </p>
              </motion.div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Lobby;
