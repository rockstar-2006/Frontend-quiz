import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  isLarge?: boolean;
}

export const CountdownTimer = ({ seconds, onComplete, isLarge = false }: CountdownTimerProps) => {
  const [count, setCount] = useState(seconds);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  if (isLarge) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-9xl font-bold gradient-text"
          >
            {count > 0 ? count : 'GO!'}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  const progress = (count / seconds) * 100;
  const isWarning = count <= 5;
  const isCritical = count <= 3;

  return (
    <motion.div 
      className="relative w-24 h-24"
      animate={isCritical ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
    >
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="44"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-muted"
        />
        <motion.circle
          cx="48"
          cy="48"
          r="44"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeLinecap="round"
          className={isCritical ? 'text-destructive' : isWarning ? 'text-accent' : 'text-primary'}
          strokeDasharray={276.46}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: 276.46 * (1 - progress / 100) }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-3xl font-bold ${isCritical ? 'text-destructive' : isWarning ? 'text-accent' : 'text-foreground'}`}>
          {count}
        </span>
      </div>
    </motion.div>
  );
};
