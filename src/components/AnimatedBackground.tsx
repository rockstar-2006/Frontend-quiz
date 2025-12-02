import { motion } from 'framer-motion';

export const AnimatedBackground = () => {
  return (
    <div className="floating-shapes">
      {/* Large gradient blob */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-primary/20 blur-3xl animate-blob"
        initial={{ x: -200, y: -100 }}
        animate={{ 
          x: [-200, 100, -200],
          y: [-100, 200, -100],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Secondary blob */}
      <motion.div
        className="absolute right-0 w-80 h-80 rounded-full bg-secondary/20 blur-3xl animate-blob"
        style={{ animationDelay: '-4s' }}
        initial={{ x: 200, y: 100 }}
        animate={{ 
          x: [200, -50, 200],
          y: [100, 300, 100],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Accent blob */}
      <motion.div
        className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-accent/10 blur-3xl animate-blob"
        style={{ animationDelay: '-8s' }}
        initial={{ y: 0 }}
        animate={{ 
          y: [-50, 50, -50],
          x: [-30, 30, -30],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-20 left-20 w-4 h-4 bg-primary/40 rounded-full"
        animate={{ 
          y: [-20, 20, -20],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute top-40 right-32 w-6 h-6 bg-secondary/40 rotate-45"
        animate={{ 
          rotate: [45, 225, 45],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute bottom-32 left-1/4 w-8 h-8 border-2 border-accent/40 rounded-full"
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute top-1/3 right-20 w-3 h-3 bg-accent/50 rounded-full"
        animate={{ 
          y: [-30, 30, -30],
          x: [-10, 10, -10],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute bottom-20 right-1/3 w-5 h-5 border-2 border-primary/40 rotate-45"
        animate={{ 
          rotate: [45, -135, 45],
          y: [-15, 15, -15],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};
