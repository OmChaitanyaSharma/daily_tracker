import re

with open("src/pages/ProductivityHabits.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "const [editStartDate, setEditStartDate] = useState('');",
    "const [editStartDate, setEditStartDate] = useState('');\n  const [editFrequencyType, setEditFrequencyType] = useState<'daily' | 'specific_days'>('daily');\n  const [editSpecificDays, setEditSpecificDays] = useState<number[]>([]);",
    1
)

with open("src/pages/ProductivityHabits.tsx", "w", encoding="utf-8") as f:
    f.write(content)
