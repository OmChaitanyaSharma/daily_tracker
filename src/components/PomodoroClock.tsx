import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import clsx from 'clsx';

export function PomodoroClock() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // Play a small beep (optional)
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(mode === 'work' ? 800 : 400, ctx.currentTime);
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 mt-12 bg-[#09090b] border border-[#27272a] p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      
      <div className="flex gap-4 p-1 bg-[#18181b] rounded-full border border-[#27272a]">
        <button 
          onClick={() => switchMode('work')}
          className={clsx("px-6 py-2 rounded-full font-mono text-xs tracking-widest uppercase transition-all", mode === 'work' ? "bg-[#27272a] text-[#ececf1]" : "text-[#a1a1aa] hover:text-[#ececf1]")}
        >
          Work
        </button>
        <button 
          onClick={() => switchMode('break')}
          className={clsx("px-6 py-2 rounded-full font-mono text-xs tracking-widest uppercase transition-all flex items-center gap-2", mode === 'break' ? "bg-accent-blue/20 text-accent-blue" : "text-[#a1a1aa] hover:text-accent-blue")}
        >
          <Coffee size={14} /> Break
        </button>
      </div>

      <div className="text-8xl md:text-9xl font-mono text-[#ececf1] tracking-tighter font-light drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
        {timeString}
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={toggleTimer}
          className="w-16 h-16 flex items-center justify-center rounded-full bg-[#ececf1] text-[#09090b] hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          {isRunning ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-2" />}
        </button>
        
        <button 
          onClick={resetTimer}
          className="w-12 h-12 flex items-center justify-center rounded-full border border-[#27272a] text-[#a1a1aa] hover:border-[#ececf1] hover:text-[#ececf1] transition-all"
        >
          <RotateCcw size={20} />
        </button>
      </div>

    </div>
  );
}
