import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchoolYear } from '../context/SchoolYearContext';
import { menuGroups } from '../utils/menuStructure';
import { LogOut, Menu, X, ChevronRight, Zap, MessageCircle, Youtube, Twitter, Facebook, Mail, Info, Globe } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import SetupProgressWidget from './SetupProgressWidget';
import WelcomeGuide from './dashboard/WelcomeGuide';
import { useUI } from '../context/UIContext';
import { useTranslation } from 'react-i18next';
import { contactInfo } from '../utils/contactInfo';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MainLayout: React.FC = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);
  const { user, logout, hasPermission } = useAuth();
  const { selectedYear } = useSchoolYear();
  const { settings } = useUI();
  const sidebarScale = settings.sidebarScale;
  const globalScale = settings.globalDensity;
  const textScale = settings.textScale;
  const location = useLocation();

  React.useEffect(() => {
    if (location.state?.highlight) {
        setHighlightedPath(location.state.highlight);
        const timer = setTimeout(() => {
            setHighlightedPath(null);
            // Clear location state to prevent re-highlighting on manual reload
            window.history.replaceState({}, document.title);
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [location]);

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
      <WelcomeGuide />

      {/* Sidebar with Colors */}
      <aside
        id="sidebar"
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
                        {t(group.translationKey as any) || group.group}
                      </h3>
                  </div>
                )}
                <ul className="space-y-2">
                  {group.items.map((item, itemIdx) => {
                    const isActive = location.pathname.startsWith(item.path);
                    const isHighlighted = highlightedPath === item.path;
                    return (
                      <li key={itemIdx}>
                        <Link
                          to={item.path}
                          className={cn(
                            "flex items-center rounded-[18px] transition-all group relative",
                            isActive
                              ? "bg-black text-white shadow-2xl shadow-gray-400 translate-x-1"
                              : "hover:bg-gray-50 text-[#9E9E9E] hover:text-black",
                            isHighlighted && "ring-4 ring-accent shadow-[0_0_20px_rgba(124,58,237,0.4)] scale-105 z-10"
                          )}
                          style={{ padding: `${1 * sidebarScale}rem` }}
                        >
                          {isActive && (
                            <div className="absolute left-[-24px] w-2 h-8 bg-accent rounded-r-full shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
                          )}

                          {isHighlighted && !isActive && (
                              <div className="absolute inset-0 bg-accent/10 rounded-[18px] animate-pulse" />
                          )}

                          <item.icon size={22 * sidebarScale} className={cn(isSidebarOpen ? "mr-4" : "mx-auto", (isActive || isHighlighted) && "text-accent")} />
                          {isSidebarOpen && (
                            <span
                                className="flex-1 font-black uppercase tracking-tight"
                                style={{ fontSize: `${12 * textScale}px` }}
                            >
                                {t(item.translationKey as any) || item.title}
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
              {isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-[0.2em]">{t('sidebar.logout')}</span>}
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
                {location.pathname.split('/').pop()?.replace(/-/g, ' ') || t('dashboard.title')}
              </h1>
          </div>

          <div className="flex items-center space-x-8">
            {/* Contact Support Header */}
            <button
                onClick={() => setShowContactModal(true)}
                className="hidden lg:flex items-center space-x-3 hover:bg-gray-50 px-4 py-2 rounded-full transition-all"
            >
                <MessageCircle size={16} className="text-accent" />
                <span className="text-[10px] font-black text-black uppercase tracking-widest">{t('contact.button')}</span>
            </button>

            <div className="hidden md:flex items-center space-x-4 bg-gray-50 px-6 py-3 rounded-full border border-gray-100">
                <Zap size={16} className="text-yellow-500" />
                <span
                    className="font-black uppercase tracking-widest text-[#9E9E9E]"
                    style={{ fontSize: `${10 * textScale}px` }}
                >
                    {t('setup.year.active_title')}
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

      {/* WhatsApp Floating Button */}
      <a
        href={`https://wa.me/${contactInfo.whatsapp.replace(/\s+/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-10 right-10 z-[100] flex items-center space-x-4 bg-[#25D366] text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-all group active:scale-95"
      >
        <MessageCircle size={24} fill="currentColor" />
        <span className="font-black uppercase tracking-widest text-[10px]">
          {t('common.contact_whatsapp')}
        </span>
      </a>

      {/* Contact Modal */}
      {showContactModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[150] p-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-[56px] p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden border border-gray-100">
                  <div className="absolute top-0 left-0 w-full h-2 bg-accent"></div>

                  <button
                    onClick={() => setShowContactModal(false)}
                    className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-all"
                  ><X size={24}/></button>

                  <div className="mb-10">
                      <div className="flex items-center space-x-3 text-accent mb-2">
                          <Info size={20} />
                          <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('contact.title')}</span>
                      </div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter text-black">Scholar Management Pro</h3>
                  </div>

                  <div className="space-y-8">
                      {/* About Block */}
                      <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                              <Info size={14} /> {t('contact.about_title')}
                          </h4>
                          <p className="text-xs font-medium leading-relaxed text-gray-600">
                              {contactInfo.about}
                          </p>
                      </div>

                      {/* Social & Contact Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ContactLink
                            icon={Youtube}
                            label={t('contact.youtube_label')}
                            value="YouTube Channel"
                            href={contactInfo.youtube}
                            color="text-red-600"
                          />
                          <ContactLink
                            icon={Mail}
                            label={t('contact.email_label')}
                            value={contactInfo.email}
                            href={`mailto:${contactInfo.email}`}
                            color="text-blue-600"
                          />
                          <ContactLink
                            icon={MessageCircle}
                            label={t('contact.whatsapp_label')}
                            value={contactInfo.whatsapp}
                            href={`https://wa.me/${contactInfo.whatsapp.replace(/\s+/g, '')}`}
                            color="text-green-600"
                          />
                          <ContactLink
                            icon={Twitter}
                            label={t('contact.twitter_label')}
                            value="@scholar_pro"
                            href={contactInfo.twitter}
                            color="text-black"
                          />
                          <ContactLink
                            icon={Facebook}
                            label={t('contact.facebook_label')}
                            value="Scholar Management"
                            href={contactInfo.facebook}
                            color="text-blue-700"
                          />
                          <ContactLink
                            icon={Globe}
                            label={t('contact.bluesky_label')}
                            value="scholar.bsky.social"
                            href={contactInfo.bluesky}
                            color="text-sky-500"
                          />
                      </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-gray-50 flex justify-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">
                          © {new Date().getFullYear()} Scholar Pro • Version 3.1.0
                      </p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const ContactLink: React.FC<{ icon: any, label: string, value: string, href: string, color: string }> = ({ icon: Icon, label, value, href, color }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-4 p-4 rounded-2xl border border-gray-50 hover:border-black hover:bg-gray-50 transition-all group"
    >
        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm group-hover:scale-110 transition-transform", color)}>
            <Icon size={20} />
        </div>
        <div className="flex-1 truncate">
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">{label}</p>
            <p className="text-[10px] font-black text-black truncate">{value}</p>
        </div>
        <ChevronRight size={14} className="text-gray-200 group-hover:text-black transition-colors" />
    </a>
);

export default MainLayout;
