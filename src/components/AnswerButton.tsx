import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface AnswerButtonProps {
  index: number;
  text: string;
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
  isCorrect?: boolean;
  showResult?: boolean;
}

const colorClasses = [
  'answer-red',
  'answer-blue',
  'answer-green',
  'answer-yellow',
];

const shapes = ['▲', '◆', '●', '■'];

export const AnswerButton = ({
  index,
  text,
  onClick,
  disabled = false,
  selected = false,
  isCorrect,
  showResult = false,
}: AnswerButtonProps) => {
  const getClassName = () => {
    let base = `answer-btn ${colorClasses[index]} w-full h-24 text-lg font-bold text-foreground relative`;

    // After results: highlight the correct answer
    if (showResult && isCorrect) {
      base += ' ring-4 ring-success ring-offset-2 ring-offset-background';
    }
    // After results: fade the selected wrong answer
    else if (showResult && selected && !isCorrect) {
      base += ' opacity-60';
    }
    // While answering: show a clear highlight for selected option
    else if (!showResult && selected) {
      base += ' ring-4 ring-foreground/60 ring-offset-2 ring-offset-background';
    }

    return base;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <Button
        type="button"
        variant="answer"
        className={getClassName()}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
      >
        {/* Left shape */}
        <span className="absolute left-4 text-2xl opacity-60">
          {shapes[index]}
        </span>

        {/* Main text */}
        <span className="px-8 text-center leading-tight line-clamp-2">
          {text}
        </span>

        {/* Right side indicators */}
        <span className="absolute right-4 flex items-center gap-1">
          {/* BEFORE results: show that this option is locked/selected */}
          {!showResult && selected && (
            <motion.span
              className="flex items-center gap-1 text-sm bg-black/25 px-3 py-1 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <span className="text-base">●</span>
              <span className="uppercase tracking-wide text-xs">
                Selected
              </span>
            </motion.span>
          )}

          {/* AFTER results: correct answer */}
          {showResult && isCorrect && (
            <motion.span
              className="text-2xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              ✓
            </motion.span>
          )}

          {/* AFTER results: selected wrong answer */}
          {showResult && selected && !isCorrect && (
            <motion.span
              className="text-2xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              ✗
            </motion.span>
          )}
        </span>
      </Button>
    </motion.div>
  );
};
