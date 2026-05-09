import { motion } from 'framer-motion';
import { Player, Question } from '@/types/quiz';

interface ResultsChartProps {
  players: Player[];
  question: Question;
}

const colorClasses = [
  'bg-[hsl(var(--answer-red))]',
  'bg-[hsl(var(--answer-blue))]',
  'bg-[hsl(var(--answer-green))]',
  'bg-[hsl(var(--answer-yellow))]',
];

const shapes = ['▲', '◆', '●', '■'];

export const ResultsChart = ({ players, question }: ResultsChartProps) => {
  const counts = question.options.map((_, index) => 
    players.filter(p => p.currentAnswer === index).length
  );
  
  const totalAnswers = players.filter(p => p.currentAnswer !== null).length;
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="w-full max-w-3xl mx-auto glass-card p-8 rounded-3xl shadow-2xl">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold gradient-text mb-2">Answer Distribution</h2>
        <p className="text-muted-foreground">Total Responses: {totalAnswers}</p>
      </div>

      <div className="flex items-end justify-between h-72 gap-6 px-4">
        {counts.map((count, index) => (
          <div key={index} className="flex flex-col items-center flex-1 h-full">
            <div className="flex-1 w-full flex flex-col justify-end">
              <motion.div 
                className={`w-full rounded-t-xl relative group ${colorClasses[index]}`}
                initial={{ height: 0 }}
                animate={{ height: `${(count / maxCount) * 100}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
              >
                {/* Count badge on hover */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-3 py-1 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {count}
                </div>
                
                {/* Shape inside bar */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white/40 text-xl font-bold">
                  {shapes[index]}
                </div>
              </motion.div>
            </div>
            
            <div className="mt-6 w-full text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className={`w-3 h-3 rounded-full ${colorClasses[index]}`} />
                <span className="font-bold text-xl">{count}</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium line-clamp-2 px-1">
                {question.options[index]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
