import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Logo } from '@/components/Logo';
import { useGame } from '@/context/GameContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AVATARS } from '@/types/quiz';
import * as api from '@/services/api';

const Join = () => {
  const navigate = useNavigate();
  const { joinGame } = useGame();
  
  const [step, setStep] = useState<'pin' | 'profile'>('pin');
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinSubmit = async () => {
    if (pin.length !== 6) {
      setError('Please enter a 6-digit PIN');
      return;
    }
    
    setLoading(true);
    try {
      // Check if game exists
      const game = await api.getGameByPin(pin);
      if (!game) {
        setError('Game not found. Check your PIN and try again.');
        return;
      }
      
      setError('');
      setStep('profile');
    } catch (err) {
      setError('Failed to check game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }
    
    setLoading(true);
    try {
      const success = await joinGame(pin, nickname.trim(), selectedAvatar);
      
      if (success) {
        navigate(`/lobby/${pin}`);
      } else {
        setError('Failed to join game. Nickname may already be taken.');
      }
    } catch (err) {
      setError('Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <AnimatedBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => step === 'pin' ? navigate('/') : setStep('pin')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Logo size="sm" />
          <div className="w-20" />
        </header>

        <main className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {step === 'pin' && (
              <motion.div
                key="pin"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full max-w-md"
              >
                <div className="glass-card p-8 rounded-2xl text-center">
                  <h1 className="text-3xl font-bold gradient-text mb-2">Join a Game</h1>
                  <p className="text-muted-foreground mb-8">Enter the game PIN to join</p>
                  
                  <Input
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setPin(value);
                      setError('');
                    }}
                    placeholder="Enter PIN"
                    className="text-center text-4xl font-mono tracking-[0.3em] h-20 bg-muted/50 mb-4"
                    maxLength={6}
                  />
                  
                  {error && (
                    <motion.p
                      className="text-destructive text-sm mb-4"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}
                  
                  <Button
                    variant="hero"
                    size="xl"
                    onClick={handlePinSubmit}
                    disabled={pin.length !== 6 || loading}
                    className="w-full gap-2"
                  >
                    {loading ? 'Checking...' : 'Next'}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-md"
              >
                <div className="glass-card p-8 rounded-2xl">
                  <h1 className="text-3xl font-bold gradient-text mb-2 text-center">Choose Your Look</h1>
                  <p className="text-muted-foreground mb-8 text-center">Pick an avatar and nickname</p>
                  
                  {/* Avatar selection */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {AVATARS.map((avatar, index) => (
                      <motion.button
                        key={index}
                        className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all ${
                          selectedAvatar === index
                            ? 'bg-primary/30 ring-2 ring-primary scale-110'
                            : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedAvatar(index)}
                        whileHover={{ scale: selectedAvatar === index ? 1.1 : 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {avatar}
                      </motion.button>
                    ))}
                  </div>
                  
                  {/* Nickname input */}
                  <div className="mb-6">
                    <label className="text-sm text-muted-foreground mb-2 block">Nickname</label>
                    <Input
                      value={nickname}
                      onChange={(e) => {
                        setNickname(e.target.value.slice(0, 15));
                        setError('');
                      }}
                      placeholder="Enter your nickname..."
                      className="bg-muted/50 text-center text-xl"
                      maxLength={15}
                    />
                  </div>
                  
                  {error && (
                    <motion.p
                      className="text-destructive text-sm mb-4 text-center"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}
                  
                  <Button
                    variant="hero"
                    size="xl"
                    onClick={handleJoin}
                    disabled={!nickname.trim() || loading}
                    className="w-full gap-2"
                  >
                    {loading ? 'Joining...' : 'Join Game'}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Join;
