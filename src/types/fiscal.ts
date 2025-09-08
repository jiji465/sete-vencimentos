export interface FiscalEvent {
  id: string;
  taxName: string;
  title?: string;
  date: string;
  value: number;
  type: 'imposto' | 'parcelamento';
}

export interface AppInfo {
  name: string;
  cnpj: string;
  calendarTitle: string;
}

export interface CalendarState {
  appInfo: AppInfo;
  events: FiscalEvent[];
}

export const generateEventId = (): string => {
  return crypto.randomUUID();
};