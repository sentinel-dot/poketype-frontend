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
            <div
              className="rounded-2xl px-6 py-5 max-w-sm w-full"
              style={{
                background: "oklch(0.55 0.22 15 / 0.08)",
                border: "1px solid oklch(0.55 0.22 15 / 0.22)",
              }}
            >
              <p className="text-base font-semibold text-foreground">
                Ein Fehler ist aufgetreten.
              </p>
              <button
                className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, var(--primary), oklch(0.44 0.22 15))",
                  boxShadow: "0 4px 14px var(--primary-glow)",
                }}
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
