import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Package,
  ShieldCheck,
  Store,
  Plus,
  User,
  Settings,
} from 'lucide-react';
import useUiStore from '../../store/uiStore';

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/receipts',
    label: 'Receipts',
    icon: Receipt,
  },
  {
    to: '/products',
    label: 'Products',
    icon: Package,
  },
  {
    to: '/warranties',
    label: 'Warranties',
    icon: ShieldCheck,
  },
  {
    to: '/stores',
    label: 'Stores',
    icon: Store,
  },
];

const bottomNavItems = [
  {
    to: '/profile',
    label: 'Profile',
    icon: User,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

const Sidebar = () => {
  const { sidebarOpen, closeSidebar } = useUiStore();
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-60
          bg-white border-r border-slate-200/80
          transition-transform duration-200 ease-in-out
          md:static md:h-full md:translate-x-0 shrink-0 flex flex-col justify-between p-4 overflow-y-auto font-sans
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="space-y-6">
          {/* Primary Add Receipt Button */}
          <div>
            <button
              type="button"
              onClick={() => {
                closeSidebar();
                navigate('/receipts/new');
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#047857] hover:bg-[#059669] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Receipt</span>
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold no-underline transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Navigation: Profile & Settings */}
        <div className="pt-4 border-t border-slate-200/80 space-y-1 mt-auto">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold no-underline transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

