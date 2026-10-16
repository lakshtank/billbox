import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  Package,
  Store,
  Bell,
  Settings,
  User,
  Plus,
  Upload,
  Sun,
  Moon,
  Laptop,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { usePreferences } from "@/context/PreferencesContext";
import api from "@/api/axios";

/**
 * CommandPalette component
 * Step 8.10:
 * - ⌘K / Ctrl+K and '/' focus
 * - 560px wide, radius 16, elevation 3, plain scrim
 * - Groups: Actions, Go to, Receipts (debounced server search), Products
 * - Arrow keys + Enter, Esc closes
 * - Result rows 40px with icon, label, hint
 */
export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [receipts, setReceipts] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const navigate = useNavigate();
  const { theme, resolvedTheme, setTheme } = usePreferences();

  // Keyboard shortcut listener: ⌘K, Ctrl+K, or '/' (when not in an input/textarea)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName) &&
        !document.activeElement?.isContentEditable
      ) {
        e.preventDefault();
        setOpen(true);
      }
    };

    const handleOpenEvent = () => setOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("billbox:open-command-palette", handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("billbox:open-command-palette", handleOpenEvent);
    };
  }, []);

  // Debounced server search for Receipts (max 6) & Products (max 4)
  React.useEffect(() => {
    if (!open || !query.trim() || query.trim().length < 2) {
      setReceipts([]);
      setProducts([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      const token = localStorage.getItem("billbox_token");
      if (!token) return;

      setIsSearching(true);
      try {
        const [receiptsRes, productsRes] = await Promise.allSettled([
          api.get("/receipts", { params: { search: query.trim(), limit: 6 } }),
          api.get("/products", { params: { search: query.trim(), limit: 4 } }),
        ]);

        if (receiptsRes.status === "fulfilled") {
          const items = receiptsRes.value?.data?.data?.receipts || receiptsRes.value?.data?.data || [];
          setReceipts(Array.isArray(items) ? items.slice(0, 6) : []);
        } else {
          setReceipts([]);
        }

        if (productsRes.status === "fulfilled") {
          const items = productsRes.value?.data?.data?.products || productsRes.value?.data?.data || [];
          setProducts(Array.isArray(items) ? items.slice(0, 4) : []);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.warn("Command palette search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, open]);

  const runCommand = (command) => {
    setOpen(false);
    setQuery("");
    command();
  };

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-accent" />
              <span>Searching...</span>
            </div>
          ) : (
            "No results found."
          )}
        </CommandEmpty>

        {/* Live Search Results: Receipts */}
        {receipts.length > 0 && (
          <CommandGroup heading="Receipts">
            {receipts.map((r) => (
              <CommandItem
                key={r._id}
                onSelect={() => runCommand(() => navigate(`/receipts/${r._id}`))}
              >
                <Receipt className="size-4 text-accent" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-medium">{r.storeName || "Receipt"}</span>
                  <span className="text-[11px] text-fg-3 truncate">
                    {r.receiptNumber ? `#${r.receiptNumber} · ` : ""}
                    {r.grandTotal ? `₹${Number(r.grandTotal).toLocaleString("en-IN")}` : ""}
                  </span>
                </div>
                <ArrowRight className="ml-auto size-3.5 text-fg-3 opacity-60" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Live Search Results: Products */}
        {products.length > 0 && (
          <CommandGroup heading="Products">
            {products.map((p) => (
              <CommandItem
                key={p._id}
                onSelect={() => runCommand(() => navigate(`/products/${p._id}`))}
              >
                <Package className="size-4 text-accent" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-medium">{p.productName}</span>
                  <span className="text-[11px] text-fg-3 truncate">{p.brand || "Product"}</span>
                </div>
                <ArrowRight className="ml-auto size-3.5 text-fg-3 opacity-60" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Actions Group */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => navigate("/receipts/new"))}>
            <Plus className="size-4 text-accent" />
            <span>New Receipt</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/receipts/new?batch=true"))}>
            <Upload className="size-4 text-accent" />
            <span>Upload Batch Receipts</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(cycleTheme)}>
            {theme === "system" ? (
              <Laptop className="size-4 text-fg-2" />
            ) : resolvedTheme === "dark" ? (
              <Moon className="size-4 text-accent" />
            ) : (
              <Sun className="size-4 text-amber-500" />
            )}
            <span>Toggle Theme ({theme})</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation Group */}
        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
            <LayoutDashboard className="size-4 text-fg-3" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/receipts"))}>
            <Receipt className="size-4 text-fg-3" />
            <span>Receipts</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/warranties"))}>
            <ShieldCheck className="size-4 text-fg-3" />
            <span>Warranties</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/products"))}>
            <Package className="size-4 text-fg-3" />
            <span>Products</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/stores"))}>
            <Store className="size-4 text-fg-3" />
            <span>Stores</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/reminders"))}>
            <Bell className="size-4 text-fg-3" />
            <span>Reminder Center</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
            <Settings className="size-4 text-fg-3" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/profile"))}>
            <User className="size-4 text-fg-3" />
            <span>My Profile</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;
