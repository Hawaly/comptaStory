"use client";

import { AuthProvider } from "@/contexts/SimpleAuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
