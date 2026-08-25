import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, CalendarDays, LineChart, Settings } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'History', path: '/history', icon: CalendarDays },
  { name: 'Analytics', path: '/analytics', icon: LineChart },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-64 h-screen border-r border-gray-200 bg-white flex flex-col hidden md:flex">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Progress<span className="text-red-600">.</span></h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm',
                  isActive 
                    ? 'bg-red-50 text-red-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <Icon size={18} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <NavLink 
          to="/entry/today" 
          className="flex items-center justify-center w-full py-2 bg-gray-900 text-white rounded-md hover:bg-black transition-colors font-medium text-sm"
        >
          Log Today
        </NavLink>
      </div>
    </aside>
  );
}
