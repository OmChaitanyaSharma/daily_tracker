import sys
import re

with open("src/pages/ProductivityHabits.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace the Unified Tracker Container with Bento Grid Start
old_container_start = '      {/* Unified Tracker Container */}\n      <section className="bg-bg-surface border border-border-strong rounded-[2rem] shadow-sm overflow-hidden p-8 md:p-12 flex flex-col gap-16">'

new_container_start = '''      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Habit Grid (Col 1-8) */}
        <section className="xl:col-span-8 bg-bg-surface border border-border-strong rounded-[2rem] shadow-sm overflow-hidden p-6 md:p-8 flex flex-col gap-6">'''

content = content.replace(old_container_start, new_container_start)


# 2. End the Habit Grid Section, start the Right Column for Graph
old_graph_start = '        {/* Progress Graph integrated inside the container */}'
new_graph_start = '''        </section>
        
        {/* Right Column: Graph & Inputs (Col 9-12) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <section className="bg-bg-surface border border-border-strong rounded-[2rem] shadow-sm overflow-hidden p-6 md:p-8 flex flex-col gap-6">
            {/* Progress Graph integrated inside the container */}'''

content = content.replace(old_graph_start, new_graph_start)


# 3. End the Right Column and the Bento Grid instead of closing the single section
old_end = '''          )}
        </div>

      </section>
    </div>'''

new_end = '''          )}
          </section>
        </div>

      </div>
    </div>'''

content = content.replace(old_end, new_end)

with open("src/pages/ProductivityHabits.tsx", "w", encoding="utf-8") as f:
    f.write(content)
