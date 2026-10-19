import * as React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import {
  LayoutDashboard,
  ReceiptText,
  Package,
  ShieldCheck,
  Store,
  Bell,
  Settings,
  User,
  LogOut,
  Sun,
  Moon,
  Command,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  X,
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { usePreferences } from '../../context/PreferencesContext';
import useAuth from '../../hooks/useAuth';
import { useRemindersQuery } from '../../queries/useRemindersQuery';
import { useReceiptsQuery } from '../../queries/useReceiptsQuery';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';
import { prefetchRoute } from '../../lib/routePreloader';
import { spring } from '../../lib/motion';

/**
 * Premium Sidebar with glassmorphism, gradient active indicators,
 * smooth animations, and mobile zero-scroll pop-up modal.
 *
 * Desktop: 248px expanded / 68px collapsed rail with spring animation
 * Mobile: Zero-scroll floating pop-up card with glassmorphism backdrop
 */

// ─── Mobile Pop-up Navigation Modal (Zero Scroll, Pure Pop-Up Type) ───
function MobileSidebarPopup({ open, onClose }) {
  const { user, logoutUser } = useAuth();
  const { theme, setTheme } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: remindersData } = useRemindersQuery();
  const expiringCount = React.useMemo(() => {
    const items = remindersData?.items || [];
    return items.filter((i) => i.daysRemaining > 0 && i.daysRemaining <= 30).length;
  }, [remindersData]);

  const { data: receiptsData } = useReceiptsQuery({ limit: 1 });
  const receiptsCount = receiptsData?.total ?? 0;

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  const navLinks = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/receipts', label: 'Receipts', icon: ReceiptText, count: receiptsCount },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/warranties', label: 'Warranties', icon: ShieldCheck, hasDot: expiringCount > 0, dotCount: expiringCount },
    { to: '/stores', label: 'Merchants', icon: Store },
    { to: '/reminders', label: 'Reminders', icon: Bell },
  ];

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';
  const userName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const userEmail = user?.email || '';

  // Close on Escape key
  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 select-none font-sans">
          {/* Backdrop overlay with blur */}
          <m.div
            key="popup-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Floating Pop-up Card - ZERO SCROLL, Pure Pop-Up Type */}
          <m.div
            key="popup-card"
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }}
            className="relative z-10 w-full max-w-[360px] rounded-2xl bg-surface/98 border border-line/80 shadow-2xl overflow-hidden p-4 sm:p-5 flex flex-col gap-3.5 backdrop-blur-xl ring-1 ring-white/10"
          >
            {/* Header: Brand Logo + Close Button */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Logo size="md" showWordmark={true} />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-full bg-hover/80 hover:bg-hover border border-line flex items-center justify-center text-fg-3 hover:text-fg transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Navigation Grid (2-column compact cards - ZERO SCROLL) */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => handleNavigate(item.to)}
                    className={cn(
                      'relative flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer group',
                      isActive
                        ? 'bg-accent/10 border-accent/30 text-accent font-semibold shadow-xs'
                        : 'bg-subtle/50 hover:bg-hover border-line/40 text-fg hover:border-line'
                    )}
                  >
                    <div className={cn(
                      'size-7 rounded-lg flex items-center justify-center shrink-0 transition-all',
                      isActive ? 'bg-accent text-white shadow-xs' : 'bg-surface text-fg-3 group-hover:text-fg border border-line/50'
                    )}>
                      <Icon className="size-3.5" />
                    </div>
                    <span className="truncate flex-1">{item.label}</span>
                    {item.count != null && item.count > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-line/60 text-fg-2 font-semibold">
                        {item.count}
                      </span>
                    )}
                    {item.hasDot && (
                      <span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Appearance switcher row */}
            <div className="flex items-center justify-between pt-1 border-t border-line/60">
              <span className="text-xs font-medium text-fg-3">Appearance</span>
              <div className="flex items-center gap-1 bg-subtle border border-line rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                    theme === 'light' ? 'bg-accent text-white shadow-xs' : 'text-fg-3 hover:text-fg'
                  )}
                >
                  <Sun className="size-3" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('gentle')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                    theme === 'gentle' ? 'bg-accent text-white shadow-xs' : 'text-fg-3 hover:text-fg'
                  )}
                >
                  <Moon className="size-3" />
                  <span>Gentle</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                    theme === 'dark' ? 'bg-accent text-white shadow-xs' : 'text-fg-3 hover:text-fg'
                  )}
                >
                  <Moon className="size-3 fill-current" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* User Profile & Quick Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-line/60">
              <button
                type="button"
                onClick={() => handleNavigate('/profile')}
                className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={userName} className="size-8 rounded-full object-cover shrink-0 shadow-xs ring-1 ring-line" />
                ) : (
                  <div className="size-8 rounded-full bg-gradient-to-tr from-accent to-accent-hover text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                    {userInitial}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-fg truncate">{userName}</div>
                  <div className="text-[10px] text-fg-3 truncate">{userEmail}</div>
                </div>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleNavigate('/settings')}
                  className="size-8 rounded-lg text-fg-3 hover:text-fg hover:bg-hover border border-line/50 flex items-center justify-center transition-colors cursor-pointer"
                  title="Settings"
                >
                  <Settings className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    logoutUser();
                  }}
                  className="size-8 rounded-lg text-bad-fg hover:bg-bad-bg/30 border border-bad-line/30 flex items-center justify-center transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Sidebar Content (shared between desktop & mobile drawer) ──────
function SidebarContent({
  collapsed,
  toggleCollapse,
  isMobile = false,
  onMobileClose,
}) {
  const { theme, setTheme } = usePreferences();
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  // Fetch reminders to count expiring items for amber dot
  const { data: remindersData } = useRemindersQuery();
  const expiringCount = React.useMemo(() => {
    const items = remindersData?.items || [];
    return items.filter((i) => i.daysRemaining > 0 && i.daysRemaining <= 30).length;
  }, [remindersData]);

  // Fetch receipts total for badge counter
  const { data: receiptsData } = useReceiptsQuery({ limit: 1 });
  const receiptsCount = receiptsData?.total ?? 0;

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, routeKey: 'dashboard' },
    { to: '/receipts', label: 'Receipts', icon: ReceiptText, routeKey: 'receipts', count: receiptsCount },
    { to: '/products', label: 'Products', icon: Package, routeKey: 'products' },
    {
      to: '/warranties',
      label: 'Warranties',
      icon: ShieldCheck,
      hasDot: expiringCount > 0,
      dotCount: expiringCount,
      routeKey: 'warranties',
    },
    { to: '/stores', label: 'Merchants', icon: Store, routeKey: 'stores' },
    { to: '/reminders', label: 'Reminders', icon: Bell, routeKey: 'reminders' },
    { to: '/settings', label: 'Settings', icon: Settings, routeKey: 'settings' },
  ];


  const handleNavigate = (path) => {
    if (isMobile && onMobileClose) onMobileClose();
    navigate(path);
  };

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  const userName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const userEmail = user?.email || '';

  const showLabels = isMobile || !collapsed;

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-sidebar font-sans select-none overflow-hidden relative'
      )}
    >
      {/* ── Header ────────────────────────────────────── */}
      <div
        className={cn(
          'relative h-14 shrink-0 flex items-center border-b border-line/60 px-3.5',
          collapsed && !isMobile ? 'justify-center' : 'justify-between'
        )}
      >
        {collapsed && !isMobile ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleCollapse}
                className="relative group size-10 rounded-xl flex items-center justify-center hover:bg-hover transition-colors cursor-pointer"
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <div className="transition-all duration-200 group-hover:scale-90 group-hover:opacity-0 flex items-center justify-center">
                  <Logo size="md" showWordmark={false} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-fg">
                  <PanelLeftOpen className="w-5 h-5 text-accent" />
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Expand sidebar
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center justify-between w-full min-w-0">
            <Logo size="md" showWordmark={true} />
            {!isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleCollapse}
                    className="p-1.5 rounded-lg text-fg-3 hover:text-fg hover:bg-hover border border-transparent hover:border-line/70 transition-all cursor-pointer shrink-0"
                    aria-label="Collapse sidebar"
                    title="Collapse sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Collapse sidebar
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>

      {/* ── Navigation (Linear without grouping, clean, minimal, premium) ────── */}
      <nav aria-label="Primary" className="relative flex-1 overflow-y-auto no-scrollbar px-2.5 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const link = (
            <NavLink
              to={item.to}
              end={item.to === '/'}
              onClick={() => isMobile && onMobileClose?.()}
              onMouseEnter={() => item.routeKey && prefetchRoute(item.routeKey)}
              onTouchStart={() => item.routeKey && prefetchRoute(item.routeKey)}
              onFocus={() => item.routeKey && prefetchRoute(item.routeKey)}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center h-10 text-sm font-medium transition-colors duration-150 rounded-lg select-none',
                  collapsed && !isMobile ? 'justify-center px-0 w-full' : 'gap-3 px-3 w-full',
                  isActive
                    ? 'text-fg font-semibold'
                    : 'text-fg-2 hover:text-fg hover:bg-hover/60'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <m.div
                      layoutId="sidebar-active-item"
                      className="absolute inset-0 rounded-lg bg-surface border border-line/70 shadow-2xs"
                      transition={spring.snappy}
                    />
                  )}
                  <div className="relative flex items-center justify-center shrink-0 w-5 h-5">
                    <Icon
                      className={cn(
                        'w-[18px] h-[18px] shrink-0 transition-colors duration-150',
                        isActive
                          ? 'text-accent stroke-[2.2]'
                          : 'text-fg-3 group-hover:text-fg'
                      )}
                    />
                    {item.hasDot && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-warn-solid ring-2 ring-sidebar" />
                    )}
                  </div>
                  <AnimatePresence initial={false}>
                    {showLabels && (
                      <m.div
                        className="relative flex-1 flex items-center justify-between min-w-0 overflow-hidden"
                        initial={{ opacity: 0, width: 0, x: -6 }}
                        animate={{ opacity: 1, width: 'auto', x: 0 }}
                        exit={{ opacity: 0, width: 0, x: -6, transition: { duration: 0.12 } }}
                        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                      >
                        <span className="truncate text-sm">
                          {item.label}
                        </span>

                        {/* Live Count Pill */}
                        {item.count !== undefined && item.count > 0 && (
                          <span className="ml-auto text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-subtle text-fg-3 border border-line/50 tabular-nums">
                            {item.count}
                          </span>
                        )}

                        {/* Expiring items warning pill */}
                        {item.hasDot && item.dotCount > 0 && (
                          <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-warn-tint text-warn-solid border border-warn-line/70 flex items-center gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-warn-solid" />
                            {item.dotCount}
                          </span>
                        )}
                      </m.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          );

          return (
            <Tooltip key={item.to} disableHoverableContent={showLabels}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              {collapsed && !isMobile && (
                <TooltipContent side="right" className="font-sans flex items-center gap-1.5">
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] font-mono text-fg-3">({item.count})</span>
                  )}
                  {item.hasDot ? (
                    <span className="text-[10px] text-warn-solid font-medium">({item.dotCount} expiring)</span>
                  ) : ''}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {/* ── User Row with Dropdown ────────────────────── */}
      <div className="relative p-2.5 border-t border-line/60 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'group flex items-center w-full rounded-xl text-left border border-transparent hover:border-line/60 hover:bg-hover/60 transition-all outline-none cursor-pointer',
                collapsed && !isMobile
                  ? 'justify-center p-2'
                  : 'gap-2.5 p-2'
              )}
              aria-label="User account menu"
            >
              <div className="relative shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={userName} className="w-8 h-8 rounded-full object-cover shadow-2xs ring-1 ring-line" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent text-white text-xs font-semibold flex items-center justify-center shadow-2xs ring-1 ring-line">
                    {userInitial}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
              </div>
              <AnimatePresence initial={false}>
                {showLabels && (
                  <m.div
                    className="min-w-0 flex-1 flex items-center justify-between overflow-hidden"
                    initial={{ opacity: 0, width: 0, x: -6 }}
                    animate={{ opacity: 1, width: 'auto', x: 0 }}
                    exit={{ opacity: 0, width: 0, x: -6, transition: { duration: 0.12 } }}
                    transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-fg truncate leading-tight">
                          {userName}
                        </p>
                        <span className="text-[9px] font-mono font-semibold px-1 py-0.2 rounded bg-accent/10 text-accent border border-accent/20 leading-none">
                          PRO
                        </span>
                      </div>
                      <p className="text-[11px] text-fg-3 truncate leading-tight mt-0.5">
                        {userEmail}
                      </p>
                    </div>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-fg-3 group-hover:text-fg shrink-0 ml-1 transition-colors" />
                  </m.div>
                )}
              </AnimatePresence>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align={collapsed && !isMobile ? 'center' : 'start'}
            className="w-56 font-sans"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-xs font-semibold text-fg truncate">{userName}</p>
                <p className="text-[11px] text-fg-3 truncate">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onMouseEnter={() => prefetchRoute('profile')}
              onClick={() => handleNavigate('/profile')}
            >
              <User className="w-4 h-4 mr-2 text-fg-3" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseEnter={() => prefetchRoute('settings')}
              onClick={() => handleNavigate('/settings')}
            >
              <Settings className="w-4 h-4 mr-2 text-fg-3" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Theme Selectors */}
            <DropdownMenuLabel className="text-[10px] uppercase font-semibold text-fg-3 tracking-wider py-1">
              Theme
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="w-4 h-4 mr-2 text-fg-3" />
              <span>Light</span>
              {theme === 'light' && <Check className="w-3.5 h-3.5 ml-auto text-accent" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('gentle')}>
              <Moon className="w-4 h-4 mr-2 text-fg-3" />
              <span>Gentle</span>
              {theme === 'gentle' && <Check className="w-3.5 h-3.5 ml-auto text-accent" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="w-4 h-4 mr-2 text-fg-3 fill-current" />
              <span>Dark</span>
              {theme === 'dark' && <Check className="w-3.5 h-3.5 ml-auto text-accent" />}
            </DropdownMenuItem>


            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onClick={logoutUser}
              className="text-bad-fg focus:text-bad-fg"
            >
              <LogOut className="w-4 h-4 mr-2 text-bad-fg" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Main Sidebar Export ────────────────────────────────────────────
export function Sidebar() {
  const { sidebarCollapsed, toggleSidebarCollapse } = usePreferences();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Listen for toggle events (keyboard shortcut Ctrl+B, mobile menu button)
  React.useEffect(() => {
    const handleToggle = () => toggleSidebarCollapse();
    window.addEventListener('billbox:toggle-sidebar', handleToggle);
    return () => window.removeEventListener('billbox:toggle-sidebar', handleToggle);
  }, [toggleSidebarCollapse]);

  // Listen for mobile open events (from Navbar hamburger or BottomTabBar More)
  React.useEffect(() => {
    const handleMobileOpen = () => setMobileOpen(true);
    window.addEventListener('billbox:open-sidebar', handleMobileOpen);
    window.addEventListener('billbox:open-more-sheet', handleMobileOpen);
    return () => {
      window.removeEventListener('billbox:open-sidebar', handleMobileOpen);
      window.removeEventListener('billbox:open-more-sheet', handleMobileOpen);
    };
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <m.aside
        animate={{ width: sidebarCollapsed ? 68 : 248 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
        className={cn(
          'hidden md:flex flex-col shrink-0 sticky top-0 h-dvh border-r border-line/60 font-sans select-none overflow-hidden will-change-[width]',
          sidebarCollapsed ? 'w-[68px]' : 'w-[248px]'
        )}
      >
        <SidebarContent
          collapsed={sidebarCollapsed}
          toggleCollapse={toggleSidebarCollapse}
        />
      </m.aside>

      {/* Mobile Pop-Up Navigation Modal (Zero Scroll, Pop-Up Type) */}
      <MobileSidebarPopup
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
    </>
  );
}

export default Sidebar;
