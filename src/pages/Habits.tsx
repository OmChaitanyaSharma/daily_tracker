import { Link } from 'react-router-dom';
import { Briefcase, HeartPulse, ArrowLeft } from 'lucide-react';

export function Habits() {
  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in space-y-12">
      <header className="flex items-center gap-6 border-b border-border-subtle pb-6">
        <Link to="/" className="text-text-muted hover:text-text-main transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-serif italic text-text-main">Habits & Tracking</h1>
          <p className="text-sm text-text-muted mt-2">Daily routines and personal metrics</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link to="/habits/productivity" className="block group">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-10 hover-lift transition-all h-full flex flex-col items-center justify-center text-center gap-6">
            <div className="w-20 h-20 bg-accent-blue-bg rounded-full text-accent-blue flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
              <Briefcase size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-serif text-text-main mb-3 font-medium">Productivity Tracking</h2>
              <p className="text-text-muted text-sm max-w-sm mx-auto leading-relaxed">
                Track your daily habits, study hours, work, and productivity streaks.
              </p>
            </div>
          </div>
        </Link>

        <Link to="/habits/health" className="block group">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-10 hover-lift transition-all h-full flex flex-col items-center justify-center text-center gap-6">
            <div className="w-20 h-20 bg-accent-green-bg rounded-full text-accent-green flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
              <HeartPulse size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-serif text-text-main mb-3 font-medium">Health Tracking</h2>
              <p className="text-text-muted text-sm max-w-sm mx-auto leading-relaxed">
                Track physical health, sleep, nutrition, and fitness routines.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
