"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SWRConfig } from "swr";
import PlatformShell from "@/modules/layout/PlatformShell";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { ToastProvider } from "@/context/ToastContext";

export default function PlatformLayout({ children }) {
  const { session, loading, mustChangePassword } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <SWRConfig value={{ revalidateOnFocus: false, dedupingInterval: 5000 }}>
      <ToastProvider>
        <PlatformShell>
          {mustChangePassword && (
            <ChangePasswordModal onDone={() => window.location.reload()} />
          )}
          {children}
        </PlatformShell>
      </ToastProvider>
    </SWRConfig>
  );
}
