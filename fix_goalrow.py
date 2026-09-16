import re

with open("src/components/GoalTracker.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the layout in GoalRow
old_layout = """          <div className="flex items-center gap-8 text-sm cursor-pointer w-full md:w-auto justify-between md:justify-end" onClick={onClick}>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-text-muted mb-1 opacity-70">Starting</span>
              <span className="font-sans font-medium text-lg text-text-main">
                {renderValue(startingValue)}
              </span>
            </div>
            <ChevronRight size={16} className="text-border-strong group-hover:text-accent-blue transition-colors group-hover:translate-x-1" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-text-muted mb-1 opacity-70">Current</span>
              <span className="font-sans font-medium text-lg text-text-main">
                {renderValue(currentMeasurementValue)}
              </span>
            </div>
          </div>"""

new_layout = """          <div className="flex items-center gap-4 text-sm cursor-pointer w-full md:w-1/2 justify-between md:justify-end shrink-0 min-w-0" onClick={onClick}>
            <div className="flex flex-col items-end min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-text-muted mb-1 opacity-70">Starting</span>
              <span className="font-sans font-medium text-lg text-text-main truncate w-full text-right" title={String(renderValue(startingValue))}>
                {renderValue(startingValue)}
              </span>
            </div>
            <ChevronRight size={16} className="text-border-strong group-hover:text-accent-blue transition-colors group-hover:translate-x-1 shrink-0" />
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-text-muted mb-1 opacity-70">Current</span>
              <span className="font-sans font-medium text-lg text-text-main truncate w-full text-left" title={String(renderValue(currentMeasurementValue))}>
                {renderValue(currentMeasurementValue)}
              </span>
            </div>
          </div>"""

content = content.replace(old_layout, new_layout)

# Also fix the title wrapping by adding break-words
title_old = """<h3 className="text-xl font-serif text-text-main mb-2 hover:text-accent-blue transition-colors">{goal.title}</h3>"""
title_new = """<h3 className="text-xl font-serif text-text-main mb-2 hover:text-accent-blue transition-colors break-words line-clamp-2" title={goal.title}>{goal.title}</h3>"""
content = content.replace(title_old, title_new)

with open("src/components/GoalTracker.tsx", "w", encoding="utf-8") as f:
    f.write(content)
