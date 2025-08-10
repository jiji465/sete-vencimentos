import { useEffect, useState } from 'react';
import { FiscalCalendarApp } from '@/components/fiscal/FiscalCalendarApp';

const Index = () => {
  const [isViewOnly, setIsViewOnly] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get('view');
  });
  const [calendarId, setCalendarId] = useState<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('view');
    const editId = params.get('id');
    return viewId || editId || undefined;
  });

  return (
    <FiscalCalendarApp 
      isViewOnly={isViewOnly} 
      calendarId={calendarId} 
    />
  );
};

export default Index;
