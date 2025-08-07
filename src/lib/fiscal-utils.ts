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
    minimumFractionDigits: 4,
    maximumFractionDigits: 6
  }).format(value);
};

export const formatCurrencyForInput = (value: number): string => {
  if (isNaN(value)) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
    useGrouping: false
  }).format(value).replace('.', ',');
};

export const formatDateForDisplay = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
};

export const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
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
  const safeName = clientName ? encodeURIComponent(clientName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) : '';
  
  if (safeName) {
    return `${baseUrl}/calendario/${safeName}?id=${calendarId}`;
  }
  return `${baseUrl}/calendario-fiscal?view=${calendarId}`;
};

export const createEditLink = (calendarId: string): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}?edit=${calendarId}`;
};