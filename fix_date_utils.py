import re

with open("src/utils/dateUtils.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """    let current = parseISO(`${startDateStr}T12:00:00`);
    const end = parseISO(`${format(current, 'yyyy')}-12-31T12:00:00`);"""

new_logic = """    let current = parseISO(`${startDateStr}T12:00:00`);
    let endYear = current.getFullYear();
    // If the date is March or later, the end is March 1st of the next year
    if (current.getMonth() >= 2) {
       endYear += 1;
    }
    const end = parseISO(`${endYear}-03-01T12:00:00`);"""

content = content.replace(old_logic, new_logic)

with open("src/utils/dateUtils.ts", "w", encoding="utf-8") as f:
    f.write(content)
