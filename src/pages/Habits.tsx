import { Link } from 'react-router-dom';
import { Briefcase, HeartPulse, ArrowLeft, Timer } from 'lucide-react';

export function Habits() {
  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in space-y-8 sm:space-y-12">
      <header className="flex items-center gap-4 sm:gap-6 border-b border-border-subtle pb-6">
        <Link 
          to="/" 
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-bg-surface tap-press cursor-pointer"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif italic text-text-main font-semibold">Habits & Tracking</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1 sm:mt-2">Daily routines, workout logs, and focus timers</p>
        </div>
      </header>

      {/* 3-Tile Hub Layout: Two on top, Pomodoro centered underneath */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        <Link to="/habits/productivity" className="block group">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 hover-lift tap-press transition-all h-full flex flex-col items-center justify-center text-center gap-5 sm:gap-6 shadow-sm hover:border-border-strong">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-blue-bg rounded-full text-accent-blue flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
              <Briefcase size={28} className="sm:hidden" strokeWidth={1.5} />
              <Briefcase size={32} className="hidden sm:block" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-text-main mb-2 sm:mb-3 font-medium">Productivity Tracking</h2>
              <p className="text-text-muted text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Track your daily habits, study hours, work, and productivity streaks.
              </p>
            </div>
          </div>
        </Link>

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

        {/* Tile 3: Pomodoro Focus Timer (Centered Underneath) */}
        <Link to="/pomodoro" className="block group md:col-span-2 max-w-md mx-auto w-full">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 hover-lift tap-press transition-all h-full flex flex-col items-center justify-center text-center gap-5 sm:gap-6 shadow-sm hover:border-border-strong">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-yellow-bg rounded-full text-accent-yellow flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
              <Timer size={28} className="sm:hidden" strokeWidth={1.5} />
              <Timer size={32} className="hidden sm:block" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-text-main mb-2 sm:mb-3 font-medium">Pomodoro Timer</h2>
              <p className="text-text-muted text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Interval focus sessions with Web Audio chime and automatic hour logging.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
