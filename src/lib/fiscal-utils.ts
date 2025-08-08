export const parseCurrency = (valueStr: string): number => {
  if (typeof valueStr !== 'string' || !valueStr) return 0;
  const raw = valueStr.trim();

  // If uses comma as decimal (pt-BR typical)
  if (raw.includes(',')) {
    // Keep digits and commas only
    const only = raw.replace(/[^\d,]/g, '');
    // Use the last comma as decimal separator, remove the others (thousand separators)
    const parts = only.split(',');
    const intPart = parts.slice(0, -1).join('');
    const decPart = parts.slice(-1)[0] || '';
    const normalized = `${intPart}.${decPart}`;
    return parseFloat(normalized) || 0;
  }

  // If uses dot(s)
  if (raw.includes('.')) {
    let only = raw.replace(/[^\d.]/g, '');
    const dotCount = (only.match(/\./g) || []).length;

    if (dotCount > 1) {
      // Treat all dots as thousand separators
      const normalized = only.replace(/\./g, '');
      return parseFloat(normalized) || 0;
    }

    // Single dot: decide if decimal or thousand separator
    const [i, d] = only.split('.');
    if (d && d.length <= 2) {
      return parseFloat(`${i}.${d}`) || 0;
    }
    // Likely thousand separator (e.g., 100.000)
    return parseFloat(only.replace(/\./g, '')) || 0;
  }

  // No separators: digits only
  const digits = raw.replace(/\D/g, '');
  return parseFloat(digits) || 0;
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
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};