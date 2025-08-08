import { useState, useEffect, useCallback } from 'react';
import { FiscalEvent, CalendarState } from '@/types/fiscal';
import { generateCalendarId, parseLocalDate } from '@/lib/fiscal-utils';

interface UseFiscalCalendarProps {
  isViewOnly?: boolean;
  initialCalendarId?: string;
}

export function useFiscalCalendar({ isViewOnly = false, initialCalendarId }: UseFiscalCalendarProps = {}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarId, setCalendarId] = useState<string>(initialCalendarId || generateCalendarId());
  const [state, setState] = useState<CalendarState>({
    appInfo: {
      name: '',
      cnpj: '',
      calendarTitle: 'Calendário de Impostos'
    },
    events: []
  });

  // Load initial data (in a real app, this would load from an API/database)
  useEffect(() => {
    if (initialCalendarId) {
      // In a real implementation, load data from storage/API
      // For demo purposes, we'll use localStorage
      const stored = localStorage.getItem(`fiscal-calendar-${initialCalendarId}`);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setState(data);
        } catch (error) {
          console.error('Error loading calendar data:', error);
        }
      }
    }
  }, [initialCalendarId]);

  // Save data (debounced in real implementation)
  const saveData = useCallback(() => {
    if (!isViewOnly) {
      localStorage.setItem(`fiscal-calendar-${calendarId}`, JSON.stringify(state));
    }
  }, [calendarId, state, isViewOnly]);

  useEffect(() => {
    const t = setTimeout(() => {
      saveData();
    }, 250);
    return () => clearTimeout(t);
  }, [saveData]);

  // Calendar navigation
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  }, []);

  // Event management
  const addEvent = useCallback((event: FiscalEvent) => {
    setState(prev => ({
      ...prev,
      events: [...prev.events, event]
    }));
  }, []);

  const updateEvent = useCallback((updatedEvent: FiscalEvent) => {
    setState(prev => ({
      ...prev,
      events: prev.events.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    }));
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    setState(prev => ({
      ...prev,
      events: prev.events.filter(event => event.id !== eventId)
    }));
  }, []);

  const saveEvent = useCallback((event: FiscalEvent) => {
    const existingEvent = state.events.find(e => e.id === event.id);
    if (existingEvent) {
      updateEvent(event);
    } else {
      addEvent(event);
    }
  }, [state.events, addEvent, updateEvent]);

  // App info management
  const updateAppInfo = useCallback((updates: Partial<CalendarState['appInfo']>) => {
    setState(prev => ({
      ...prev,
      appInfo: { ...prev.appInfo, ...updates }
    }));
  }, []);

  // Get events for current month
  const getCurrentMonthEvents = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return state.events.filter(event => {
      const eventDate = parseLocalDate(event.date);
      return (
        eventDate.getFullYear() === year && eventDate.getMonth() === month
      );
    });
  }, [currentDate, state.events]);

  return {
    // State
    currentDate,
    calendarId,
    state,
    isViewOnly,
    
    // Navigation
    navigateMonth,
    
    // Event management
    saveEvent,
    deleteEvent,
    getCurrentMonthEvents,
    
    // App info
    updateAppInfo
  };
}