import re

with open("src/pages/ProductivityHabits.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. State for Add Modal
state_old = "  const [isAddingHabit, setIsAddingHabit] = useState(false);"
state_new = """  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily'|'specific_days'>('daily');
  const [newHabitDays, setNewHabitDays] = useState<number[]>([]);"""
content = content.replace(state_old, state_new)

# 2. State for Edit Modal
state_edit_old = """    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [editName, setEditName] = useState('');
    const [editStartDate, setEditStartDate] = useState('');"""
state_edit_new = """    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [editName, setEditName] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editFrequency, setEditFrequency] = useState<'daily'|'specific_days'>('daily');
    const [editDays, setEditDays] = useState<number[]>([]);"""
content = content.replace(state_edit_old, state_edit_new)

# 3. Handle Add
add_old = """    const handleAddHabit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newHabitName.trim()) return;
      await db.habits.add({
        id: crypto.randomUUID(),
        name: newHabitName.trim(),
        createdAt: new Date().toISOString(),
        startDate: getTodayStr(),
        archived: false
      });
      setNewHabitName('');
      setIsAddingHabit(false);
    };"""
add_new = """    const handleAddHabit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newHabitName.trim()) return;
      await db.habits.add({
        id: crypto.randomUUID(),
        name: newHabitName.trim(),
        createdAt: new Date().toISOString(),
        startDate: getTodayStr(),
        archived: false,
        frequencyType: newHabitFrequency,
        daysOfWeek: newHabitFrequency === 'specific_days' ? newHabitDays : undefined
      });
      setNewHabitName('');
      setNewHabitFrequency('daily');
      setNewHabitDays([]);
      setIsAddingHabit(false);
    };"""
content = content.replace(add_old, add_new)

# 4. Handle Edit
edit_save_old = """    const saveEditHabit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingHabit || !editName.trim()) return;
      await db.habits.update(editingHabit.id, { 
        name: editName.trim(),
        startDate: editStartDate || undefined
      });
      setEditingHabit(null);
      setEditName('');
      setEditStartDate('');
    };"""
edit_save_new = """    const saveEditHabit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingHabit || !editName.trim()) return;
      await db.habits.update(editingHabit.id, { 
        name: editName.trim(),
        startDate: editStartDate || undefined,
        frequencyType: editFrequency,
        daysOfWeek: editFrequency === 'specific_days' ? editDays : undefined
      });
      setEditingHabit(null);
      setEditName('');
      setEditStartDate('');
      setEditFrequency('daily');
      setEditDays([]);
    };"""
content = content.replace(edit_save_old, edit_save_new)

# 5. Populate Edit State
edit_trigger_old = """                                  setEditName(habit.name);
                                  setEditStartDate(habit.startDate || '');
                                  setEditingHabit(habit);
                                  setActiveMenuHabitId(null);"""
edit_trigger_new = """                                  setEditName(habit.name);
                                  setEditStartDate(habit.startDate || '');
                                  setEditFrequency(habit.frequencyType || 'daily');
                                  setEditDays(habit.daysOfWeek || []);
                                  setEditingHabit(habit);
                                  setActiveMenuHabitId(null);"""
content = content.replace(edit_trigger_old, edit_trigger_new)


with open("src/pages/ProductivityHabits.tsx", "w", encoding="utf-8") as f:
    f.write(content)
