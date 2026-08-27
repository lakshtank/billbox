import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, User, Settings } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useUiStore from '../../store/uiStore';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const { toggleSidebar } = useUiStore();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/register';

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200/80 shadow-2xs z-50">
      <div className="h-full flex items-center justify-between px-4 md:px-8">
        {/* Left: Brand Logo & Mobile Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {user && !isAuthPage && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <div className="w-8 h-8 rounded-lg bg-[#047857] flex items-center justify-center text-white shadow-xs group-hover:bg-[#059669] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">
              BillBox
            </span>
          </Link>
        </div>

        {/* Right: Notifications & User Profile */}
        {user && (
          <div className="flex items-center gap-3">
            <NotificationBell />

            {/* Profile Button with Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#047857] text-white font-bold text-xs flex items-center justify-center">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'L'}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                  {user.name || 'Laksh Tank'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 text-xs font-sans">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="font-extrabold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>

                  <div className="py-1 border-b border-slate-100">
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 cursor-pointer font-semibold no-underline"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 cursor-pointer font-semibold no-underline"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logoutUser();
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

