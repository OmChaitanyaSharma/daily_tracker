import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getSettings } from '../utils/settings';
import { Target, Heart, ArrowLeft, Compass } from 'lucide-react';

export function Goals() {
  const endOfYearCount = useLiveQuery(() => db.goals.where('category').equals('end-of-year').count()) ?? 0;
  const healthCount = useLiveQuery(() => db.goals.where('category').equals('health').count()) ?? 0;
  const lifetimeCount = useLiveQuery(() => db.goals.where('category').equals('lifetime').count()) ?? 0;

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
          <h1 className="text-2xl sm:text-3xl font-serif italic text-text-main font-semibold">Goals</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1 sm:mt-2">Milestones, physical measurements, and target dates</p>
        </div>
      </header>

      {/* 3-Tile Hub Layout: Two on top, third centered underneath (like Habit Tracker) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        {/* Tile 1: End of Season Goals */}
        <Link to="/goals/end-of-year" className="block group">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 hover-lift tap-press transition-all h-full flex flex-col items-center justify-center text-center gap-5 sm:gap-6 shadow-sm hover:border-border-strong">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-yellow-bg rounded-full text-accent-yellow flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
              <Target size={28} className="sm:hidden" strokeWidth={1.5} />
              <Target size={32} className="hidden sm:block" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-text-main mb-2 sm:mb-3 font-medium">End of {getSettings().seasonName}</h2>
              <p className="text-text-muted text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Core milestones and qualitative targets for the season.
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-bg-base border border-border-strong text-text-muted">
                  {endOfYearCount} {endOfYearCount === 1 ? 'Goal' : 'Goals'}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Tile 2: Health & Fitness Goals */}
        <Link to="/goals/health" className="block group">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 hover-lift tap-press transition-all h-full flex flex-col items-center justify-center text-center gap-5 sm:gap-6 shadow-sm hover:border-border-strong">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-red-bg rounded-full text-accent-red flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
              <Heart size={28} className="sm:hidden" strokeWidth={1.5} />
              <Heart size={32} className="hidden sm:block" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-text-main mb-2 sm:mb-3 font-medium">Health & Fitness</h2>
              <p className="text-text-muted text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Weight tracking, body measurements, and athletic benchmarks.
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-bg-base border border-border-strong text-text-muted">
                  {healthCount} {healthCount === 1 ? 'Goal' : 'Goals'}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Tile 3: Lifetime Goals (Centered Underneath) */}
        <Link to="/goals/lifetime" className="block group md:col-span-2 max-w-md mx-auto w-full">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 hover-lift tap-press transition-all h-full flex flex-col items-center justify-center text-center gap-5 sm:gap-6 shadow-sm hover:border-border-strong">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-purple/15 rounded-full text-accent-purple flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
              <Compass size={28} className="sm:hidden" strokeWidth={1.5} />
              <Compass size={32} className="hidden sm:block" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-text-main mb-2 sm:mb-3 font-medium">Lifetime Goals</h2>
              <p className="text-text-muted text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                The ultimate North Star goals and lifelong aspirations you dedicate your life to achieving.
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-bg-base border border-border-strong text-text-muted">
                  {lifetimeCount} {lifetimeCount === 1 ? 'Goal' : 'Goals'}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
