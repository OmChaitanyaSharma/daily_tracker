import re

with open("src/components/Layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the H1 and add PomodoroClock
h1_regex = re.compile(r"<h1.*?</h1>", re.DOTALL)
replacement = """<h1 className="text-4xl md:text-5xl font-serif text-[#ececf1] mb-8 tracking-tight text-center max-w-2xl leading-tight">
             Time to execute.
           </h1>
           <PomodoroClock />
"""
content = h1_regex.sub(replacement, content)

# Adjust the button margin so it looks good under the Pomodoro
content = content.replace('className="px-10 py-5 rounded-full border', 'className="mt-12 px-10 py-5 rounded-full border')

with open("src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
