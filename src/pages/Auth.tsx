
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ALLOW_SIGNUP, EMAIL_DOMAIN_ALLOWLIST, HCAPTCHA_SITE_KEY, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS } from "@/config/security";

const Auth = () => {
  const { signIn, signUp, authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/clientes");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!ALLOW_SIGNUP && mode === "signup") setMode("login");
    const raw = localStorage.getItem("auth_attempts");
    if (raw) {
      const parsed = JSON.parse(raw) as number[];
      const now = Date.now();
      const recent = parsed.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      setAttempts(recent.length);
      if (recent.length >= RATE_LIMIT_MAX_ATTEMPTS) {
        const next = Math.min(...recent) + RATE_LIMIT_WINDOW_MS;
        setBlockedUntil(next);
      }
    }
  }, [mode]);

  const recordAttempt = () => {
    const now = Date.now();
    const raw = localStorage.getItem("auth_attempts");
    const arr = raw ? (JSON.parse(raw) as number[]) : [];
    const recent = [...arr, now].filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    localStorage.setItem("auth_attempts", JSON.stringify(recent));
    setAttempts(recent.length);
    if (recent.length >= RATE_LIMIT_MAX_ATTEMPTS) {
      setBlockedUntil(now + RATE_LIMIT_WINDOW_MS);
    }
  };

  const isBlocked = blockedUntil ? Date.now() < blockedUntil : false;
  const secondsLeft = blockedUntil ? Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlocked) {
      toast({ title: "Muitas tentativas", description: `Tente novamente em ${secondsLeft}s.`, variant: "destructive" });
      return;
    }

    if (mode === "signup") {
      if (EMAIL_DOMAIN_ALLOWLIST.length > 0) {
        const domain = email.split("@")[1]?.toLowerCase();
        if (!domain || !EMAIL_DOMAIN_ALLOWLIST.includes(domain)) {
          toast({ title: "Domínio não permitido", description: "Use um email autorizado para cadastro.", variant: "destructive" });
          return;
        }
      }
      if (HCAPTCHA_SITE_KEY && !captchaToken) {
        toast({ title: "Verifique o captcha", description: "Confirme que você não é um robô.", variant: "destructive" });
        return;
      }
    }

    try {
      if (mode === "login") {
        await signIn(email, password, HCAPTCHA_SITE_KEY ? captchaToken : undefined);
      } else {
        await signUp(email, password, HCAPTCHA_SITE_KEY ? captchaToken : undefined);
      }
    } finally {
      recordAttempt();
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({ title: "Informe seu email", description: "Digite seu email para enviar o link de recuperação.", variant: "default" });
      return;
    }
    const redirectTo = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      toast({ title: "Erro ao enviar recuperação", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Verifique seu email", description: "Enviamos um link para redefinir sua senha." });
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <main className="max-w-md mx-auto p-6 flex flex-col gap-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold gradient-brand bg-clip-text text-transparent">
            Acessar Calendários Fiscais
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Entre para criar, editar e gerir calendários. Visualização é pública.
          </p>
        </header>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!ALLOW_SIGNUP && (
                <div className="text-sm text-muted-foreground">
                  Cadastros novos estão desativados. Solicite acesso ao administrador.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={authLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={authLoading}
                  required
                />
                <div className="flex justify-end">
                  <Button type="button" variant="link" className="px-0" onClick={handleResetPassword}>
                    Esqueci minha senha
                  </Button>
                </div>
              </div>

              {HCAPTCHA_SITE_KEY && (
                <div className="pt-2">
                  <HCaptcha sitekey={HCAPTCHA_SITE_KEY} onVerify={(token) => setCaptchaToken(token)} />
                </div>
              )}

              <Button
                type="submit"
                className="w-full transition-spring"
                disabled={authLoading || isBlocked}
              >
                {isBlocked
                  ? `Aguarde ${secondsLeft}s`
                  : mode === "login"
                    ? "Entrar"
                    : "Criar conta"}
              </Button>

              <div className="text-xs text-center text-muted-foreground">
                {attempts}/{RATE_LIMIT_MAX_ATTEMPTS} tentativas nos últimos {Math.floor(RATE_LIMIT_WINDOW_MS / 60000)} min
              </div>

              {ALLOW_SIGNUP && (
                <div className="text-sm text-center text-muted-foreground">
                  {mode === "login" ? (
                    <>
                      Não tem conta?{" "}
                      <button
                        type="button"
                        className="underline text-foreground"
                        onClick={() => setMode("signup")}
                      >
                        Criar conta
                      </button>
                    </>
                  ) : (
                    <>
                      Já tem conta?{" "}
                      <button
                        type="button"
                        className="underline text-foreground"
                        onClick={() => setMode("login")}
                      >
                        Entrar
                      </button>
                    </>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/" className="text-sm underline text-muted-foreground hover:text-foreground">
            Voltar para o calendário
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Auth;
