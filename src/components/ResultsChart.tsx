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
  let displayData: { label: string; count: number; colorClass: string; shape?: string }[] = [];

  if (question.type === 'multiple-choice') {
    displayData = question.options.map((option, index) => ({
      label: option,
      count: players.filter(p => p.currentAnswer === index).length,
      colorClass: colorClasses[index % colorClasses.length],
      shape: shapes[index % shapes.length]
    }));
  } else {
    // Text pooling
    const textCounts: Record<string, number> = {};
    players.forEach(p => {
      if (p.textAnswer) {
        // Normalize to UPPERCASE for accurate counting as requested
        const normalized = p.textAnswer.trim().toUpperCase();
        textCounts[normalized] = (textCounts[normalized] || 0) + 1;
      }
    });
    
    // Sort by count and take top 6
    displayData = Object.entries(textCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count], index) => ({
        label: label, // Already Uppercase
        count: count,
        colorClass: colorClasses[index % colorClasses.length],
        shape: shapes[index % shapes.length]
      }));
  }
  
  const totalAnswers = players.filter(p => p.currentAnswer !== null || p.textAnswer).length;
  const maxCount = Math.max(...displayData.map(d => d.count), 1);

  return (
    <div className="w-full max-w-3xl mx-auto glass-card p-8 rounded-3xl shadow-2xl">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold gradient-text mb-2">
          {question.type === 'text' ? 'Top Answers' : 'Answer Distribution'}
        </h2>
        <p className="text-muted-foreground">Total Responses: {totalAnswers}</p>
      </div>

      <div className="flex items-end justify-around h-72 gap-6 px-4">
        {displayData.length > 0 ? displayData.map((data, index) => (
          <div key={index} className="flex flex-col items-center flex-1 h-full max-w-[150px]">
            <div className="flex-1 w-full flex flex-col justify-end">
              <motion.div 
                className={`w-full rounded-t-xl relative group ${data.colorClass}`}
                initial={{ height: 0 }}
                animate={{ height: `${(data.count / maxCount) * 100}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
              >
                {/* Count badge on hover */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-3 py-1 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {data.count}
                </div>
                
                {/* Shape inside bar */}
                {data.shape && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white/40 text-xl font-bold">
                    {data.shape}
                  </div>
                )}
              </motion.div>
            </div>
            
            <div className="mt-6 w-full text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className={`w-3 h-3 rounded-full ${data.colorClass}`} />
                <span className="font-bold text-xl">{data.count}</span>
              </div>
              <p className="text-sm text-foreground font-semibold line-clamp-1 px-1">
                {data.label}
              </p>
            </div>
          </div>
        )) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <p className="text-muted-foreground italic">No answers submitted yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
