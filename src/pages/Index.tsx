import { useEffect, useState } from 'react';
import { FiscalCalendarApp } from '@/components/fiscal/FiscalCalendarApp';

const Index = () => {
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [calendarId, setCalendarId] = useState<string | undefined>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('view');
    const editId = params.get('id');

    if (viewId) {
      setIsViewOnly(true);
      setCalendarId(viewId);
    } else if (editId) {
      setIsViewOnly(false);
      setCalendarId(editId);
    }
  }, []);

  return (
    <FiscalCalendarApp 
      isViewOnly={isViewOnly} 
      calendarId={calendarId} 
    />
  );
};

export default Index;
