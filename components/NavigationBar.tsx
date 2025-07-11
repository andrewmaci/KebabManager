import React from 'react';
import { NavLink } from 'react-router-dom';
import { KebabIcon } from './icons/KebabIcon';
import { ChartIcon } from './icons/ChartIcon';

const AdminToggle: React.FC<{ isAdmin: boolean; onToggle: () => void }> = ({ isAdmin, onToggle }) => (
    <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tryb Admina</span>
        <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                isAdmin ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            role="switch"
            aria-checked={isAdmin}
        >
            <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAdmin ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    </div>
);


interface NavigationBarProps {
    isAdmin: boolean;
    onToggleAdmin: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ isAdmin, onToggleAdmin }) => {
  const linkStyles = "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors";
  const activeLinkStyles = "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100";
  const inactiveLinkStyles = "text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50";

  return (
    <header className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-md sticky top-0 z-40">
      <nav className="container mx-auto px-4 flex justify-between items-center h-14">
        <div />
        <ul className="flex items-center justify-center gap-2">
          <li>
            <NavLink 
              to="/"
              className={({ isActive }) => `${linkStyles} ${isActive ? activeLinkStyles : inactiveLinkStyles}`}
            >
              <KebabIcon className="h-5 w-5" />
              <span>Zamówienia</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/statistics"
              className={({ isActive }) => `${linkStyles} ${isActive ? activeLinkStyles : inactiveLinkStyles}`}
            >
              <ChartIcon className="h-5 w-5" />
              <span>Statystyki</span>
            </NavLink>
          </li>
        </ul>
        <AdminToggle isAdmin={isAdmin} onToggle={onToggleAdmin} />
      </nav>
    </header>
  );
};
