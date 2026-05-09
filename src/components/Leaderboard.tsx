import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/types/quiz';
import { PlayerAvatar } from './PlayerAvatar';
import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface LeaderboardProps {
  players: Player[];
  showConfetti?: boolean;
  isFinal?: boolean;
}

export const Leaderboard = ({ players, showConfetti = true, isFinal = false }: LeaderboardProps) => {
  const confettiRef = useRef(false);
  
  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  useEffect(() => {
    if (showConfetti && !confettiRef.current) {
      confettiRef.current = true;
      
      const duration = isFinal ? 5000 : 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: isFinal ? 5 : 2,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#a855f7', '#06b6d4', '#f59e0b', '#ef4444'],
        });
        confetti({
          particleCount: isFinal ? 5 : 2,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#a855f7', '#06b6d4', '#f59e0b', '#ef4444'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
    }
  }, [showConfetti, isFinal]);

  if (isFinal && sortedPlayers.length > 0) {
    // Winner podium view
    const winner = sortedPlayers[0];
    const second = sortedPlayers[1];
    const third = sortedPlayers[2];

    return (
      <motion.div
        className="w-full max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.h2 
          className="text-4xl md:text-6xl font-bold text-center gradient-text mb-12"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          🏆 Winner! 🏆
        </motion.h2>

        <div className="flex items-end justify-center gap-4 mb-12">
          {/* Second Place */}
          {second && (
            <motion.div 
              className="flex flex-col items-center"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <PlayerAvatar
                avatarId={second.avatarId}
                nickname={second.nickname}
                score={second.score}
                rank={2}
                size="md"
                showScore
              />
              <div className="w-24 h-20 bg-secondary/30 rounded-t-lg mt-4" />
            </motion.div>
          )}

          {/* First Place */}
          <motion.div 
            className="flex flex-col items-center"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <PlayerAvatar
              avatarId={winner.avatarId}
              nickname={winner.nickname}
              score={winner.score}
              rank={1}
              size="lg"
              showScore
              isWinner
            />
            <div className="w-28 h-32 bg-accent/30 rounded-t-lg mt-4" />
          </motion.div>

          {/* Third Place */}
          {third && (
            <motion.div 
              className="flex flex-col items-center"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <PlayerAvatar
                avatarId={third.avatarId}
                nickname={third.nickname}
                score={third.score}
                rank={3}
                size="md"
                showScore
              />
              <div className="w-24 h-14 bg-primary/30 rounded-t-lg mt-4" />
            </motion.div>
          )}
        </div>

        {/* Rest of players */}
        {sortedPlayers.length > 3 && (
          <motion.div 
            className="glass-card p-6 rounded-2xl"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            {sortedPlayers.slice(3).map((player, index) => (
              <div 
                key={player.id}
                className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-semibold">#{index + 4}</span>
                  <PlayerAvatar
                    avatarId={player.avatarId}
                    nickname={player.nickname}
                    size="sm"
                  />
                </div>
                <span className="font-bold text-primary">{player.score.toLocaleString()} pts</span>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Regular leaderboard view
  return (
    <motion.div
      className="w-full max-w-lg mx-auto glass-card p-6 rounded-2xl"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <h2 className="text-2xl font-bold text-center mb-6 gradient-text">Leaderboard</h2>
      
      <AnimatePresence mode="popLayout">
        {sortedPlayers.map((player, index) => (
          <motion.div
            key={player.id}
            layout
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            transition={{ 
              layout: { type: "spring", stiffness: 300, damping: 30 },
              delay: index * 0.1,
            }}
            className={`flex items-center justify-between p-4 mb-3 rounded-xl ${
              index === 0 ? 'bg-accent/20' : 
              index === 1 ? 'bg-secondary/20' : 
              index === 2 ? 'bg-primary/20' : 'bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-4">
              <motion.span 
                className={`text-2xl font-bold ${
                  index === 0 ? 'text-accent' : 
                  index === 1 ? 'text-secondary' : 
                  index === 2 ? 'text-primary' : 'text-muted-foreground'
                }`}
                key={`rank-${player.id}-${index}`}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
              >
                #{index + 1}
              </motion.span>
              <PlayerAvatar
                avatarId={player.avatarId}
                nickname={player.nickname}
                size="sm"
              />
            </div>
            <motion.span 
              className="text-xl font-bold text-foreground"
              key={`score-${player.id}-${player.score}`}
              initial={{ scale: 1.3, color: 'hsl(var(--accent))' }}
              animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
            >
              {player.score.toLocaleString()}
            </motion.span>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
