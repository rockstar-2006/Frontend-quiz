import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

interface PinDisplayProps {
  pin: string;
  size?: 'md' | 'lg';
}

export const PinDisplay = ({ pin, size = 'md' }: PinDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const copyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeClasses = {
    md: 'text-4xl tracking-[0.3em] px-8 py-4',
    lg: 'text-6xl tracking-[0.4em] px-12 py-6',
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <p className="text-lg text-muted-foreground">Game PIN</p>
      
      <motion.div
        className={`glass-card font-mono font-bold ${sizeClasses[size]} rounded-2xl flex items-center gap-4`}
        whileHover={{ scale: 1.02 }}
      >
        <span className="gradient-text">{pin}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={copyPin}
          className="text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="w-6 h-6 text-success" /> : <Copy className="w-6 h-6" />}
        </Button>
      </motion.div>
      
      {copied && (
        <motion.p
          className="text-success text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          Copied to clipboard!
        </motion.p>
      )}
    </motion.div>
  );
};
