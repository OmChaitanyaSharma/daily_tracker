import re

with open("src/pages/ProductivityHabits.tsx", "r", encoding="utf-8") as f:
    content = f.read()

grid_start_old = """      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Habit Grid (Col 1-8) */}
        <section className="xl:col-span-8 bg-bg-surface border border-border-strong rounded-[2rem] shadow-sm overflow-hidden p-6 md:p-8 flex flex-col gap-6">"""

grid_start_new = """      {/* Bento Grid Container */}
      <div className="flex flex-col gap-6">
        
        {/* Habit Grid */}
        <section className="w-full bg-bg-surface border border-border-strong rounded-[2rem] shadow-sm overflow-hidden p-6 md:p-8 flex flex-col gap-6">"""

content = content.replace(grid_start_old, grid_start_new)

col_end_old = """        </section>
        
        {/* Right Column: Graph & Inputs (Col 9-12) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
"""

col_end_new = """        </section>
        
        {/* Bottom Section: Graph & Inputs */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
"""

content = content.replace(col_end_old, col_end_new)

with open("src/pages/ProductivityHabits.tsx", "w", encoding="utf-8") as f:
    f.write(content)
