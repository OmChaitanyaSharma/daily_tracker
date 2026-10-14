import { Link } from 'react-router-dom';
import { CheckSquare, HeartPulse, GraduationCap, ArrowLeft } from 'lucide-react';

export function Habits() {
  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in space-y-8 sm:space-y-12">
      <header className="flex items-center gap-4 sm:gap-6 border-b border-border-subtle pb-6">
        <Link to="/" className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-bg-surface tap-press cursor-pointer" aria-label="Go back to home">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif italic text-text-main font-semibold">Habits & Tracking</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1 sm:mt-2">Daily routines, workouts, and deep focus metrics</p>
        </div>
      </header>

      {/* 3-Pill Hub Layout: Two on top, third centered underneath */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        {/* Pill 1: Daily Habits */}
        <Link to="/habits/productivity" className="block group">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 hover-lift tap-press transition-all h-full flex flex-col items-center justify-center text-center gap-5 sm:gap-6 shadow-sm hover:border-border-strong">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-blue-bg rounded-full text-accent-blue flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
              <CheckSquare size={28} className="sm:hidden" strokeWidth={1.5} />
              <CheckSquare size={32} className="hidden sm:block" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-text-main mb-2 sm:mb-3 font-medium">Daily Habits</h2>
              <p className="text-text-muted text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Track your daily habits matrix, routine completion, and consistency streaks.
              </p>
            </div>
          </div>
        </Link>

        {/* Pill 2: Exercise Tracking */}
        <Link to="/habits/health" className="block group">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 hover-lift tap-press transition-all h-full flex flex-col items-center justify-center text-center gap-5 sm:gap-6 shadow-sm hover:border-border-strong">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-green-bg rounded-full text-accent-green flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
              <HeartPulse size={28} className="sm:hidden" strokeWidth={1.5} />
              <HeartPulse size={32} className="hidden sm:block" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-text-main mb-2 sm:mb-3 font-medium">Exercise Tracking</h2>
              <p className="text-text-muted text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Count reps for your custom exercises and maintain your workout streak.
              </p>
            </div>
          </div>
        </Link>

        {/* Pill 3: Study and Deep Work (Centered Underneath) */}
        <Link to="/habits/study" className="block group md:col-span-2 max-w-md mx-auto w-full">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 hover-lift tap-press transition-all h-full flex flex-col items-center justify-center text-center gap-5 sm:gap-6 shadow-sm hover:border-border-strong">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-purple/15 rounded-full text-accent-purple flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
              <GraduationCap size={28} className="sm:hidden" strokeWidth={1.5} />
              <GraduationCap size={32} className="hidden sm:block" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-text-main mb-2 sm:mb-3 font-medium">Study and Deep Work</h2>
              <p className="text-text-muted text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Visualize monthly hours tracked, manage subject categories, and review focus logs.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
