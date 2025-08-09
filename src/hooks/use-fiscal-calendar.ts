import { useState, useCallback } from 'react';
import { FiscalEvent, CalendarState } from '@/types/fiscal';
import { generateCalendarId, parseLocalDate } from '@/lib/fiscal-utils';
import { useFiscalStorage } from './use-fiscal-storage';

interface UseFiscalCalendarProps {
  isViewOnly?: boolean;
  initialCalendarId?: string;
}

export function useFiscalCalendar({ isViewOnly = false, initialCalendarId }: UseFiscalCalendarProps = {}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarId] = useState(initialCalendarId || generateCalendarId());
  
  const { state, setState, loading, saving, saveData, saveDataDebounced, saveDataImmediate } = useFiscalStorage({
    calendarId,
    isViewOnly
  });

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
    const newState = {
      ...state,
      events: [...state.events, event]
    };
    setState(newState);
    saveDataImmediate(newState); // Immediate save for new events
  }, [state, setState, saveDataImmediate]);

  const updateEvent = useCallback((updatedEvent: FiscalEvent) => {
    const newState = {
      ...state,
      events: state.events.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    };
    setState(newState);
    saveDataImmediate(newState); // Immediate save for event updates
  }, [state, setState, saveDataImmediate]);

  const deleteEvent = useCallback((eventId: string) => {
    const newState = {
      ...state,
      events: state.events.filter(event => event.id !== eventId)
    };
    setState(newState);
    saveDataImmediate(newState); // Immediate save for deletions
  }, [state, setState, saveDataImmediate]);

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
    const newState = {
      ...state,
      appInfo: { ...state.appInfo, ...updates }
    };
    setState(newState);
    saveDataDebounced(newState); // Debounced save for frequent text changes
  }, [state, setState, saveDataDebounced]);

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

  const persistNow = useCallback(async () => {
    await saveDataImmediate(state);
  }, [saveDataImmediate, state]);

  return {
    // State
    currentDate,
    calendarId,
    state,
    isViewOnly,
    loading,
    saving,

    // Navigation
    navigateMonth,

    // Event management
    saveEvent,
    deleteEvent,
    getCurrentMonthEvents,

    // App info
    updateAppInfo,

    // Persist
    persistNow
  };
}