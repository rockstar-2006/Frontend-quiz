import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Logo } from '@/components/Logo';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Users, Zap, Trophy } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Zap, title: 'Real-time', desc: 'Instant synchronization' },
    { icon: Users, title: 'Multiplayer', desc: 'Unlimited players' },
    { icon: Trophy, title: 'Leaderboards', desc: 'Live rankings' },
    { icon: Gamepad2, title: 'Fun', desc: 'Engaging quizzes' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <AnimatedBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen">
        {/* Hero Section */}
        <header className="flex justify-center pt-8 pb-4">
          <Logo size="lg" />
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-foreground">Create </span>
              <span className="gradient-text">Epic Quizzes</span>
              <br />
              <span className="text-foreground">Play Together</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              The ultimate multiplayer quiz platform for classrooms, parties, and fun!
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                variant="hero"
                size="xl"
                onClick={() => navigate('/host')}
                className="min-w-48"
              >
                Host a Quiz
              </Button>
              <Button
                variant="glass"
                size="xl"
                onClick={() => navigate('/join')}
                className="min-w-48"
              >
                Join Game
              </Button>
            </motion.div>
          </motion.div>

          {/* Features */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-4xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="glass-card p-6 rounded-2xl text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <feature.icon className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            Built for fun, learning, and friendly competition 🎉
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
