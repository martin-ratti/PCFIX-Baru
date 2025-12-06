import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
      // Intentar volver atrás si hay historial, sino al home
      if (typeof window !== 'undefined' && window.history.length > 1) {
          window.history.back();
          setTimeout(() => {
             // Si en 100ms no cambió (estaba en la misma), forzamos reload
             window.location.reload();
          }, 100);
      } else {
          window.location.href = '/';
      }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 m-4">
          <div className="text-4xl mb-4">🔧</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Algo salió mal</h2>
          <p className="text-gray-500 mb-6 max-w-md">
            Hubo un error inesperado en este componente. No te preocupes, el resto de la aplicación sigue funcionando.
          </p>
          <div className="flex gap-3">
              <button 
                onClick={() => window.location.href = '/'}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                Ir al Inicio
              </button>
              <button 
                onClick={this.handleReload}
                className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-opacity-90 transition-colors shadow-md"
              >
                Reintentar
              </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}