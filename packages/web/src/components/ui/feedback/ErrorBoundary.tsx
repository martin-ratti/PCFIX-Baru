import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ${this.props.name || 'component'}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs flex items-center justify-between">
          <span>Error temporal.</span>
          <button onClick={() => this.setState({ hasError: false })} className="underline font-bold ml-2 hover:text-red-800">
            ↻
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;