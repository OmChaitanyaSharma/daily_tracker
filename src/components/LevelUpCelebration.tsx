import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Code, Dumbbell, Star, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface LevelUpCelebrationProps {
  type: 'dev' | 'fit';
  level: number;
  title: string;
  onClose: () => void;
}

export function LevelUpCelebration({ type, level, title, onClose }: LevelUpCelebrationProps) {
  const isDev = type === 'dev';
  const Icon = isDev ? Code : Dumbbell;
  const colorClass = isDev ? 'text-accent-blue' : 'text-accent-green';
  const bgClass = isDev ? 'bg-accent-blue-bg' : 'bg-accent-green-bg';
  const glowColor = isDev ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)';

  useEffect(() => {
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: isDev ? ['#3b82f6', '#93c5fd', '#ffffff'] : ['#10b981', '#6ee7b7', '#ffffff'],
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: isDev ? ['#3b82f6', '#93c5fd', '#ffffff'] : ['#10b981', '#6ee7b7', '#ffffff'],
        disableForReducedMotion: true,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [isDev]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-bg-base/90 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center animate-scale-up max-w-sm w-full">
        <div 
          className={clsx("w-32 h-32 rounded-full flex items-center justify-center mb-8 relative", bgClass, colorClass)}
          style={{ boxShadow: `0 0 80px 20px ${glowColor}` }}
        >
          <div className="absolute inset-0 rounded-full border border-current opacity-30 animate-ping" style={{ animationDuration: '3s' }} />
          <Icon size={48} strokeWidth={1.5} />
          
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center shadow-lg">
            <Star size={18} className="text-accent-yellow fill-accent-yellow" />
          </div>
        </div>
        
        <p className="text-xs uppercase tracking-[0.3em] font-bold text-text-muted mb-3">
          {isDev ? 'Developer' : 'Fitness'} Level Up
        </p>
        
        <h2 className="text-5xl font-serif text-text-main mb-2">
          Level {level}
        </h2>
        
        <p className="text-xl text-text-muted mb-10">
          Rank achieved: <strong className={colorClass}>{title}</strong>
        </p>
        
        <button 
          onClick={onClose}
          className="group flex items-center gap-2 px-8 py-3 rounded-full bg-text-main text-bg-base font-semibold tracking-wide hover:opacity-90 transition-opacity"
        >
          Continue
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
