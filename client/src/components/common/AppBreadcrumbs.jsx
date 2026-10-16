import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const ROUTE_NAME_MAP = {
  '': 'Overview',
  receipts: 'Receipts',
  products: 'Products',
  warranties: 'Warranties',
  stores: 'Merchants',
  merchants: 'Merchants',
  reminders: 'Reminders',
  profile: 'Profile',
  settings: 'Settings',
  new: 'New Receipt',
  batch: 'Batch Review',
};

export function AppBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  // If on root route
  if (pathnames.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center text-sm font-sans">
        <span className="font-medium text-fg">Overview</span>
      </nav>
    );
  }

  // Build breadcrumb items
  const items = [{ name: 'Overview', to: '/' }];
  let currentPath = '';

  pathnames.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathnames.length - 1;

    let label = ROUTE_NAME_MAP[segment.toLowerCase()];
    if (!label) {
      // If segment looks like an ID (mongo ObjectId or long hex), display details
      if (segment.length === 24 || segment.startsWith('batch_')) {
        label = 'Details';
      } else {
        // Decode URI component (e.g. store names) and capitalize
        try {
          const decoded = decodeURIComponent(segment);
          label = decoded.charAt(0).toUpperCase() + decoded.slice(1);
        } catch {
          label = segment;
        }
      }
    }

    items.push({
      name: label,
      to: currentPath,
      isLast,
    });
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-sans overflow-hidden">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.to + index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-fg-3 shrink-0" aria-hidden="true" />
            )}
            {isLast ? (
              <span className="font-medium text-fg truncate" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link
                to={item.to}
                className="text-fg-2 hover:text-fg transition-colors truncate"
              >
                {item.name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default AppBreadcrumbs;
