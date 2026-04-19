import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Event } from './types';
import LoginPage from './components/LoginPage';
import EventsPage from './components/EventsPage';
import EventDetailPage from './components/EventDetailPage';
import { Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

type AppView = 'events' | 'event-detail';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [view, setView] = useState<AppView>('events');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  if (view === 'event-detail' && selectedEvent) {
    return (
      <EventDetailPage
        event={selectedEvent}
        onBack={() => { setView('events'); setSelectedEvent(null); }}
      />
    );
  }

  return (
    <EventsPage
      onSelectEvent={(ev) => { setSelectedEvent(ev); setView('event-detail'); }}
    />
  );
}
