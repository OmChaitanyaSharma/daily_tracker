import re

with open("src/pages/ProductivityHabits.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_old = "import { useSound } from '../hooks/useSound';"
import_new = "import { useSound } from '../hooks/useSound';\nimport { motion, AnimatePresence } from 'framer-motion';"
content = content.replace(import_old, import_new)

# Locate the habit mapping
habit_mapping_old = """                  <div
                    key={habit.id}
                    className={clsx(
                      "group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                      log?.status === 'completed' 
                        ? "bg-accent-green-bg/30 border-accent-green/30" 
                        : "bg-bg-base border-border-strong hover:border-border-subtle hover:bg-bg-surface-hover"
                    )}
                    onClick={() => toggleHabit(habit.id, dateStr, log?.status, log?.id)}
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        className={clsx(
                          "w-6 h-6 rounded-md flex items-center justify-center border transition-colors",
                          log?.status === 'completed' 
                            ? "bg-accent-green border-accent-green text-[#09090b]" 
                            : log?.status === 'partial'
                            ? "bg-accent-yellow border-accent-yellow text-[#09090b]"
                            : "border-text-muted text-transparent group-hover:border-text-main"
                        )}
                      >
                        {log?.status === 'completed' && <Check size={14} strokeWidth={4} />}
                        {log?.status === 'partial' && <Minus size={14} strokeWidth={4} />}
                      </button>
                      <span className={clsx(
                        "text-base transition-colors",
                        log?.status === 'completed' ? "text-text-muted line-through" : "text-text-main font-medium"
                      )}>
                        {habit.name}
                      </span>
                    </div>
                  </div>"""

habit_mapping_new = """                  <motion.div
                    key={habit.id}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                       if (offset.x > 50 || velocity.x > 500) {
                          // Swipe right to complete
                          if (log?.status !== 'completed') toggleHabit(habit.id, dateStr, log?.status, log?.id);
                       } else if (offset.x < -50 || velocity.x < -500) {
                          // Swipe left to undo
                          if (log?.status === 'completed') toggleHabit(habit.id, dateStr, 'completed', log?.id);
                       }
                    }}
                    className={clsx(
                      "group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer relative",
                      log?.status === 'completed' 
                        ? "bg-accent-green-bg/30 border-accent-green/30" 
                        : "bg-bg-base border-border-strong hover:border-border-subtle hover:bg-bg-surface-hover"
                    )}
                    onClick={() => toggleHabit(habit.id, dateStr, log?.status, log?.id)}
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        className={clsx(
                          "w-6 h-6 rounded-md flex items-center justify-center border transition-colors",
                          log?.status === 'completed' 
                            ? "bg-accent-green border-accent-green text-[#09090b]" 
                            : log?.status === 'partial'
                            ? "bg-accent-yellow border-accent-yellow text-[#09090b]"
                            : "border-text-muted text-transparent group-hover:border-text-main"
                        )}
                      >
                        {log?.status === 'completed' && <Check size={14} strokeWidth={4} />}
                        {log?.status === 'partial' && <Minus size={14} strokeWidth={4} />}
                      </button>
                      <span className={clsx(
                        "text-base transition-colors",
                        log?.status === 'completed' ? "text-text-muted line-through" : "text-text-main font-medium"
                      )}>
                        {habit.name}
                      </span>
                    </div>
                  </motion.div>"""

content = content.replace(habit_mapping_old, habit_mapping_new)

with open("src/pages/ProductivityHabits.tsx", "w", encoding="utf-8") as f:
    f.write(content)
