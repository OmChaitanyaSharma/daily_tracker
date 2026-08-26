import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function HealthHabits() {
  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in space-y-12">
      <header className="flex items-center gap-6 border-b border-border-subtle pb-6">
        <Link to="/habits" className="text-text-muted hover:text-text-main transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-serif italic text-text-main">Health Tracking</h1>
          <p className="text-sm text-text-muted mt-2">Physical health, sleep, and fitness</p>
        </div>
      </header>

      <div className="bg-bg-surface border border-border-subtle rounded-3xl p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
        <p className="text-text-muted">Template ready. Waiting for further instructions...</p>
      </div>
    </div>
  );
}
