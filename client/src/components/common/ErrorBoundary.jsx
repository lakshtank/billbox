import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from '@/lib/toast';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.message,
          stack: error?.stack,
          componentStack: errorInfo?.componentStack,
          url: typeof window !== 'undefined' ? window.location.href : '',
        }),
      }).catch(() => {});
    } catch {}
  }

  handleCopyDetails = () => {
    const errorText = this.state.error?.stack || this.state.error?.message || 'Unknown error';
    navigator.clipboard.writeText(errorText);
    toast.success('Error details copied to clipboard.');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="size-10 rounded-[10px] bg-bad-tint border border-bad/30 flex items-center justify-center mb-4 text-bad-fg shadow-2xs">
            <AlertTriangle className="size-5" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-fg mb-1">
            Something went wrong
          </h1>

          <p className="text-sm text-fg-3 max-w-sm mb-4 leading-normal">
            An unexpected error occurred while rendering this view.
          </p>

          {this.state.error && (
            <div className="w-full max-w-lg mb-6 p-3 rounded-lg bg-subtle border border-line text-left text-xs font-mono overflow-auto max-h-48 text-bad-fg">
              <div className="font-semibold mb-1">{this.state.error.message || String(this.state.error)}</div>
              {this.state.error.stack && (
                <div className="text-[11px] text-fg-3 whitespace-pre-wrap font-mono">{this.state.error.stack}</div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload page
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={this.handleCopyDetails}
              className="text-fg-2 hover:text-fg"
            >
              Copy error details
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
