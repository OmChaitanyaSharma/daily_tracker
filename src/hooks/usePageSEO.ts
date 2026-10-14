import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://daily-tracker-iota-one.vercel.app';

interface RouteSEO {
  title: string;
  description: string;
}

const SEO_MAP: Record<string, RouteSEO> = {
  '/': {
    title: 'Daily Tracker | Offline-First Personal Growth OS',
    description: 'Offline-first personal growth OS with habit matrix tracking, workout logging, deep work graphs, and gamified RPG progression on your device.',
  },
  '/highlight': {
    title: 'Daily Highlight & Journal | Daily Tracker OS',
    description: 'Capture daily wins, reflect on mood, and record meaningful personal memories with offline client-side daily journal entries and digests.',
  },
  '/habits': {
    title: 'Habits & Exercise Tracking | Daily Tracker OS',
    description: 'Maintain daily consistency with a monthly habit completion matrix, workout rep counts, and categorized deep work focus session charts.',
  },
  '/habits/productivity': {
    title: 'Productivity Habits Matrix | Daily Tracker OS',
    description: 'Track monthly habits with a bottom-to-top matrix, customizable priorities, streak protection tokens, and disciplinary scoring.',
  },
  '/habits/health': {
    title: 'Exercise & Workout Tracker | Daily Tracker OS',
    description: 'Count exercise reps, log cardio minutes, detect real-time personal records, and scale fitness XP across custom difficulty tiers.',
  },
  '/habits/study': {
    title: 'Study & Deep Work Tracking | Daily Tracker OS',
    description: 'Log focused study and deep work hours across custom subjects with monthly interactive trend charts and developer level progression.',
  },
  '/goals': {
    title: 'Long-Term Goals & Milestones | Daily Tracker OS',
    description: 'Set season targets, monitor body measurements, and track chronological progress toward personal objectives with 15-day check-in logs.',
  },
  '/goals/end-of-year': {
    title: 'End of Season Goals | Daily Tracker OS',
    description: 'Track qualitative milestones, numeric targets, and season objectives with chronological progress logs and priority ordering.',
  },
  '/goals/health': {
    title: 'Health & Fitness Goals | Daily Tracker OS',
    description: 'Track physical body measurements, weight goals, and athletic benchmarks with chronological milestone logs and progress bars.',
  },
  '/logs': {
    title: 'History & Activity Heatmap | Daily Tracker OS',
    description: 'Review your journal history, analyze 365-day activity heatmaps, inspect calendar stats, and export full JSON database backups.',
  },
  '/settings': {
    title: 'System Settings & Backups | Daily Tracker OS',
    description: 'Configure season rules, streak thresholds, sound feedback, RPG rank titles, cloud synchronization, and verified JSON backups.',
  },
};

export function usePageSEO() {
  const location = useLocation();

  useEffect(() => {
    const seo = SEO_MAP[location.pathname] || SEO_MAP['/'];
    document.title = seo.title;

    // Update meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', seo.description);

    // Update OpenGraph title & description
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', seo.title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', seo.description);

    // Update Twitter title & description
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', seo.title);
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', seo.description);

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const path = location.pathname === '/' ? '' : location.pathname;
    canonical.setAttribute('href', `${BASE_URL}${path}`);
  }, [location.pathname]);
}
