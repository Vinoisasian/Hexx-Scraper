import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Layout() {
  const location = useLocation();
  const currentPath = location.pathname.substring(1) || "dashboard";
  
  const pageTitle = currentPath.charAt(0).toUpperCase() + currentPath.slice(1);

  return (
    <div className="flex h-screen w-full bg-[var(--color-slate-bg)] text-[var(--color-slate-text)] overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-14 border-b border-[var(--color-border)] flex items-center px-6 shrink-0 bg-[var(--color-slate-bg)]">
          <h1 className="text-sm font-medium text-[var(--color-slate-text)]">
            {pageTitle}
          </h1>
        </header>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}