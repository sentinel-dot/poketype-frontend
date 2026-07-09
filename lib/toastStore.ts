"use client";

import { create } from "zustand";

export type ToastVariant = "info" | "success" | "error" | "warning";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  show: (t: Omit<Toast, "id" | "duration"> & { duration?: number }) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show({ message, variant, actionLabel, onAction, duration }) {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = {
      id,
      message,
      variant,
      actionLabel,
      onAction,
      duration: duration ?? 4000,
    };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    if (toast.duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, toast.duration);
    }
    return id;
  },
  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

// Convenience helpers usable outside React components.
export const toast = {
  info: (message: string, duration?: number) =>
    useToastStore.getState().show({ message, variant: "info", duration }),
  success: (message: string, duration?: number) =>
    useToastStore.getState().show({ message, variant: "success", duration }),
  error: (message: string, duration?: number) =>
    useToastStore.getState().show({ message, variant: "error", duration }),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().show({ message, variant: "warning", duration }),
  action: (
    message: string,
    actionLabel: string,
    onAction: () => void,
    duration = 6000,
  ) => useToastStore.getState().show({ message, variant: "info", actionLabel, onAction, duration }),
};
