"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RoleGuard({ allowed, children }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile && !allowed.includes(profile.role)) {
      router.replace("/dashboard");
    }
  }, [loading, profile, allowed, router]);

  if (loading || !profile) return null;
  if (!allowed.includes(profile.role)) return null;

  return children;
}
