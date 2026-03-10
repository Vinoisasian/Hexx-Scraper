import { NavLink } from "react-router-dom";
import { LayoutDashboard, Settings, CalendarClock, Moon, Sun } from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-[240px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-slate-bg)] flex flex-col h-full">
      <div className="h-14 flex items-center px-4 border-b border-[var(--color-border)]">
        <span className="font-semibold text-sm tracking-wide">Hexx Scraper</span>
      </div>
      
      <nav className="flex-1 py-4 px-2 space-y-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => cn(
            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
            isActive 
              ? "bg-[var(--color-slate-surface)] text-[var(--color-slate-text)]" 
              : "text-gray-400 hover:text-[var(--color-slate-text)] hover:bg-[var(--color-slate-surface)]"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </NavLink>
        <NavLink
          to="/scheduler"
          className={({ isActive }) => cn(
            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
            isActive 
              ? "bg-[var(--color-slate-surface)] text-[var(--color-slate-text)]" 
              : "text-gray-400 hover:text-[var(--color-slate-text)] hover:bg-[var(--color-slate-surface)]"
          )}
        >
          <CalendarClock className="w-4 h-4" />
          Scheduler
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
            isActive 
              ? "bg-[var(--color-slate-surface)] text-[var(--color-slate-text)]" 
              : "text-gray-400 hover:text-[var(--color-slate-text)] hover:bg-[var(--color-slate-surface)]"
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
      </nav>
      
      <div className="p-4 border-t border-[var(--color-border)] flex flex-col gap-4">
        <button 
          onClick={toggleTheme}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-[var(--color-slate-text)] transition-colors text-left"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <div className="text-xs text-gray-500">
          v0.1.0 local
        </div>
      </div>
    </aside>
  );
}