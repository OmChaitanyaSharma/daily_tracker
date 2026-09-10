import re

with open("src/components/CommandPalette.tsx", "r", encoding="utf-8") as f:
    content = f.read()

nlp_old = """    // Natural Language Parsing Logic
    if (cmd.startsWith('log ') && cmd.includes('h ')) {
        // e.g. "log 2h web dev"
        const match = cmd.match(/log ([\\d.]+)h (.*)/);
        if (match) {
           const hours = parseFloat(match[1]);
           const activity = match[2];
           await db.hourLogs.add({
             id: crypto.randomUUID(),
             date: getTodayStr(),
             activity,
             hours
           });"""

nlp_new = """    // Natural Language Parsing Logic
    if (cmd.startsWith('log ') && cmd.includes('h ')) {
        // e.g. "log 2h web dev"
        const match = cmd.match(/log ([\\d.]+)h (.*)/);
        if (match) {
           const hours = parseFloat(match[1]);
           let activity = match[2];
           
           // Match with existing categories case-insensitively
           const categories = await db.hourCategories.toArray();
           const foundCat = categories.find(c => c.name.toLowerCase() === activity);
           if (foundCat) {
             activity = foundCat.name;
           } else {
             // If not found, create it so it's visible
             await db.hourCategories.add({
               id: crypto.randomUUID(),
               name: activity,
               color: 'var(--accent-blue)',
               createdAt: new Date().toISOString()
             });
           }

           await db.hourLogs.add({
             id: crypto.randomUUID(),
             date: getTodayStr(),
             activity,
             hours
           });"""

content = content.replace(nlp_old, nlp_new)

with open("src/components/CommandPalette.tsx", "w", encoding="utf-8") as f:
    f.write(content)
