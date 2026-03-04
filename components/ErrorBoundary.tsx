"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    console.error("Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen items-center justify-center p-8 text-center">
            <div>
              <p className="text-lg font-semibold text-red-400">
                Ein Fehler ist aufgetreten.
              </p>
              <button
                className="mt-4 rounded px-4 py-2 text-sm underline"
                onClick={() => this.setState({ hasError: false })}
              >
                Neu laden
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
