import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log if needed
    console.error("ErrorBoundary caught an error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    // Best-effort reset; if state is corrupted, reload page
    try {
      // no-op
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-6 text-center">
            <h1 className="text-lg font-semibold">Ocorreu um erro</h1>
            <p className="mt-2 text-sm opacity-80">Tente novamente. Se persistir, recarregue a página.</p>
            <button onClick={this.handleReset} className="mt-4 inline-flex items-center rounded-md px-4 py-2 border border-border bg-background hover:bg-accent transition">
              Tentar novamente
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
