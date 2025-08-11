
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

const Auth = () => {
  const { signIn, signUp, authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
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
              </div>

              <Button type="submit" className="w-full transition-spring">
                {mode === "login" ? "Entrar" : "Criar conta"}
              </Button>

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
