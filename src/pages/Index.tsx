import { useLocation } from 'react-router-dom';
import { FiscalCalendarApp } from '@/components/fiscal/FiscalCalendarApp';

const Index = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isViewOnly = !!params.get('view');
  const calendarId = params.get('view') || params.get('id') || undefined;

  return (
    <FiscalCalendarApp 
      isViewOnly={isViewOnly} 
      calendarId={calendarId} 
    />
  );
};

export default Index;
