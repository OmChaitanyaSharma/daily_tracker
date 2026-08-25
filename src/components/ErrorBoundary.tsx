
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base p-6">
          <div className="max-w-md w-full bg-bg-surface border border-border-strong rounded-2xl p-8 text-center space-y-6">
            <h1 className="text-2xl font-serif text-accent-red">Something went wrong.</h1>
            <p className="text-text-muted text-sm break-words p-4 bg-bg-base rounded-xl border border-border-subtle">
              {this.state.error?.message}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-text-main text-bg-base rounded-full text-sm font-medium hover:opacity-90"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

