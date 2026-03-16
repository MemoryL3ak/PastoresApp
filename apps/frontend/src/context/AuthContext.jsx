"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(undefined); // undefined = loading
  const [profile, setProfile]   = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      if (data.session) loadProfile(data.session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
      if (sess) {
        loadProfile(sess.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .schema("core")
      .from("profiles")
      .select("id, full_name, role, assigned_country, is_active")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const mustChangePassword = Boolean(session?.user?.user_metadata?.must_change_password);
  const canEdit = profile?.role === "admin" || profile?.role === "country_assigned";

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      signIn,
      signOut,
      mustChangePassword,
      canEdit,
      loading: session === undefined,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
