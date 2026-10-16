import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { usePreferences } from '../../context/PreferencesContext';
import useAuth from '../../hooks/useAuth';
import { useRemindersQuery } from '../../queries/useRemindersQuery';
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
 * Step 10.2: Sidebar component with Step 4.1 Motion Shell enhancements
 * - 240px (w-60) wide, collapses to 64px (w-16) rail
 * - Animated with Motion layout so labels glide and don't squash:
 *   <m.aside animate={{ width: sidebarCollapsed ? 64 : 240 }} transition={spring.soft}>
 * - Active highlight uses shared layoutId="nav-active" to glide between items
 * - Labels unmount smoothly using AnimatePresence with 80ms exit
 * - Background bg-sidebar, 1px right border line
 * - Top: 56px (h-14) mark + wordmark & collapse button
 * - Nav items: Overview, Receipts, Products, Warranties (amber dot when expiring), Merchants, Reminders
 * - Settings divider + Settings nav link
 * - Bottom: user row with dropdown menu
 */
export function Sidebar() {
  const { sidebarCollapsed, toggleSidebarCollapse, theme, setTheme } = usePreferences();
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  // Fetch reminders to count expiring items for amber dot
  const { data: remindersData } = useRemindersQuery();
  const expiringCount = React.useMemo(() => {
    const items = remindersData?.items || [];
    return items.filter((i) => i.daysRemaining > 0 && i.daysRemaining <= 30).length;
  }, [remindersData]);

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, routeKey: 'dashboard' },
    { to: '/receipts', label: 'Receipts', icon: ReceiptText, routeKey: 'receipts' },
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
  ];

  const handleOpenShortcuts = () => {
    window.dispatchEvent(new CustomEvent('billbox:open-shortcuts'));
  };

  React.useEffect(() => {
    const handleToggle = () => toggleSidebarCollapse();
    window.addEventListener('billbox:toggle-sidebar', handleToggle);
    return () => window.removeEventListener('billbox:toggle-sidebar', handleToggle);
  }, [toggleSidebarCollapse]);

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  const userName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const userEmail = user?.email || '';

  return (
    <m.aside
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
      className={cn(
        'hidden md:flex flex-col shrink-0 sticky top-0 h-dvh bg-sidebar border-r border-line font-sans select-none overflow-hidden will-change-[width]',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* 10.2 Top Block: 56px (h-14) mark + wordmark & collapse button */}
      <div
        className={cn(
          'h-14 shrink-0 flex items-center border-b border-line px-3',
          sidebarCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="relative group size-9 rounded-lg flex items-center justify-center hover:bg-hover transition-colors cursor-pointer"
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <div className="transition-all duration-200 group-hover:scale-90 group-hover:opacity-0">
                  <Logo size="md" showWordmark={false} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-fg">
                  <PanelLeftOpen className="w-4 h-4 text-accent" />
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Expand sidebar <kbd className="ml-1 text-[10px] font-mono opacity-70">⌘B</kbd>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center justify-between w-full min-w-0">
            <Logo size="md" showWordmark={true} />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleSidebarCollapse}
                  className="p-1.5 rounded-[6px] text-fg-3 hover:text-fg hover:bg-hover transition-colors cursor-pointer shrink-0"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Collapse sidebar <kbd className="ml-1 text-[10px] font-mono opacity-70">⌘B</kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* 10.2 & 4.1 Navigation Items with gliding layoutId="nav-active" */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const link = (
            <NavLink
              to={item.to}
              end={item.to === '/'}
              onMouseEnter={() => item.routeKey && prefetchRoute(item.routeKey)}
              onTouchStart={() => item.routeKey && prefetchRoute(item.routeKey)}
              onFocus={() => item.routeKey && prefetchRoute(item.routeKey)}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center h-10 rounded-[8px] text-sm font-medium transition-colors',
                  sidebarCollapsed ? 'justify-center px-0 w-full' : 'gap-3 px-3 w-full',
                  isActive ? 'text-accent font-semibold' : 'text-fg-2 hover:text-fg hover:bg-hover'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <m.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-[8px] bg-selected border border-accent/30 shadow-xs"
                      transition={spring.snappy}
                    />
                  )}
                  <div className="relative flex items-center justify-center shrink-0 w-5 h-5">
                    <Icon
                      className={cn(
                        'w-[18px] h-[18px] shrink-0 transition-colors',
                        isActive ? 'text-accent stroke-[2.25]' : 'text-fg-3 group-hover:text-fg'
                      )}
                    />
                    {item.hasDot && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-warn-solid ring-2 ring-sidebar" />
                    )}
                  </div>
                  <AnimatePresence initial={false}>
                    {!sidebarCollapsed && (
                      <m.span
                        className="relative text-sm font-medium whitespace-nowrap truncate overflow-hidden"
                        initial={{ opacity: 0, width: 0, x: -6 }}
                        animate={{ opacity: 1, width: 'auto', x: 0 }}
                        exit={{ opacity: 0, width: 0, x: -6, transition: { duration: 0.12 } }}
                        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                      >
                        {item.label}
                      </m.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          );

          return (
            <Tooltip key={item.to} disableHoverableContent={!sidebarCollapsed}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              {sidebarCollapsed && (
                <TooltipContent side="right">
                  {item.label}
                  {item.hasDot ? ` (${item.dotCount} expiring)` : ''}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}

        {/* Divider before Settings */}
        <div className="pt-2 pb-1">
          <hr className="border-t border-line" />
        </div>

        {/* Settings Nav Item */}
        {(() => {
          const settingsLink = (
            <NavLink
              to="/settings"
              onMouseEnter={() => prefetchRoute('settings')}
              onTouchStart={() => prefetchRoute('settings')}
              onFocus={() => prefetchRoute('settings')}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center h-10 rounded-[8px] text-sm font-medium transition-colors',
                  sidebarCollapsed ? 'justify-center px-0 w-full' : 'gap-3 px-3 w-full',
                  isActive ? 'text-accent font-semibold' : 'text-fg-2 hover:text-fg hover:bg-hover'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <m.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-[8px] bg-selected border border-accent/30 shadow-xs"
                      transition={spring.snappy}
                    />
                  )}
                  <div className="relative flex items-center justify-center shrink-0 w-5 h-5">
                    <Settings
                      className={cn(
                        'w-[18px] h-[18px] shrink-0 transition-colors',
                        isActive ? 'text-accent stroke-[2.25]' : 'text-fg-3 group-hover:text-fg'
                      )}
                    />
                  </div>
                  <AnimatePresence initial={false}>
                    {!sidebarCollapsed && (
                      <m.span
                        className="relative text-sm font-medium whitespace-nowrap truncate overflow-hidden"
                        initial={{ opacity: 0, width: 0, x: -6 }}
                        animate={{ opacity: 1, width: 'auto', x: 0 }}
                        exit={{ opacity: 0, width: 0, x: -6, transition: { duration: 0.12 } }}
                        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                      >
                        Settings
                      </m.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          );

          return (
            <Tooltip key="/settings" disableHoverableContent={!sidebarCollapsed}>
              <TooltipTrigger asChild>{settingsLink}</TooltipTrigger>
              {sidebarCollapsed && (
                <TooltipContent side="right">Settings</TooltipContent>
              )}
            </Tooltip>
          );
        })()}
      </nav>

      {/* 10.2 Bottom User Row with Dropdown Menu */}
      <div className="p-2 border-t border-line shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex items-center w-full rounded-[8px] text-left hover:bg-hover transition-colors outline-none cursor-pointer',
                sidebarCollapsed
                  ? 'justify-center p-2'
                  : 'gap-2.5 p-2'
              )}
              aria-label="User account menu"
            >
              <div className="w-7 h-7 rounded-full bg-accent text-on-accent text-xs font-semibold flex items-center justify-center shrink-0">
                {userInitial}
              </div>
              <AnimatePresence initial={false}>
                {!sidebarCollapsed && (
                  <m.div
                    className="min-w-0 flex-1 flex items-center justify-between overflow-hidden"
                    initial={{ opacity: 0, width: 0, x: -6 }}
                    animate={{ opacity: 1, width: 'auto', x: 0 }}
                    exit={{ opacity: 0, width: 0, x: -6, transition: { duration: 0.12 } }}
                    transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-fg truncate leading-tight">
                        {userName}
                      </p>
                      <p className="text-[11px] text-fg-3 truncate leading-tight">
                        {userEmail}
                      </p>
                    </div>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-fg-3 shrink-0 ml-1" />
                  </m.div>
                )}
              </AnimatePresence>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align={sidebarCollapsed ? 'center' : 'start'}
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
              onClick={() => navigate('/profile')}
            >
              <User className="w-4 h-4 mr-2 text-fg-3" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseEnter={() => prefetchRoute('settings')}
              onClick={() => navigate('/settings')}
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

            <DropdownMenuItem onClick={handleOpenShortcuts}>
              <Command className="w-4 h-4 mr-2 text-fg-3" />
              <span>Keyboard shortcuts</span>
              <kbd className="ml-auto text-[10px] font-mono bg-subtle border border-line rounded px-1 text-fg-3">
                ?
              </kbd>
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
    </m.aside>
  );
}

export default Sidebar;
