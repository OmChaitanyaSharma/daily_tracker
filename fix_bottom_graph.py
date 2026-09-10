import re

with open("src/pages/ProductivityHabits.tsx", "r", encoding="utf-8") as f:
    content = f.read()

bottom_old = """        {/* Bottom Section: Graph & Inputs */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-bg-surface border border-border-strong rounded-[2rem] shadow-sm overflow-hidden p-6 md:p-8 flex flex-col gap-6">"""

bottom_new = """        {/* Bottom Section: Graph & Inputs */}
        <div className="w-full flex flex-col gap-6">
          <section className="w-full bg-bg-surface border border-border-strong rounded-[2rem] shadow-sm overflow-hidden p-6 md:p-8 flex flex-col gap-6">"""

content = content.replace(bottom_old, bottom_new)

with open("src/pages/ProductivityHabits.tsx", "w", encoding="utf-8") as f:
    f.write(content)
