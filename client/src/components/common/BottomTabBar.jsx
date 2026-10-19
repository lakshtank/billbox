import * as React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useMotionValueEvent } from 'motion/react';
import * as m from 'motion/react-m';
import {
  LayoutDashboard,
  ReceiptText,
  Plus,
  ShieldCheck,
  Menu,
  Package,
  Store,
  Bell,
  Settings,
  User,
  LogOut,
  Sun,
  Moon,
  Command,
  Sparkles,
} from 'lucide-react';
import useUiStore from '../../store/uiStore';
import { useRemindersQuery } from '../../queries/useRemindersQuery';
import { usePreferences } from '../../context/PreferencesContext';
import useAuth from '../../hooks/useAuth';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { cn } from '../../lib/utils';
import { prefetchRoute } from '../../lib/routePreloader';
import { useAppScroll } from '../../hooks/useAppScroll';
import { spring } from '../../lib/motion';

/**
 * Step 10.4: Mobile Bottom Tab Bar (<768px) with Step 4.4 Motion
 * - 56px (h-14) height + safe area inset (pb-[env(safe-area-inset-bottom)])
 * - Sliding active pill with layoutId="tab-active"
 * - Press feedback: whileTap={{ scale: 0.92 }} on icon
 * - Center 44px (w-11 h-11) rounded-full accent Add button with whileTap={{ scale: 0.94 }}
 * - Hide on scroll down, show on scroll up:
 *   animate={{ y: hidden ? 'calc(100% + env(safe-area-inset-bottom))' : 0 }}
 * - 5 items: Overview, Receipts, Add, Warranties, More
 * - More opens bottom sheet (side="bottom")
 */
export function BottomTabBar() {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logoutUser } = useAuth();
  const { theme, setTheme } = usePreferences();

  // Scroll tracking to hide on scroll down (> 120px) and show on scroll up
  const { scrollY } = useAppScroll();
  const [hidden, setHidden] = React.useState(false);

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 120);
  });

  // Listen to open-more-sheet event (e.g. from topbar menu button)
  React.useEffect(() => {
    const handleOpenMore = () => setSheetOpen(true);
    window.addEventListener('billbox:open-more-sheet', handleOpenMore);
    return () => window.removeEventListener('billbox:open-more-sheet', handleOpenMore);
  }, []);

  // Reminders query for amber dot
  const { data: remindersData } = useRemindersQuery();
  const expiringCount = React.useMemo(() => {
    const items = remindersData?.items || [];
    return items.filter((i) => i.daysRemaining > 0 && i.daysRemaining <= 30).length;
  }, [remindersData]);

  const handleOpenShortcuts = () => {
    setSheetOpen(false);
    window.dispatchEvent(new CustomEvent('billbox:open-shortcuts'));
  };

  const handleNavigate = (path) => {
    setSheetOpen(false);
    navigate(path);
  };

  const isCurrent = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <m.nav
        aria-label="Mobile Navigation"
        animate={{ y: hidden ? 'calc(100% + env(safe-area-inset-bottom))' : 0 }}
        transition={spring.soft}
        className="tabbar md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line pb-[env(safe-area-inset-bottom)] select-none font-sans"
      >
        <div className="grid grid-cols-5 h-14 items-center px-1">
          {/* 1. Overview */}
          <NavLink
            to="/"
            end
            onMouseEnter={() => prefetchRoute('dashboard')}
            onTouchStart={() => prefetchRoute('dashboard')}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-accent' : 'text-fg-2 hover:text-fg'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <m.span
                    layoutId="tab-active"
                    className="absolute inset-x-1 inset-y-1.5 rounded-lg bg-selected border border-accent/20"
                    transition={spring.snappy}
                  />
                )}
                <m.div whileTap={{ scale: 0.92 }} className="relative z-10 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 shrink-0" />
                </m.div>
                <span className="relative z-10">Overview</span>
              </>
            )}
          </NavLink>

          {/* 2. Receipts */}
          <NavLink
            to="/receipts"
            onMouseEnter={() => prefetchRoute('receipts')}
            onTouchStart={() => prefetchRoute('receipts')}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-accent' : 'text-fg-2 hover:text-fg'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <m.span
                    layoutId="tab-active"
                    className="absolute inset-x-1 inset-y-1.5 rounded-lg bg-selected border border-accent/20"
                    transition={spring.snappy}
                  />
                )}
                <m.div whileTap={{ scale: 0.92 }} className="relative z-10 flex items-center justify-center">
                  <ReceiptText className="w-5 h-5 shrink-0" />
                </m.div>
                <span className="relative z-10">Receipts</span>
              </>
            )}
          </NavLink>

          {/* 3. Add (Center 44px accent-filled circle) */}
          <div className="flex items-center justify-center -translate-y-2">
            <m.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onMouseEnter={() => prefetchRoute('addReceipt')}
              onTouchStart={() => prefetchRoute('addReceipt')}
              onClick={() => navigate('/receipts/new')}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-accent text-on-accent shadow-[var(--elevation-2)] cursor-pointer"
              aria-label="Add new receipt"
            >
              <Plus className="w-6 h-6" />
            </m.button>
          </div>

          {/* 4. Warranties */}
          <NavLink
            to="/warranties"
            onMouseEnter={() => prefetchRoute('warranties')}
            onTouchStart={() => prefetchRoute('warranties')}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-accent' : 'text-fg-2 hover:text-fg'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <m.span
                    layoutId="tab-active"
                    className="absolute inset-x-1 inset-y-1.5 rounded-lg bg-selected border border-accent/20"
                    transition={spring.snappy}
                  />
                )}
                <m.div whileTap={{ scale: 0.92 }} className="relative z-10 flex items-center justify-center">
                  <div className="relative">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    {expiringCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-warn-solid ring-2 ring-surface" />
                    )}
                  </div>
                </m.div>
                <span className="relative z-10">Warranties</span>
              </>
            )}
          </NavLink>

          {/* 5. More */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('billbox:open-sidebar'))}
            className="relative flex flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-medium transition-colors cursor-pointer text-fg-2 hover:text-fg"
            aria-label="Open navigation menu"
          >
            <m.div whileTap={{ scale: 0.92 }} className="relative z-10 flex items-center justify-center">
              <Menu className="w-5 h-5 shrink-0" />
            </m.div>
            <span className="relative z-10">More</span>
          </button>
        </div>
      </m.nav>

      {/* Step 10.4: "More" Bottom Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="p-4 sm:p-6 font-sans">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-base font-semibold text-fg">
              Navigation & Preferences
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 pt-2">
            {/* Nav Links */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSheetOpen(false);
                  useUiStore.getState().openAskBillBox();
                }}
                className="col-span-2 flex items-center justify-between p-3 rounded-[8px] border border-accent/25 bg-accent/[0.08] hover:bg-accent/[0.16] text-accent text-sm font-semibold transition-colors text-left cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-accent shrink-0" />
                  <span>Ask BillBox AI</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/20">
                  Gemini 3.8
                </span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchRoute('products')}
                onTouchStart={() => prefetchRoute('products')}
                onClick={() => handleNavigate('/products')}
                className={cn(
                  'flex items-center gap-2.5 p-3 rounded-[8px] border border-line text-sm font-medium transition-colors text-left cursor-pointer',
                  isCurrent('/products') ? 'bg-selected text-accent border-accent/30' : 'bg-surface text-fg hover:bg-hover'
                )}
              >
                <Package className="w-4 h-4 text-fg-2 shrink-0" />
                <span>Products</span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchRoute('stores')}
                onTouchStart={() => prefetchRoute('stores')}
                onClick={() => handleNavigate('/stores')}
                className={cn(
                  'flex items-center gap-2.5 p-3 rounded-[8px] border border-line text-sm font-medium transition-colors text-left cursor-pointer',
                  isCurrent('/stores') ? 'bg-selected text-accent border-accent/30' : 'bg-surface text-fg hover:bg-hover'
                )}
              >
                <Store className="w-4 h-4 text-fg-2 shrink-0" />
                <span>Merchants</span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchRoute('reminders')}
                onTouchStart={() => prefetchRoute('reminders')}
                onClick={() => handleNavigate('/reminders')}
                className={cn(
                  'flex items-center gap-2.5 p-3 rounded-[8px] border border-line text-sm font-medium transition-colors text-left cursor-pointer',
                  isCurrent('/reminders') ? 'bg-selected text-accent border-accent/30' : 'bg-surface text-fg hover:bg-hover'
                )}
              >
                <Bell className="w-4 h-4 text-fg-2 shrink-0" />
                <span>Reminders</span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchRoute('profile')}
                onTouchStart={() => prefetchRoute('profile')}
                onClick={() => handleNavigate('/profile')}
                className={cn(
                  'flex items-center gap-2.5 p-3 rounded-[8px] border border-line text-sm font-medium transition-colors text-left cursor-pointer',
                  isCurrent('/profile') ? 'bg-selected text-accent border-accent/30' : 'bg-surface text-fg hover:bg-hover'
                )}
              >
                <User className="w-4 h-4 text-fg-2 shrink-0" />
                <span>Profile</span>
              </button>
            </div>

            <div className="pt-2 border-t border-line space-y-3">
              {/* Settings link */}
              <button
                type="button"
                onMouseEnter={() => prefetchRoute('settings')}
                onTouchStart={() => prefetchRoute('settings')}
                onClick={() => handleNavigate('/settings')}
                className="flex items-center justify-between w-full p-2.5 rounded-[8px] text-sm font-medium text-fg hover:bg-hover transition-colors text-left cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-fg-3" />
                  <span>Settings</span>
                </span>
              </button>

              {/* Theme Segmented Switcher */}
              <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-subtle">
                <span className="text-xs font-medium text-fg-2">Appearance</span>
                <div className="flex items-center gap-1 bg-surface border border-line rounded-[6px] p-0.5">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer',
                      theme === 'light' ? 'bg-accent text-on-accent' : 'text-fg-2 hover:text-fg'
                    )}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('gentle')}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer',
                      theme === 'gentle' ? 'bg-accent text-on-accent' : 'text-fg-2 hover:text-fg'
                    )}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Gentle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer',
                      theme === 'dark' ? 'bg-accent text-on-accent' : 'text-fg-2 hover:text-fg'
                    )}
                  >
                    <Moon className="w-3.5 h-3.5 fill-current" />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              {/* Shortcuts trigger */}
              <button
                type="button"
                onClick={handleOpenShortcuts}
                className="flex items-center justify-between w-full p-2.5 rounded-[8px] text-sm font-medium text-fg hover:bg-hover transition-colors text-left cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Command className="w-4 h-4 text-fg-3" />
                  <span>Keyboard shortcuts</span>
                </span>
                <kbd className="text-[10px] font-mono bg-subtle border border-line rounded px-1.5 py-0.5 text-fg-3">
                  ?
                </kbd>
              </button>

              {/* Sign out */}
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setSheetOpen(false);
                    logoutUser();
                  }}
                  className="flex items-center gap-2.5 w-full p-2.5 rounded-[8px] text-sm font-medium text-bad-fg hover:bg-bad-bg transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-bad-fg" />
                  <span>Sign out</span>
                </button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default BottomTabBar;
