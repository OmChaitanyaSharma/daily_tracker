import React, { useState } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths, isSameDay, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

import clsx from 'clsx';

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventType, setNewEventType] = useState<'event' | 'deadline'>('event');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const allEvents = useLiveQuery(() => db.events.toArray()) ?? [];

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !newEventTitle.trim()) return;
    
    await db.events.add({
      id: crypto.randomUUID(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      type: newEventType,
      title: newEventTitle.trim(),
      description: newEventDesc.trim()
    });
    
    setNewEventTitle('');
    setNewEventDesc('');
    setIsAddingEvent(false);
  };

  const deleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await db.events.delete(id);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-4xl md:text-5xl font-serif text-text-main flex items-center gap-4">
          <CalendarIcon size={32} className="text-accent-blue" />
          Command Chrono
        </h1>
        
        <div className="flex items-center gap-4 bg-bg-surface border border-border-strong rounded-full px-2 py-1">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 text-text-muted hover:text-text-main hover:bg-bg-base rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-mono text-sm tracking-widest font-bold min-w-[120px] text-center uppercase">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 text-text-muted hover:text-text-main hover:bg-bg-base rounded-full transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-strong rounded-[2rem] shadow-sm overflow-hidden p-6 md:p-8 flex flex-col gap-6">
         <div className="grid grid-cols-7 gap-px mb-2">
           {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
             <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-text-muted py-2">
               {day}
             </div>
           ))}
         </div>
         
         <div className="grid grid-cols-7 gap-3">
            {daysInCalendar.map(day => {
               const dayStr = format(day, 'yyyy-MM-dd');
               const dayEvents = allEvents.filter(e => e.date === dayStr);
               const isSelected = selectedDate && isSameDay(day, selectedDate);
               const isCurrentMonth = isSameMonth(day, currentDate);
               const isToday = isSameDay(day, new Date());
               
               return (
                 <div 
                   key={dayStr}
                   onClick={() => {
                     setSelectedDate(day);
                     setIsAddingEvent(true);
                   }}
                   className={clsx(
                     "min-h-[100px] border rounded-xl p-2 cursor-pointer transition-all flex flex-col gap-1 relative overflow-hidden group",
                     isSelected ? "border-accent-blue bg-accent-blue/10" : "border-border-strong bg-bg-base hover:border-text-muted",
                     !isCurrentMonth && "opacity-40 grayscale"
                   )}
                 >
                   <div className="flex justify-between items-start mb-1">
                      <span className={clsx("text-xs font-mono font-bold", isToday ? "text-accent-blue" : "text-text-muted")}>
                        {format(day, 'd')}
                      </span>
                      {isToday && <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />}
                   </div>
                   
                   <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                     {dayEvents.map(evt => (
                        <div 
                          key={evt.id} 
                          className={clsx(
                            "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded truncate flex items-center justify-between group/evt",
                            evt.type === 'deadline' ? "bg-accent-red-bg text-accent-red border border-accent-red/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "bg-bg-surface text-text-main border border-border-strong"
                          )}
                        >
                          <span className="truncate">{evt.title}</span>
                          <button onClick={(e) => deleteEvent(evt.id, e)} className="opacity-0 group-hover/evt:opacity-100 hover:text-text-main">
                            <X size={10} />
                          </button>
                        </div>
                     ))}
                   </div>
                   
                   <div className="absolute inset-0 bg-bg-surface/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none backdrop-blur-[1px]">
                      <Plus className="text-text-muted" size={24} />
                   </div>
                 </div>
               );
            })}
         </div>
      </div>
      
      {isAddingEvent && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-border-strong rounded-2xl p-8 shadow-xl max-w-sm w-full animate-scale-in relative">
            <button onClick={() => setIsAddingEvent(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-main">
              <X size={20} />
            </button>
            <h3 className="text-xl font-serif italic text-text-main mb-2">Schedule Log</h3>
            <p className="text-xs text-text-muted mb-6 font-mono">{format(selectedDate, 'EEEE, MMMM do, yyyy')}</p>
            
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Title</label>
                <input 
                  type="text" 
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-text-muted"
                  autoFocus
                  required
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Log Type</label>
                <div className="flex gap-2 mb-4">
                   <button type="button" onClick={() => setNewEventType('event')} className={clsx("flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors", newEventType === 'event' ? "bg-text-main text-bg-base border-text-main" : "bg-bg-base text-text-muted border-border-strong hover:border-text-muted")}>Event</button>
                   <button type="button" onClick={() => setNewEventType('deadline')} className={clsx("flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors flex items-center justify-center gap-1", newEventType === 'deadline' ? "bg-accent-red text-bg-base border-accent-red shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-bg-base text-accent-red border-border-strong hover:border-accent-red")}>
                     <Clock size={12}/> Deadline
                   </button>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Description (Optional)</label>
                <textarea 
                  value={newEventDesc}
                  onChange={e => setNewEventDesc(e.target.value)}
                  className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-text-muted resize-none h-24"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" className="bg-text-main text-bg-base px-6 py-2 rounded-full font-medium text-sm hover:opacity-90">
                  Deploy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
