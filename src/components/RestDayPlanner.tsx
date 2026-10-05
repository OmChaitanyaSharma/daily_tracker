import { useState } from 'react';
import { isSunday, addWeeks } from 'date-fns';
import { getRestDaysConfig, saveRestDaysConfig, getWeekStartStr, getScheduleForWeek } from '../utils/restDays';
import { Calendar, Lock, Unlock } from 'lucide-react';

export function RestDayPlanner() {
  const [config, setConfig] = useState(getRestDaysConfig());
  
  // Use a state for 'today' so it updates
  const [today] = useState(() => new Date());
  
  const isSun = isSunday(today);
  
  // On Sunday, they are planning the upcoming week (starting tomorrow).
  // On other days, they are viewing the current week.
  const targetWeekStartStr = getWeekStartStr(isSun ? addWeeks(today, 1) : today);
  
  const schedule = getScheduleForWeek(targetWeekStartStr, config);

  const toggleDay = (dayIndex: number) => {
    if (!isSun) return; // Only editable on Sundays
    
    let newSchedule = [...schedule];
    if (newSchedule.includes(dayIndex)) {
      newSchedule = newSchedule.filter(d => d !== dayIndex);
    } else {
      if (newSchedule.length >= 4) {
        alert("You cannot assign more than 4 rest days per week.");
        return;
      }
      newSchedule.push(dayIndex);
    }
    
    const newConfig = { ...config, weeks: { ...config.weeks, [targetWeekStartStr]: newSchedule } };
    setConfig(newConfig);
    saveRestDaysConfig(newConfig);
  };

  const days = [
    { label: 'M', value: 1 },
    { label: 'T', value: 2 },
    { label: 'W', value: 3 },
    { label: 'T', value: 4 },
    { label: 'F', value: 5 },
    { label: 'S', value: 6 },
    { label: 'S', value: 0 },
  ];

  return (
    <div className="bg-bg-surface border border-border-strong rounded-xl p-5 mb-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-accent-blue/10 text-accent-blue rounded-lg">
          <Calendar size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-text-main text-sm">Weekly Rest Planner</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {isSun ? "Plan your recovery days for next week. (Max 4)" : "Your locked rest schedule for this week."}
          </p>
        </div>
        <div className="ml-auto">
          {isSun ? (
            <div className="flex items-center gap-1.5 text-accent-green text-xs font-bold px-2.5 py-1 bg-accent-green-bg border border-accent-green/20 rounded-md">
              <Unlock size={14} /> Unlocked
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-text-muted text-xs font-bold px-2.5 py-1 bg-bg-base border border-border-strong rounded-md">
              <Lock size={14} /> Locked
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center max-w-sm mx-auto">
        {days.map((d, i) => {
          const isSelected = schedule.includes(d.value);
          return (
            <button
              key={i}
              onClick={() => toggleDay(d.value)}
              disabled={!isSun}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isSelected 
                  ? 'bg-accent-blue text-bg-base shadow-md shadow-accent-blue/20' 
                  : 'bg-bg-base border border-border-strong text-text-muted hover:border-text-main'
              } ${!isSun && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                ${!isSun && isSelected ? 'cursor-default' : ''}`}
            >
              {d.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
