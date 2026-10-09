import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
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
          bg-brand-sidebar border-r border-brand-border
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
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
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
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs no-underline select-none group"
                >
                  {({ isActive }) => (
                    <>
                      {/* Animated Dark Glass Bubble */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-bubble"
                          className="absolute inset-0 rounded-xl glass-bubble-dark z-0"
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 28,
                            mass: 0.8,
                          }}
                        />
                      )}

                      {/* Foreground Content */}
                      <Icon
                        className={`relative z-10 w-4 h-4 transition-colors duration-150 ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-500 group-hover:text-brand-navy'
                        }`}
                      />
                      <span
                        className={`relative z-10 transition-colors duration-150 ${
                          isActive
                            ? 'text-white font-medium'
                            : 'text-slate-600 font-normal group-hover:text-brand-navy group-hover:font-medium'
                        }`}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Navigation: Profile & Settings */}
        <div className="pt-4 border-t border-brand-border space-y-1 mt-auto">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs no-underline select-none group"
              >
                {({ isActive }) => (
                  <>
                    {/* Animated Dark Glass Bubble */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-bubble"
                        className="absolute inset-0 rounded-xl glass-bubble-dark z-0"
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 28,
                          mass: 0.8,
                        }}
                      />
                    )}

                    {/* Foreground Content */}
                    <Icon
                      className={`relative z-10 w-4 h-4 transition-colors duration-150 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-500 group-hover:text-brand-navy'
                      }`}
                    />
                    <span
                      className={`relative z-10 transition-colors duration-150 ${
                        isActive
                          ? 'text-white font-medium'
                          : 'text-slate-600 font-normal group-hover:text-brand-navy group-hover:font-medium'
                      }`}
                    >
                      {item.label}
                    </span>
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

