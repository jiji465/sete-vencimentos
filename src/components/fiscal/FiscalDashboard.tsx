import { useMemo } from 'react';
import { FiscalEvent } from '@/types/fiscal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, DollarSign, Clock, PieChart, Target } from 'lucide-react';

interface FiscalDashboardProps {
  events: FiscalEvent[];
  currentDate: Date;
  clientName: string;
}

export function FiscalDashboard({ events, currentDate, clientName }: FiscalDashboardProps) {
  const stats = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter events for current month
    const currentMonthEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });

    // Calculate totals by type
    const impostoTotal = currentMonthEvents
      .filter(e => e.type === 'imposto')
      .reduce((sum, e) => sum + (e.value || 0), 0);
    
    const parcelamentoTotal = currentMonthEvents
      .filter(e => e.type === 'parcelamento')
      .reduce((sum, e) => sum + (e.value || 0), 0);

    const totalMensal = impostoTotal + parcelamentoTotal;

    // Calculate annual totals
    const currentYearEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === currentYear;
    });

    const totalAnual = currentYearEvents.reduce((sum, e) => sum + (e.value || 0), 0);

    // Count events
    const totalEventos = currentMonthEvents.length;
    const eventosVencidos = currentMonthEvents.filter(event => {
      const eventDate = new Date(event.date);
      const today = new Date();
      return eventDate < today;
    }).length;

    // Calculate progress through month
    const today = new Date();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = today.getDate();
    const progressMes = Math.min((currentDay / daysInMonth) * 100, 100);

    // Group by tax name for breakdown
    const taxBreakdown = currentMonthEvents.reduce((acc, event) => {
      const key = event.taxName;
      if (!acc[key]) {
        acc[key] = { total: 0, count: 0, type: event.type };
      }
      acc[key].total += event.value || 0;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number; type: string }>);

    return {
      impostoTotal,
      parcelamentoTotal,
      totalMensal,
      totalAnual,
      totalEventos,
      eventosVencidos,
      progressMes,
      taxBreakdown
    };
  }, [events, currentDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(value);
  };

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 mt-8">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary">Resumo Financeiro Fiscal</h2>
        <p className="text-muted-foreground">
          {clientName && `${clientName} • `}
          {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="gradient-brand text-white border-0 shadow-brand transition-spring hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Impostos</CardTitle>
            <TrendingUp className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.impostoTotal)}</div>
            <p className="text-xs text-white/70 mt-1">
              {events.filter(e => e.type === 'imposto' && new Date(e.date).getMonth() === currentDate.getMonth()).length} obrigações
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-accent text-primary border-0 shadow-gold transition-spring hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parcelamentos</CardTitle>
            <Clock className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.parcelamentoTotal)}</div>
            <p className="text-xs text-primary/70 mt-1">
              {events.filter(e => e.type === 'parcelamento' && new Date(e.date).getMonth() === currentDate.getMonth()).length} parcelas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border transition-spring hover:scale-105 hover:shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalMensal)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalEventos} vencimentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax Breakdown */}
        <Card className="transition-spring hover:shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <PieChart className="h-5 w-5" />
              Detalhamento por Obrigação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.taxBreakdown).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma obrigação fiscal neste mês
              </p>
            ) : (
              Object.entries(stats.taxBreakdown)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([taxName, data]) => (
                  <div key={taxName} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant={data.type === 'imposto' ? 'default' : 'secondary'} className="text-xs">
                        {data.type === 'imposto' ? 'Imposto' : 'Parcelamento'}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{taxName}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.count} {data.count === 1 ? 'vencimento' : 'vencimentos'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(data.total)}</p>
                      <p className="text-xs text-muted-foreground">
                        {((data.total / stats.totalMensal) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Annual Overview */}
        <Card className="transition-spring hover:shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Target className="h-5 w-5" />
              Visão Anual {currentDate.getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg gradient-subtle">
                <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalAnual)}</p>
                <p className="text-sm text-muted-foreground">Total Anual</p>
              </div>
              <div className="text-center p-4 rounded-lg gradient-subtle">
                <p className="text-2xl font-bold text-primary">
                  {events.filter(e => new Date(e.date).getFullYear() === currentDate.getFullYear()).length}
                </p>
                <p className="text-sm text-muted-foreground">Obrigações</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Média mensal</span>
                <span className="font-medium">{formatCurrency(stats.totalAnual / 12)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Este mês vs média</span>
                <span className={`font-medium ${stats.totalMensal > (stats.totalAnual / 12) ? 'text-orange-600' : 'text-green-600'}`}>
                  {stats.totalMensal > (stats.totalAnual / 12) ? '+' : ''}
                  {formatCurrency(stats.totalMensal - (stats.totalAnual / 12))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer insight */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Dica:</strong> Mantenha suas obrigações em dia para evitar multas e juros.
          {stats.eventosVencidos > 0 && (
            <span className="text-orange-600 font-medium">
              {" "}Atenção: {stats.eventosVencidos} obrigação(ões) já vencida(s) neste mês.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}