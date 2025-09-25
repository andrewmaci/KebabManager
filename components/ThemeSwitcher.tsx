import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

interface ThemeSwitcherProps {
  theme: string;
  toggleTheme: () => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, toggleTheme }) => {
  const isDark = theme === 'dark';

  return (
    <label 
      htmlFor="theme-toggle" 
      className="relative inline-flex items-center cursor-pointer"
    >
      <input 
        type="checkbox" 
        id="theme-toggle" 
        className="sr-only peer" 
        checked={isDark} 
        onChange={toggleTheme} 
      />
      <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600"></div>
      <span className="ml-3 text-sm font-medium text-slate-900 dark:text-slate-300">
        {isDark ? <FaMoon className="h-4 w-4 text-slate-400" /> : <FaSun className="h-4 w-4 text-amber-500" />}
      </span>
    </label>
  );
};
