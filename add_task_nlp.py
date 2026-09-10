import re

with open("src/components/CommandPalette.tsx", "r", encoding="utf-8") as f:
    content = f.read()

nlp_old = """           await db.hourLogs.add({
             id: crypto.randomUUID(),
             date: getTodayStr(),
             activity,
             hours
           });
           setSuccess(true);
           setFeedback(`LOGGED ${hours}H OF ${activity.toUpperCase()}`);
           setTimeout(() => {
              setSuccess(false);
              setFeedback('');
              setOpen(false);
           }, 1000);
           return;
        }
    }"""

nlp_new = """           await db.hourLogs.add({
             id: crypto.randomUUID(),
             date: getTodayStr(),
             activity,
             hours
           });
           setSuccess(true);
           setFeedback(`LOGGED ${hours}H OF ${activity.toUpperCase()}`);
           setTimeout(() => {
              setSuccess(false);
              setFeedback('');
              setOpen(false);
           }, 1000);
           return;
        }
    }

    // Natural Language Parsing Logic for Tasks (To-Do)
    if (cmd.startsWith('todo ') || cmd.startsWith('task ')) {
        const title = query.trim().substring(5).trim();
        if (title) {
           await db.tasks.add({
             id: crypto.randomUUID(),
             title: title,
             date: getTodayStr(),
             completed: false
           });
           setSuccess(true);
           setFeedback(`ADDED TASK: ${title.toUpperCase()}`);
           setTimeout(() => {
              setSuccess(false);
              setFeedback('');
              setOpen(false);
           }, 1000);
           return;
        }
    }"""

content = content.replace(nlp_old, nlp_new)

with open("src/components/CommandPalette.tsx", "w", encoding="utf-8") as f:
    f.write(content)
