import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';

const SHORTCUT_GROUPS = [
  {
    title: 'Navigation',
    items: [
      { keys: ['G', 'then', 'O'], label: 'Go to Overview' },
      { keys: ['G', 'then', 'R'], label: 'Go to Receipts' },
      { keys: ['G', 'then', 'P'], label: 'Go to Products' },
      { keys: ['G', 'then', 'W'], label: 'Go to Warranties' },
      { keys: ['G', 'then', 'M'], label: 'Go to Merchants' },
    ],
  },
  {
    title: 'Actions & Tools',
    items: [
      { keys: ['⌘K', '/', 'Ctrl+K'], label: 'Open command palette' },
      { keys: ['/'], label: 'Search receipts & products' },
      { keys: ['N'], label: 'Create new receipt' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
      { keys: ['Esc'], label: 'Close dialog or sheet' },
    ],
  },
];

export function ShortcutModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('billbox:open-shortcuts', handleOpen);
    return () => window.removeEventListener('billbox:open-shortcuts', handleOpen);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[480px] p-6 font-sans">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-semibold tracking-tight text-fg">
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-sm text-fg-2">
            Speed up your workflow with global keyboard commands.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-fg-3 mb-2.5">
                {group.title}
              </h4>
              <div className="space-y-1.5">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-hover transition-colors"
                  >
                    <span className="text-sm text-fg">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) =>
                        k === 'then' || k === '/' ? (
                          <span key={kIdx} className="text-xs text-fg-3 px-0.5">
                            {k}
                          </span>
                        ) : (
                          <kbd
                            key={kIdx}
                            className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-mono font-medium text-fg bg-subtle border border-line rounded-[6px] shadow-2xs"
                          >
                            {k}
                          </kbd>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShortcutModal;
