export const parseCurrency = (valueStr: string): number => {
  if (typeof valueStr !== 'string' || !valueStr) return 0;
  // Remove todos os caracteres exceto dígitos, vírgulas e pontos
  // Primeiro remove os pontos (separadores de milhares) e depois substitui vírgula por ponto
  const cleaned = valueStr
    .replace(/[^\d.,]/g, '') // Remove tudo exceto dígitos, vírgulas e pontos
    .replace(/\./g, '') // Remove pontos (separadores de milhares)
    .replace(',', '.'); // Substitui vírgula decimal por ponto
  return parseFloat(cleaned) || 0;
};

export const formatCurrencyForDisplay = (value: number): string => {
  if (isNaN(value)) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatCurrencyForInput = (value: number): string => {
  if (isNaN(value)) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false
  }).format(value).replace('.', ',');
};

export const formatDateForDisplay = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
};

export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return new Date(y, (m || 1) - 1, d || 1);
  }
  // Fallback para outros formatos
  return new Date(dateStr);
};

export const isToday = (dateStr: string): boolean => {
  const date = parseLocalDate(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const getMonthYear = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export const generateCalendarId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  const shortId = Math.random().toString(36).substr(2, 5);
  return `sete-${timestamp}-${randomPart}-${shortId}`;
};

export const createCustomShareLink = (calendarId: string, clientName?: string): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const slug = clientName 
    ? clientName.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30)
    : 'calendario';
  return `${baseUrl}?view=${calendarId}&s=${slug}`;
};

export const createEditLink = (calendarId: string): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}?id=${calendarId}`;
};