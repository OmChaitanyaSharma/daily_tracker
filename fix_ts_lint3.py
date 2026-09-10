with open("src/utils/calendarSync.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("""// function formatICSDate(dateStr: string): string {
  // Assuming dateStr is YYYY-MM-DD
  return dateStr.replace(/-/g, '') + 'T000000Z';
}""", "")

with open("src/utils/calendarSync.ts", "w", encoding="utf-8") as f:
    f.write(content)
