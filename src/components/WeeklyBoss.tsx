import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

import clsx from 'clsx';
import { getISOWeek, getYear, startOfWeek, endOfWeek, format } from 'date-fns';

export function WeeklyBoss() {
  const today = new Date();
  const weekStr = `${getYear(today)}-W${getISOWeek(today)}`;
  
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });
  
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');

  // Load or create Boss
  const boss = useLiveQuery(async () => {
    let current = await db.bosses.where('weekStr').equals(weekStr).first();
    if (!current) {
      current = {
        id: crypto.randomUUID(),
        name: 'The Procrastinator',
        maxHp: 1000,
        hp: 1000,
        isDefeated: false,
        weekStr
      };
      await db.bosses.add(current);
    }
    return current;
  }, [weekStr]);

  // Calculate damage based on completed habits this week
  const damage = useLiveQuery(async () => {
    const logs = await db.habitLogs.where('date').between(startStr, endStr, true, true).toArray();
    const completed = logs.filter(l => l.status === 'completed').length;
    
    // Also include exercises
    const exerciseLogs = await db.exerciseLogs.where('date').between(startStr, endStr, true, true).toArray();
    
    // Also include hour logs (10 dmg per hour)
    const hourLogs = await db.hourLogs.where('date').between(startStr, endStr, true, true).toArray();
    const totalHours = hourLogs.reduce((sum, l) => sum + l.hours, 0);

    return (completed * 10) + (exerciseLogs.length * 20) + (totalHours * 10);
  }, [startStr, endStr]);

  if (!boss || damage === undefined) return null;

  const currentHp = Math.max(0, boss.maxHp - damage);
  const hpPercentage = (currentHp / boss.maxHp) * 100;
  const isDead = currentHp <= 0;

  return (
    <div className="bg-bg-surface border border-border-strong rounded-[2rem] p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group h-full">
      
      {/* Background visual based on boss health */}
      <div className={clsx("absolute inset-0 opacity-10 transition-colors duration-1000", isDead ? "bg-accent-green" : "bg-accent-red")} />
      
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-text-muted mb-1">Weekly Boss</h3>
          <h2 className={clsx("text-xl font-serif font-bold", isDead ? "text-accent-green" : "text-text-main")}>
            {isDead ? "Defeated!" : boss.name}
          </h2>
        </div>
        <div className={clsx("text-4xl transition-transform duration-500", isDead ? "scale-110" : "animate-pulse")}>
           {isDead ? '??' : '??'}
        </div>
      </div>

      <div className="relative z-10 space-y-2 mt-auto">
        <div className="flex justify-between text-xs font-mono font-bold uppercase tracking-widest text-text-muted">
          <span>HP</span>
          <span className={isDead ? "text-accent-green" : "text-text-main"}>{Math.floor(currentHp)} / {boss.maxHp}</span>
        </div>
        
        {/* HP Bar */}
        <div className="h-2 bg-bg-base rounded-full overflow-hidden border border-border-subtle">
          <div 
            className={clsx("h-full transition-all duration-1000", isDead ? "bg-accent-green" : "bg-accent-red")}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
        
        <div className="text-[10px] text-text-muted text-right uppercase tracking-widest font-mono font-bold">
            Total Dmg: {Math.floor(damage)}
        </div>
      </div>
      
    </div>
  );
}
