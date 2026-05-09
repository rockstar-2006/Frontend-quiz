import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo = ({ size = 'md' }: LogoProps) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl',
  };

  return (
    <motion.div 
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="relative"
        animate={{ 
          rotate: [0, 10, -10, 0],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className={`${sizeClasses[size]}`}>🎯</span>
      </motion.div>
      <span className={`${sizeClasses[size]} font-bold gradient-text`}>
        QuizBlitz
      </span>
    </motion.div>
  );
};
