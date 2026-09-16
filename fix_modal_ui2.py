import re

with open("src/pages/ProductivityHabits.tsx", "r", encoding="utf-8") as f:
    content = f.read()

injection = """
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

content = re.sub(r'<div className="flex justify-end pt-4">', injection, content, count=1)

with open("src/pages/ProductivityHabits.tsx", "w", encoding="utf-8") as f:
    f.write(content)
