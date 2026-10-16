import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="size-10 rounded-[10px] bg-subtle border border-line flex items-center justify-center mb-4 text-fg-3 shadow-2xs">
        <FileQuestion className="size-5" />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-fg mb-1">
        Page not found
      </h1>

      <p className="text-sm text-fg-3 max-w-sm mb-6 leading-normal">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex items-center gap-3">
        <Button asChild size="sm">
          <Link to="/">Back to overview</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/receipts">Go to receipts</Link>
        </Button>
      </div>
    </div>
  );
}
