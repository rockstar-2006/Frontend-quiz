import { motion } from 'framer-motion';
import { AVATARS } from '@/types/quiz';

interface PlayerAvatarProps {
  avatarId: number;
  nickname: string;
  score?: number;
  rank?: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  isWinner?: boolean;
}

export const PlayerAvatar = ({ 
  avatarId, 
  nickname, 
  score, 
  rank,
  size = 'md',
  showScore = false,
  isWinner = false,
}: PlayerAvatarProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-24 h-24 text-5xl',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };

  return (
    <motion.div 
      className="flex flex-col items-center gap-2"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {rank && (
        <motion.div 
          className={`font-bold ${rank === 1 ? 'text-accent text-xl' : rank === 2 ? 'text-secondary text-lg' : rank === 3 ? 'text-primary text-lg' : 'text-muted-foreground'}`}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          #{rank}
        </motion.div>
      )}
      
      <motion.div 
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center glass-card ${isWinner ? 'ring-4 ring-accent ring-offset-2 ring-offset-background' : ''}`}
        animate={isWinner ? { 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        } : {}}
        transition={{ duration: 0.5, repeat: isWinner ? Infinity : 0, repeatDelay: 1 }}
      >
        <span>{AVATARS[avatarId] || '🎮'}</span>
      </motion.div>
      
      <span className={`${textSizes[size]} font-semibold text-foreground truncate max-w-20`}>
        {nickname}
      </span>
      
      {showScore && score !== undefined && (
        <motion.span 
          className={`${textSizes[size]} font-bold text-primary`}
          key={score}
          initial={{ scale: 1.5, color: 'hsl(var(--accent))' }}
          animate={{ scale: 1, color: 'hsl(var(--primary))' }}
          transition={{ duration: 0.5 }}
        >
          {score.toLocaleString()} pts
        </motion.span>
      )}
    </motion.div>
  );
};
