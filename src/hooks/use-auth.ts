
import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const cleanupAuthState = (isSignOut = false) => {
  try {
    // Remove auth data
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("supabase.auth.") || key.includes("sb-")) {
        localStorage.removeItem(key);
      }
      // Only clear calendar data on explicit sign out to prevent data loss during login flow
      if (isSignOut && key.startsWith("fiscal-calendar-")) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith("supabase.auth.") || key.includes("sb-")) {
        sessionStorage.removeItem(key);
      }
      if (isSignOut && key.startsWith("fiscal-calendar-")) {
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
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // 1) Subscribe first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setAuthLoading(false);
      }
    });

    // 2) Then get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string, captchaToken?: string) => {
    try {
      // Don't clear state aggressively on sign in to preserve "auth_attempts" and local work
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });

      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
        return { error };
      }

      navigate("/clientes");
      return { error: null };
    } catch (err: any) {
      toast({ title: "Erro inesperado", description: err.message, variant: "destructive" });
      return { error: err };
    }
  }, [toast, navigate]);

  const signUp = useCallback(async (email: string, password: string, captchaToken?: string) => {
    try {
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
    } catch (err: any) {
      toast({ title: "Erro inesperado", description: err.message, variant: "destructive" });
      return { error: err };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    cleanupAuthState(true); // Pass true to clear local data on logout
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // ignore
    }
    navigate("/auth");
  }, [navigate]);

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
