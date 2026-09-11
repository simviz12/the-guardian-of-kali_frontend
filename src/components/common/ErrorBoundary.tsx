/**
 * React Error Boundary component to prevent application white-screens
 * and provide an actionable crash recovery interface.
 */
import { Component, ErrorInfo, ReactNode } from 'react';
import { GlobalErrorBanner } from './GlobalErrorBanner';
import { AppErrorDetails } from '../../types/errors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorDetails: AppErrorDetails | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorDetails: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorDetails: {
        kind: 'UNKNOWN_ERROR',
        title: 'Unexpected Application Exception',
        message: error.message || 'An unexpected rendering error occurred.',
        actionLabel: 'Reload Application',
        actionHint: 'Click reload or restart the application process.',
        technicalDetails: error.stack || String(error),
      },
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError && this.state.errorDetails) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 p-6">
          <div className="w-full max-w-xl">
            <GlobalErrorBanner
              error={this.state.errorDetails}
              onRetry={this.handleReload}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
