import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '../db';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';

interface TodoListProps {
  date: string; // YYYY-MM-DD
  title?: string;
  readOnly?: boolean;
}

export function TodoList({ date, title = "What do I want to do tomorrow?", readOnly = false }: TodoListProps) {
  const [newTaskText, setNewTaskText] = useState('');

  const tasks = useLiveQuery(async () => {
    return await db.tasks.where('date').equals(date).toArray();
  }, [date]) || [];

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    await db.tasks.add({
      id: crypto.randomUUID(),
      title: newTaskText.trim(),
      date,
      completed: false
    });
    setNewTaskText('');
  };

  const toggleTask = async (task: Task) => {
    await db.tasks.update(task.id, { completed: !task.completed });
  };

  const deleteTask = async (id: string) => {
    await db.tasks.delete(id);
  };

  return (
    <div className="bg-bg-surface border border-border-strong rounded-2xl p-6 transition-all focus-within:border-accent-blue focus-within:ring-2 focus-within:ring-accent-blue-bg shadow-sm">
      {title && (
        <h3 className="block text-[10px] font-bold tracking-widest uppercase text-text-muted mb-4 group-focus-within:text-accent-blue transition-colors">
          {title}
        </h3>
      )}
      
      <div className="space-y-3 mb-4">
        {tasks.map(task => (
          <div key={task.id} className="flex items-start gap-3 group/item">
            <span className="text-sm font-semibold text-text-muted mt-0.5 min-w-[1.2rem] text-right">
              {tasks.indexOf(task) + 1}.
            </span>
            <button 
              onClick={() => toggleTask(task)}
              className="mt-0.5 shrink-0 transition-colors"
            >
              {task.completed ? (
                <CheckCircle2 size={18} className="text-accent-green" />
              ) : (
                <Circle size={18} className="text-text-muted hover:text-accent-blue" />
              )}
            </button>
            <span className={clsx("flex-1 text-sm leading-snug transition-all", task.completed ? "text-text-muted line-through" : "text-text-main")}>
              {task.title}
            </span>
            {!readOnly && (
              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover/item:opacity-100 text-text-muted hover:text-accent-red p-1 transition-all"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}

      </div>

      {!readOnly && (
        <form 
          onSubmit={e => {
            e.preventDefault();
            handleAddTask();
          }} 
          className="flex items-center gap-3 mt-4 pt-4 border-t border-border-subtle group-focus-within:border-accent-blue/30 transition-colors"
        >
          <span className="text-sm font-semibold text-text-muted min-w-[1.2rem] text-right">
            {tasks.length + 1}.
          </span>
          <input
            type="text"
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            placeholder="Add a new objective..."
            className="flex-1 bg-transparent text-sm text-text-main focus:outline-none placeholder:text-text-muted/50"
          />
          <button 
            type="submit"
            disabled={!newTaskText.trim()}
            className="text-text-muted hover:text-accent-blue disabled:opacity-30 disabled:hover:text-text-muted transition-colors p-1"
          >
            <Plus size={18} />
          </button>
        </form>
      )}
    </div>
  );
}
