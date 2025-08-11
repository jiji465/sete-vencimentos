
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateCalendarId, createCustomShareLink } from "@/lib/fiscal-utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

interface CalendarRow {
  id: string;
  client_name: string | null;
  client_cnpj: string | null;
  calendar_title: string;
  created_at: string;
  updated_at: string;
}

const Clients = () => {
  const [calendars, setCalendars] = useState<CalendarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const load = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setCalendars([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("fiscal_calendars")
      .select("id, client_name, client_cnpj, calendar_title, created_at, updated_at")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar clientes", description: error.message, variant: "destructive" });
    } else {
      setCalendars(data || []);
    }
    setLoading(false);
  }, [isAuthenticated, user?.id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleNew = async () => {
    if (!isAuthenticated || !user?.id) {
      toast({ title: "Login necessário", description: "Entre para criar um novo calendário." });
      navigate("/auth");
      return;
    }
    const newId = generateCalendarId();
    const { error } = await supabase.from("fiscal_calendars").upsert({
      id: newId,
      calendar_title: "Calendário de Impostos",
      client_name: "",
      client_cnpj: "",
      owner_id: user.id,
    });
    if (error) {
      toast({ title: "Erro ao criar calendário", description: error.message, variant: "destructive" });
      return;
    }
    navigate(`/calendario-fiscal?id=${newId}`);
  };

  const handleOpen = (id: string) => navigate(`/calendario-fiscal?id=${id}`);

  const handleDuplicate = async (id: string) => {
    if (!isAuthenticated || !user?.id) {
      toast({ title: "Login necessário", description: "Entre para duplicar calendários." });
      navigate("/auth");
      return;
    }
    const newId = generateCalendarId();
    const { data: srcCal, error: calErr } = await supabase
      .from("fiscal_calendars")
      .select("calendar_title, client_name, client_cnpj")
      .eq("id", id)
      .maybeSingle();
    if (calErr) {
      toast({ title: "Erro ao duplicar", description: calErr.message, variant: "destructive" });
      return;
    }

    const { error: upErr } = await supabase.from("fiscal_calendars").upsert({
      id: newId,
      calendar_title: srcCal?.calendar_title || "Calendário de Impostos",
      client_name: srcCal?.client_name || "",
      client_cnpj: srcCal?.client_cnpj || "",
      owner_id: user.id,
    });
    if (upErr) {
      toast({ title: "Erro ao duplicar", description: upErr.message, variant: "destructive" });
      return;
    }

    const { data: events, error: evErr } = await supabase
      .from("fiscal_events")
      .select("tax_name, title, date, value, type")
      .eq("calendar_id", id);
    if (evErr) {
      toast({ title: "Erro ao copiar eventos", description: evErr.message, variant: "destructive" });
      return;
    }

    if (events && events.length > 0) {
      const { error: evUpErr } = await supabase.from("fiscal_events").upsert(
        events.map((e) => ({
          id: generateCalendarId(),
          calendar_id: newId,
          tax_name: e.tax_name,
          title: e.title || "",
          date: e.date as unknown as string,
          value: e.value as unknown as number,
          type: e.type,
        }))
      );
      if (evUpErr) {
        toast({ title: "Erro ao duplicar eventos", description: evUpErr.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: "Calendário duplicado", description: "Abrindo o novo calendário..." });
    navigate(`/calendario-fiscal?id=${newId}`);
  };

  const handleDelete = async (id: string) => {
    if (!isAuthenticated || !user?.id) {
      toast({ title: "Login necessário", description: "Entre para excluir calendários." });
      navigate("/auth");
      return;
    }
    const confirm = window.confirm("Tem certeza que deseja excluir este calendário? Esta ação não pode ser desfeita.");
    if (!confirm) return;

    const { error } = await supabase.from("fiscal_calendars").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Excluído", description: "Calendário removido com sucesso." });
    load();
  };

  const handleCopyShare = async (id: string, name?: string | null) => {
    const link = createCustomShareLink(id, name || undefined);
    await navigator.clipboard.writeText(link);
    toast({ title: "Link copiado", description: "Link de visualização copiado para a área de transferência" });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen gradient-subtle">
        <main className="max-w-5xl mx-auto p-6 space-y-6">
          <header className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Clientes - Calendários Fiscais</h1>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate("/calendario-fiscal")}>Voltar</Button>
              <Button variant="brand" onClick={() => navigate("/auth")}>Entrar</Button>
            </div>
          </header>
          <div className="text-muted-foreground">Entre para ver e gerir seus calendários.</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Clientes - Meus Calendários</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate("/calendario-fiscal")}>Voltar</Button>
            <Button variant="brand" onClick={handleNew}>Novo calendário</Button>
          </div>
        </header>

        {loading ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : calendars.length === 0 ? (
          <div className="text-muted-foreground">Nenhum calendário criado ainda.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calendars.map((c) => (
              <Card key={c.id} className="border-border/50">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{c.client_name || "(Sem nome)"}</div>
                      <div className="text-xs text-muted-foreground">CNPJ: {c.client_cnpj || "—"}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Atualizado {new Date(c.updated_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{c.calendar_title}</div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" onClick={() => handleOpen(c.id)}>Abrir</Button>
                    <Button variant="secondary" onClick={() => handleCopyShare(c.id, c.client_name)}>Copiar link</Button>
                    <Button variant="outline" onClick={() => handleDuplicate(c.id)}>Duplicar</Button>
                    <Button variant="destructive" onClick={() => handleDelete(c.id)}>Excluir</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Clients;
