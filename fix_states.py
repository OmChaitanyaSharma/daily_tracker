import re

with open("src/pages/ProductivityHabits.tsx", "r", encoding="utf-8") as f:
    content = f.read()

state_injection = """    const [editStartDate, setEditStartDate] = useState('');
    const [editFrequencyType, setEditFrequencyType] = useState<'daily' | 'specific_days'>('daily');
    const [editSpecificDays, setEditSpecificDays] = useState<number[]>([]);"""

content = content.replace("    const [editStartDate, setEditStartDate] = useState('');", state_injection)

with open("src/pages/ProductivityHabits.tsx", "w", encoding="utf-8") as f:
    f.write(content)
