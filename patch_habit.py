import re

with open("src/pages/ProductivityHabits.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add State
state_old = """    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [editName, setEditName] = useState('');
    const [editStartDate, setEditStartDate] = useState('');"""
state_new = """    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [editName, setEditName] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editFrequencyType, setEditFrequencyType] = useState<'daily' | 'specific_days'>('daily');
    const [editSpecificDays, setEditSpecificDays] = useState<number[]>([]);"""
content = content.replace(state_old, state_new)

# 2. Add to handleMenuClick (opening edit modal)
menu_old = """                                  setEditName(habit.name);
                                  setEditStartDate(habit.startDate || '');
                                  setEditingHabit(habit);"""
menu_new = """                                  setEditName(habit.name);
                                  setEditStartDate(habit.startDate || '');
                                  setEditFrequencyType(habit.frequencyType || 'daily');
                                  setEditSpecificDays(habit.specificDays || []);
                                  setEditingHabit(habit);"""
content = content.replace(menu_old, menu_new)

# 3. Add to saveEditHabit
save_old = """      await db.habits.update(editingHabit.id, { 
        name: editName.trim(),
        startDate: editStartDate || undefined
      });"""
save_new = """      await db.habits.update(editingHabit.id, { 
        name: editName.trim(),
        startDate: editStartDate || undefined,
        frequencyType: editFrequencyType,
        specificDays: editSpecificDays
      });"""
content = content.replace(save_old, save_new)

# 4. Modify Modal UI
modal_old = """                <div>
                  <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Starting Date</label>
                  <input 
                    type="date" 
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-text-muted"
                  />
                </div>
                <div className="flex justify-end pt-4">"""

modal_new = """                <div>
                  <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Starting Date</label>
                  <input 
                    type="date" 
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-text-muted"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Frequency</label>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setEditFrequencyType('daily')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${editFrequencyType === 'daily' ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-border-strong text-text-muted hover:border-text-muted'}`}>Daily</button>
                    <button type="button" onClick={() => setEditFrequencyType('specific_days')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${editFrequencyType === 'specific_days' ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-border-strong text-text-muted hover:border-text-muted'}`}>Specific Days</button>
                  </div>
                  {editFrequencyType === 'specific_days' && (
                    <div className="flex justify-between gap-1 mt-2">
                      {['S','M','T','W','T','F','S'].map((day, i) => (
                        <button 
                          key={i} 
                          type="button"
                          onClick={() => setEditSpecificDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${editSpecificDays.includes(i) ? 'bg-accent-blue text-bg-base' : 'bg-bg-base border border-border-strong text-text-muted hover:border-text-muted'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-4">"""
content = content.replace(modal_old, modal_new)

# 5. Modify isEligible in grid
grid_old = """                    const currentStatus = log?.status || 'none';
                    const startDateStr = habit.startDate || '2000-01-01';
                    const isEligible = dateStr >= startDateStr;
                    const isSunday = date.getDay() === 0;"""
grid_new = """                    const currentStatus = log?.status || 'none';
                    const startDateStr = habit.startDate || '2000-01-01';
                    
                    let isEligible = dateStr >= startDateStr;
                    if (isEligible && habit.frequencyType === 'specific_days' && habit.specificDays) {
                      isEligible = habit.specificDays.includes(date.getDay());
                    }
                    
                    const isSunday = date.getDay() === 0;"""
content = content.replace(grid_old, grid_new)

# 6. Modify eligibleDays in score
score_old = """                    daysInMonth.forEach(date => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      if (dateStr >= startDateStr) {
                        eligibleDays++;
                        const log = habitLogs.find(l => l.date === dateStr && l.habitId === habit.id);"""
score_new = """                    daysInMonth.forEach(date => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      let isEligible = dateStr >= startDateStr;
                      if (isEligible && habit.frequencyType === 'specific_days' && habit.specificDays) {
                        isEligible = habit.specificDays.includes(date.getDay());
                      }
                      if (isEligible) {
                        eligibleDays++;
                        const log = habitLogs.find(l => l.date === dateStr && l.habitId === habit.id);"""
content = content.replace(score_old, score_new)

with open("src/pages/ProductivityHabits.tsx", "w", encoding="utf-8") as f:
    f.write(content)
