import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchoolYear } from '../context/SchoolYearContext';
import { menuGroups } from '../utils/menuStructure';
import { LogOut, Menu, X, ChevronRight, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import SetupProgressWidget from './SetupProgressWidget';
import { useUI } from '../context/UIContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout, hasPermission } = useAuth();
  const { selectedYear } = useSchoolYear();
  const { settings } = useUI();
  const sidebarScale = settings.sidebarScale;
  const globalScale = settings.globalDensity;
  const textScale = settings.textScale;
  const location = useLocation();

  const filteredGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => !item.permission || hasPermission(item.permission))
  })).filter(group => group.items.length > 0);

  return (
    <div className="flex h-screen bg-[#F5F7FB] text-primary font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full -mr-64 -mt-64 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none"></div>

      {/* Global Floating Widget */}
      <SetupProgressWidget />

      {/* Sidebar with Colors */}
      <aside
        className="bg-white border-r border-gray-100 transition-all duration-500 ease-in-out z-20 shadow-[20px_0_50px_rgba(0,0,0,0.02)]"
        style={{
            width: isSidebarOpen ? `${20 * sidebarScale}rem` : `${6 * sidebarScale}rem`
        }}
      >
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div
            className="flex items-center justify-between"
            style={{ padding: `${2.5 * sidebarScale}rem` }}
          >
            {isSidebarOpen ? (
              <div className="flex items-center space-x-4">
                <div
                    className="bg-black flex items-center justify-center text-white font-black rounded-[14px] shadow-2xl rotate-3"
                    style={{ width: `${3 * sidebarScale}rem`, height: `${3 * sidebarScale}rem`, fontSize: `${1.5 * sidebarScale}rem` }}
                >
                    S
                </div>
                <div className="flex flex-col">
                    <span
                        className="font-black tracking-tighter leading-none"
                        style={{ fontSize: `${1.5 * sidebarScale}rem` }}
                    >
                        SCHOLAR
                    </span>
                    <span
                        className="font-black uppercase tracking-[0.3em] text-accent mt-1"
                        style={{ fontSize: `${9 * textScale}px` }}
                    >
                        Management Pro
                    </span>
                </div>
              </div>
            ) : (
                <div
                    className="bg-black flex items-center justify-center text-white font-black rounded-[14px] mx-auto shadow-xl"
                    style={{ width: `${3 * sidebarScale}rem`, height: `${3 * sidebarScale}rem`, fontSize: `${1.5 * sidebarScale}rem` }}
                >
                    S
                </div>
            )}
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90">
              {isSidebarOpen ? <X size={20 * sidebarScale} /> : <Menu size={24 * sidebarScale} className="mx-auto" />}
            </button>
          </div>

          {/* Navigation */}
          <nav
            className="flex-1 overflow-y-auto px-6 scrollbar-hide"
            style={{
                paddingTop: `${2 * sidebarScale}rem`,
                paddingBottom: `${2 * sidebarScale}rem`,
                gap: `${2.5 * sidebarScale}rem`
            }}
          >
            {filteredGroups.map((group, idx) => (
              <div key={idx} style={{ marginBottom: `${2.5 * sidebarScale}rem` }}>
                {isSidebarOpen && (
                  <div className="flex items-center space-x-3 px-4 mb-6">
                      <div className="h-2 w-2 rounded-full bg-accent/20"></div>
                      <h3
                        className="font-black text-[#9E9E9E] uppercase tracking-[0.4em]"
                        style={{ fontSize: `${10 * textScale}px` }}
                      >
                        {group.group}
                      </h3>
                  </div>
                )}
                <ul className="space-y-2">
                  {group.items.map((item, itemIdx) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <li key={itemIdx}>
                        <Link
                          to={item.path}
                          className={cn(
                            "flex items-center rounded-[18px] transition-all group relative",
                            isActive
                              ? "bg-black text-white shadow-2xl shadow-gray-400 translate-x-1"
                              : "hover:bg-gray-50 text-[#9E9E9E] hover:text-black"
                          )}
                          style={{ padding: `${1 * sidebarScale}rem` }}
                        >
                          {isActive && (
                            <div className="absolute left-[-24px] w-2 h-8 bg-accent rounded-r-full shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
                          )}

                          <item.icon size={22 * sidebarScale} className={cn(isSidebarOpen ? "mr-4" : "mx-auto", isActive && "text-accent")} />
                          {isSidebarOpen && (
                            <span
                                className="flex-1 font-black uppercase tracking-tight"
                                style={{ fontSize: `${12 * textScale}px` }}
                            >
                                {item.title}
                            </span>
                          )}
                          {isSidebarOpen && isActive && <ChevronRight size={16 * sidebarScale} className="text-accent" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* User Section with Colors */}
          <div className="p-8 border-t border-gray-50 bg-gray-50/50">
            {isSidebarOpen && (
              <div className="mb-8 px-2 bg-white p-4 rounded-[22px] border border-gray-100 shadow-sm">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-black text-sm">
                        {user?.nom.charAt(0)}
                    </div>
                    <div className="flex-1 truncate">
                        <div className="flex items-center space-x-2">
                           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                           <p className="font-black text-xs uppercase tracking-tight truncate text-black">{user?.nom}</p>
                        </div>
                        <p className="text-[9px] font-black text-[#9E9E9E] uppercase tracking-widest mt-1">{user?.role}</p>
                    </div>
                </div>
              </div>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center p-4 text-red-600 hover:bg-red-50 rounded-[18px] transition-all group border border-transparent hover:border-red-100"
            >
              <LogOut size={22} className={cn(isSidebarOpen ? "mr-4" : "mx-auto", "group-hover:-translate-x-1 transition-transform")} />
              {isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-[0.2em]">Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header
            className="bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-12 z-10 shadow-sm"
            style={{ height: `${6 * sidebarScale}rem` }}
        >
          <div className="flex items-center space-x-4">
              <div className="w-1.5 h-8 bg-black rounded-full"></div>
              <h1
                className="font-black uppercase tracking-tighter text-black"
                style={{ fontSize: `${1.5 * textScale}rem` }}
              >
                {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Tableau de Bord'}
              </h1>
          </div>

          <div className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-4 bg-gray-50 px-6 py-3 rounded-full border border-gray-100">
                <Zap size={16} className="text-yellow-500" />
                <span
                    className="font-black uppercase tracking-widest text-[#9E9E9E]"
                    style={{ fontSize: `${10 * textScale}px` }}
                >
                    Session Active
                </span>
                <span
                    className="font-black uppercase tracking-widest text-black"
                    style={{ fontSize: `${10 * textScale}px` }}
                >
                    {selectedYear?.libelleAnneeScolaire}
                </span>
            </div>

            <div
                className="bg-white border-4 border-gray-50 flex items-center justify-center font-black text-black rounded-[20px] shadow-2xl cursor-pointer hover:border-accent hover:rotate-6 transition-all group overflow-hidden"
                style={{ width: `${3.5 * globalScale}rem`, height: `${3.5 * globalScale}rem` }}
            >
              <div className="w-full h-full flex items-center justify-center bg-gray-50 group-hover:bg-accent group-hover:text-white transition-colors">
                {user?.nom.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div
            className="flex-1 overflow-y-auto custom-scrollbar"
            style={{ padding: `${2.5 * globalScale}rem` }}
        >
           <div className="w-full">
              <Outlet />
           </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
