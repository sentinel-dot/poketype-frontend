"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/authStore";
import { useUserSocket } from "@/lib/hooks/useUserSocket";
import Toaster from "./Toaster";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  useUserSocket();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
