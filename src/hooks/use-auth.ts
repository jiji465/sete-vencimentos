
import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const cleanupAuthState = () => {
  try {
    // Remove all auth and calendar data from localStorage and sessionStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("supabase.auth.") || 
          key.includes("sb-") || 
          key.startsWith("fiscal-calendar-") ||
          key === "auth_attempts") {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith("supabase.auth.") || 
          key.includes("sb-") ||
          key.startsWith("fiscal-calendar-")) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {
    // ignore
  }
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // 1) Subscribe first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    // 2) Then get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string, captchaToken?: string) => {
    // Clean up possible stale sessions before attempting to sign in
    cleanupAuthState();
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // ignore
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      return { error };
    }
    window.location.href = "/clientes";
    return { error: null };
  }, [toast]);

  const signUp = useCallback(async (email: string, password: string, captchaToken?: string) => {
    // Clean up possible stale sessions before attempting to sign up
    cleanupAuthState();
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // ignore
    }
    const redirectUrl = `${window.location.origin}/clientes`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl, captchaToken },
    });
    if (error) {
      const message =
        error.message?.includes("users_email_partial_key") || error.message?.toLowerCase().includes("duplicate")
          ? "Email já cadastrado. Tente entrar ou recupere a sua senha."
          : error.message;
      toast({ title: "Erro ao criar conta", description: message, variant: "destructive" });
      return { error };
    }
    toast({
      title: "Confirme seu email",
      description: "Enviamos um link de confirmação. Após confirmar, você será redirecionado.",
    });
    return { error: null };
  }, [toast]);

  const signOut = useCallback(async () => {
    cleanupAuthState();
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // ignore
    }
    window.location.href = "/auth";
  }, []);

  return {
    session,
    user,
    isAuthenticated: !!user,
    authLoading,
    signIn,
    signUp,
    signOut,
  };
}
