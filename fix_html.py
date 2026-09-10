import re

with open("src/pages/ProductivityHabits.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix the trailing divs
bad_divs = """                <div className="h-24 w-full pt-2" />
              </div></div>
        </div>

        </section>"""
good_divs = """                <div className="h-24 w-full pt-2" />
              </div>
            </div>
          </div>
        </section>"""
content = content.replace(bad_divs, good_divs)

# Insert the Add Modal
add_modal = """
      {isAddingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-border-strong rounded-2xl p-8 shadow-xl max-w-sm w-full animate-scale-in relative">
            <button onClick={() => setIsAddingHabit(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-main">
              <X size={20} />
            </button>
            <h3 className="text-xl font-serif italic text-text-main mb-6">Add Habit</h3>
            <form onSubmit={handleAddHabit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Habit Name</label>
                <input 
                  type="text" 
                  value={newHabitName}
                  onChange={e => setNewHabitName(e.target.value)}
                  className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-text-muted"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Frequency</label>
                <div className="flex gap-2 mb-4">
                   <button type="button" onClick={() => setNewHabitFrequency('daily')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors ${newHabitFrequency === 'daily' ? 'bg-text-main text-bg-base border-text-main' : 'bg-bg-base text-text-muted border-border-strong hover:border-text-muted'}`}>Daily</button>
                   <button type="button" onClick={() => setNewHabitFrequency('specific_days')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors ${newHabitFrequency === 'specific_days' ? 'bg-text-main text-bg-base border-text-main' : 'bg-bg-base text-text-muted border-border-strong hover:border-text-muted'}`}>Specific Days</button>
                </div>
                {newHabitFrequency === 'specific_days' && (
                  <div className="flex justify-between gap-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <button 
                        type="button" 
                        key={idx}
                        onClick={() => setNewHabitDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${newHabitDays.includes(idx) ? 'bg-accent-blue text-bg-base border-accent-blue' : 'bg-bg-base text-text-muted border-border-strong hover:border-text-muted'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" className="bg-text-main text-bg-base px-6 py-2 rounded-full font-medium text-sm hover:opacity-90">
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
"""

# Update Edit Modal to include Frequency
edit_modal_old = """                <div>
                  <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Starting Date</label>
                  <input 
                    type="date" 
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-text-muted"
                  />
                </div>
                <div className="flex justify-end pt-4">"""

edit_modal_new = """                <div>
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
                  <div className="flex gap-2 mb-4">
                     <button type="button" onClick={() => setEditFrequency('daily')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors ${editFrequency === 'daily' ? 'bg-text-main text-bg-base border-text-main' : 'bg-bg-base text-text-muted border-border-strong hover:border-text-muted'}`}>Daily</button>
                     <button type="button" onClick={() => setEditFrequency('specific_days')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors ${editFrequency === 'specific_days' ? 'bg-text-main text-bg-base border-text-main' : 'bg-bg-base text-text-muted border-border-strong hover:border-text-muted'}`}>Specific Days</button>
                  </div>
                  {editFrequency === 'specific_days' && (
                    <div className="flex justify-between gap-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                        <button 
                          type="button" 
                          key={idx}
                          onClick={() => setEditDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${editDays.includes(idx) ? 'bg-accent-blue text-bg-base border-accent-blue' : 'bg-bg-base text-text-muted border-border-strong hover:border-text-muted'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-4">"""

content = content.replace(edit_modal_old, edit_modal_new)
content = content.replace("{editingHabit && (", add_modal + "\n      {editingHabit && (")

with open("src/pages/ProductivityHabits.tsx", "w", encoding="utf-8") as f:
    f.write(content)
